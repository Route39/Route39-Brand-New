import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  Logger,
  Query,
  UploadedFile,
} from '@nestjs/common';
import {
  ActiveOrderCommonRedisService,
  DriverEventType,
  DriverEphemeralMessageType,
  DriverRedisService,
  PubSubService,
  RiderEphemeralMessageType,
  RiderOrderUpdateType,
  RiderRechargeTransactionType,
  RiderRedisService,
  UploadImageInterceptor,
} from '@ridy/database';
import { TransactionAction } from '@ridy/database';
import { TransactionStatus } from '@ridy/database';
import { Response, Request } from 'express';

import { RestJwtAuthGuard } from './auth/rest-jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomerEntity } from '@ridy/database';
import { Repository } from 'typeorm';
import { MediaEntity } from '@ridy/database';
import { CryptoService } from '@ridy/database';
import { SharedOrderService } from '@ridy/database';
import { OrderStatus } from '@ridy/database';
import { PaymentEntity } from '@ridy/database';
import { SharedCustomerWalletService } from '@ridy/database';
import urlJoin from 'proper-url-join';
import { version } from '../../../../package.json';

@Controller()
export class RiderAPIController {
  constructor(
    private readonly sharedCustomerWalletService: SharedCustomerWalletService,
    private sharedOrderService: SharedOrderService,
    private activeOrderRedisService: ActiveOrderCommonRedisService,
    private cryptoService: CryptoService,
    private readonly pubsub: PubSubService,
    private readonly driverRedisService: DriverRedisService,
    private readonly riderRedisService: RiderRedisService,
    @InjectRepository(CustomerEntity)
    private riderRepository: Repository<CustomerEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepository: Repository<PaymentEntity>,
    @InjectRepository(MediaEntity)
    private mediaRepository: Repository<MediaEntity>,
  ) {}

  @Get()
  async defaultPath(@Res() res: Response) {
    res.send(`✅ Rider API microservice running.\nVersion: ${version}`);
  }

  @Get('payment_result')
  async verifyPayment(
    @Query() query: { token: string; redirect: '1' | '0' },
    @Res() res: Response,
  ): Promise<void> {
    const token = query.token;
    const decrypted = await this.cryptoService.decrypt(token);
    Logger.log('Payment:' + JSON.stringify(decrypted));

    if (decrypted.userType == 'client' || decrypted.userType == 'rider') {
      if (decrypted.status == 'success') {
        const payment = await this.paymentRepository.findOne({
          where: { transactionNumber: decrypted.transactionNumber },
        });

        await this.sharedCustomerWalletService.rechargeWallet({
          riderId: decrypted.userId,
          amount: decrypted.amount,
          currency: decrypted.currency,
          refrenceNumber: decrypted.transactionNumber,
          action: TransactionAction.Recharge,
          rechargeType: RiderRechargeTransactionType.InAppPayment,
          paymentGatewayId: decrypted.gatewayId,
          status: TransactionStatus.Done,
        });
        await this.paymentRepository.delete({
          transactionNumber: decrypted.transactionNumber,
        });

        const orderId = decrypted.orderId ?? payment?.orderNumber;
        const order =
          orderId == null
            ? null
            : await this.activeOrderRedisService.getActiveOrder(
                orderId.toString(),
              );
        if (order?.status == OrderStatus.WaitingForPostPay) {
          // 1. Fetch driver/rider metadata BEFORE finish() which may expire the driver
          const [driver, rider] = await Promise.all([
            this.driverRedisService.getOnlineDriverMetaData(order.driverId),
            this.riderRedisService.getOnlineRider(order.riderId),
          ]);
          // 2. Settle finances + save to DB + remove from Redis
          await this.sharedOrderService.finish(parseInt(order.id), 0, false);
          await Promise.all([
            this.riderRedisService.createEphemeralMessage(order.riderId, {
              type: RiderEphemeralMessageType.RateDriver,
              orderId: parseInt(order.id),
              serviceImageUrl: order.serviceImageAddress,
              serviceName: order.serviceName,
              vehicleName: driver?.vehicleName ?? null,
              driverFullName: driver?.firstName ?? order.driverFirstName ?? null,
              driverProfileUrl: driver?.avatarImageAddress ?? order.driverAvatarUrl ?? null,
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
            }),
            this.driverRedisService.createEphemeralMessage(order.driverId!, {
              type: DriverEphemeralMessageType.RateRider,
              orderId: parseInt(order.id),
              serviceImageUrl: order.serviceImageAddress,
              serviceName: order.serviceName,
              riderFullName: rider?.firstName ?? order.riderFirstName ?? null,
              riderProfileUrl: rider?.profileImageUrl ?? order.riderAvatarUrl ?? null,
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
            }),
          ]);
          // 3. OrderCompleted removes order from rider stream AND triggers getEphemeralMessages().
          //    ActiveOrderCompleted triggers getEphemeralMessages() on driver side.
          this.publishOrderStatusUpdate({
            orderId: parseInt(order.id),
            riderId: parseInt(order.riderId),
            driverId: parseInt(order.driverId!),
            status: OrderStatus.Finished,
          });
        } else if (order?.status == OrderStatus.WaitingForPrePay) {
          await this.sharedOrderService.processPrePay(order.id);
          this.publishOrderStatusUpdate({
            orderId: order.id,
            riderId: order.riderId,
            driverId: order.driverId!,
            status: order.status,
          });
        }
        if (query.redirect == null || query.redirect == '1') {
          return res.redirect(
            301,
            `${
              process.env.RIDER_APPLICATION_ID ?? 'default.rider.redirection'
            }://`,
          );
        }
        res.send(
          'Transaction successful. Close this page and go back to the app.',
        );
      } else if (decrypted.status == 'authorized') {
        const order =
          decrypted.orderId == null
            ? null
            : await this.activeOrderRedisService.getActiveOrder(
                decrypted.orderId!,
              );
        if (!order) {
          res.status(404).send('Order not found');
        }
        await this.sharedOrderService.processPrePay(
          order!.id,
          decrypted.amount,
        );
        this.publishOrderStatusUpdate({
          orderId: order!.id,
          riderId: order!.riderId,
          driverId: order!.driverId!,
          status: order!.status,
        });
        res.redirect(
          301,
          `${
            process.env.RIDER_APPLICATION_ID ?? 'default.rider.redirection'
          }://`,
        );
      } else {
        res.redirect(
          301,
          `${
            process.env.RIDER_APPLICATION_ID ?? 'default.rider.redirection'
          }://`,
        );
      }
    }
  }

  @Get('saved_payment_method_charged')
  async savedPaymentMethodCharged(
    @Query() query: { token: string; redirect: '1' | '0' },
    @Res() res: Response,
  ) {
    Logger.log(
      `Saved payment method charged started with token: ${query.token?.substring(0, 10)}...`,
    );

    const token = query.token;
    const decrypted = await this.cryptoService.decrypt(token);
    Logger.log(
      `Decrypted payment data: ${JSON.stringify({
        status: decrypted.status,
        transactionNumber: decrypted.transactionNumber,
        orderId: decrypted.orderId,
        amount: decrypted.amount,
      })}`,
    );

    const payment = await this.paymentRepository.findOneOrFail({
      where: { transactionNumber: decrypted.transactionNumber },
    });
    Logger.log(
      `Found payment record: userId=${payment.userId}, amount=${payment.amount}, currency=${payment.currency}`,
    );

    if (decrypted.status == 'success') {
      Logger.log(`Processing successful payment for user ${payment.userId}`);

      await this.sharedCustomerWalletService.rechargeWallet({
        riderId: parseInt(payment.userId),
        amount: payment.amount,
        currency: payment.currency,
        refrenceNumber: payment.transactionNumber,
        action: TransactionAction.Recharge,
        rechargeType: RiderRechargeTransactionType.InAppPayment,
        paymentGatewayId: payment.gatewayId,
        savedPaymentMethodId: payment.savedPaymentMethodId,
        status: TransactionStatus.Done,
      });
      Logger.log(
        `Wallet recharged successfully for rider ${payment.userId} with amount ${payment.amount}`,
      );

      await this.paymentRepository.delete({
        transactionNumber: decrypted.transactionNumber,
      });
      Logger.log(
        `Payment record deleted for transaction ${decrypted.transactionNumber}`,
      );

      const orderId = decrypted.orderId ?? payment.orderNumber;
      Logger.log(
        `Order ID to process: ${orderId} (from ${decrypted.orderId ? 'decrypted' : 'payment record'})`,
      );

      const order =
        orderId == null
          ? null
          : await this.activeOrderRedisService.getActiveOrder(
              orderId.toString(),
            );

      if (order) {
        Logger.log(
          `Found associated order ${order.id} with status: ${order.status}`,
        );
      } else if (orderId) {
        Logger.log(`Order ${orderId} not found in active orders`);
      } else {
        Logger.log(`No order ID provided in payment data or payment record`);
      }

      if (order?.status == OrderStatus.WaitingForPostPay) {
        Logger.log(`Processing post-payment for order ${order.id}`);
        // Fetch driver/rider metadata BEFORE finish() which may expire the driver
        const [driver, rider] = await Promise.all([
          this.driverRedisService.getOnlineDriverMetaData(order.driverId),
          this.riderRedisService.getOnlineRider(order.riderId),
        ]);
        // Payment already processed externally, don't deduct from wallet again
        await this.sharedOrderService.finish(
          parseInt(order.id),
          0,
          false,
        );
        Logger.log(`Order ${order.id} finished`);
        await Promise.all([
          this.riderRedisService.createEphemeralMessage(order.riderId, {
            type: RiderEphemeralMessageType.RateDriver,
            orderId: parseInt(order.id),
            serviceImageUrl: order.serviceImageAddress,
            serviceName: order.serviceName,
            vehicleName: driver?.vehicleName ?? null,
            driverFullName: driver?.firstName ?? null,
            driverProfileUrl: driver?.avatarImageAddress ?? null,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
          }),
          this.driverRedisService.createEphemeralMessage(order.driverId!, {
            type: DriverEphemeralMessageType.RateRider,
            orderId: parseInt(order.id),
            serviceImageUrl: order.serviceImageAddress,
            serviceName: order.serviceName,
            riderFullName: rider?.firstName ?? null,
            riderProfileUrl: rider?.profileImageUrl ?? null,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
          }),
        ]);
        Logger.log(`Ephemeral review messages created for order ${order.id}`);
        // OrderCompleted removes order from rider stream AND triggers getEphemeralMessages().
        // ActiveOrderCompleted triggers getEphemeralMessages() on driver side.
        this.publishOrderStatusUpdate({
          orderId: parseInt(order!.id),
          riderId: parseInt(order!.riderId),
          driverId: parseInt(order!.driverId!),
          status: OrderStatus.Finished,
        });
      } else if (order?.status == OrderStatus.WaitingForPrePay) {
        Logger.log(`Processing pre-payment for order ${order.id}`);
        await this.sharedOrderService.processPrePay(order.id);
        Logger.log(`Pre-payment processed for order ${order.id}`);
        this.publishOrderStatusUpdate({
          orderId: parseInt(order.id),
          riderId: parseInt(order.riderId),
          driverId: parseInt(order.driverId!),
          status: OrderStatus.Requested,
        });
      }
    } else if (decrypted.status == 'authorized') {
      Logger.log(
        `Processing authorized payment with amount: ${decrypted.amount}`,
      );

      // ✅ FIX: Use payment.orderNumber as fallback if decrypted.orderId is not available
      const orderId = decrypted.orderId ?? payment.orderNumber;
      Logger.log(
        `Order ID to process: ${orderId} (from ${decrypted.orderId ? 'decrypted' : 'payment record'})`,
      );

      const order =
        orderId == null
          ? null
          : await this.activeOrderRedisService.getActiveOrder(
              orderId.toString(),
            );
      if (!order) {
        Logger.error(`Order ${orderId} not found for authorized payment`);
        res.status(404).send('Order not found');
        return;
      }

      Logger.log(`Processing pre-payment authorization for order ${order.id}`);
      await this.sharedOrderService.processPrePay(
        parseInt(order!.id),
        decrypted.amount,
      );
      Logger.log(`Pre-payment authorization completed for order ${order.id}`);

      this.publishOrderStatusUpdate({
        orderId: parseInt(order.id),
        riderId: parseInt(order.riderId),
        driverId: parseInt(order.driverId!),
        status: order.status,
      });
    } else {
      Logger.warn(`Unhandled payment status: ${decrypted.status}`);
    }

    if (query.redirect == null || query.redirect == '1') {
      Logger.log(`Redirecting to rider app`);
      res.redirect(
        301,
        `${process.env.RIDER_APPLICATION_ID ?? 'default.rider.redirection'}://`,
      );
    } else {
      Logger.log(`Sending success message without redirect`);
      res.send(
        'Transaction successful. Close this page and go back to the app.',
      );
    }

    Logger.log(`Saved payment method charged completed successfully`);
  }

  @Get('success_attach')
  async successAttach(@Req() req: Request, @Res() res: Response) {
    this._redirectToApp(res);
  }

  _redirectToApp(res: Response) {
    return res.redirect(
      301,
      `${process.env.RIDER_APPLICATION_ID ?? 'default.rider.redirection'}://`,
    );
  }

  private async publishOrderStatusUpdate(input: {
    orderId: number;
    driverId: number;
    riderId: number;
    status: OrderStatus;
  }) {
    this.pubsub.publish(
      'rider.order.updated',
      {
        riderId: input.riderId,
      },
      {
        type: input.status === OrderStatus.Finished
          ? RiderOrderUpdateType.OrderCompleted
          : RiderOrderUpdateType.StatusUpdated,
        orderId: input.orderId,
        riderId: input.riderId,
        status: input.status,
      },
    );
    this.pubsub.publish(
      'driver.event',
      {
        driverId: input.driverId,
      },
      {
        type: input.status === OrderStatus.Finished
          ? DriverEventType.ActiveOrderCompleted
          : DriverEventType.ActiveOrderUpdated,
        orderId: input.orderId,
        driverId: input.driverId,
        status: input.status,
      },
    );
  }

  @Post('upload_profile')
  @UseGuards(RestJwtAuthGuard)
  @UploadImageInterceptor('file')
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const insert = await this.mediaRepository.insert({
      address: file.filename,
    });
    await this.riderRepository.update((req as unknown as any).user.id, {
      mediaId: insert.raw.insertId,
    });
    res.send({
      __typename: 'Media',
      id: insert.raw.insertId.toString(),
      address: urlJoin(process.env.CDN_URL, file.filename),
    });
  }

  @Get('health')
  healthCheck() {
    return { status: 'ok' };
  }
}
