import { Inject, UseGuards } from '@nestjs/common';
import {
  Args,
  CONTEXT,
  Mutation,
  Resolver,
  Query,
  GraphQLISODateTime,
  ID,
} from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentGatewayEntity, PaymentMethodBase } from '@ridy/database';
import { Repository } from 'typeorm';
import { UserContext } from '../auth/authenticated-user';
import { GqlAuthGuard } from '../auth/jwt-gql-auth.guard';
import { StatisticsResult, TimeQuery } from './dto/earnings.dto';
import {
  TopUpWalletInput,
  TopUpWalletResponse,
  TopUpWalletStatus,
} from './dto/top-up-wallet.input';
import { EarningsService } from './earnings.service';
import { GiftCardDTO } from './dto/gift-card.dto';
import { CommonGiftCardService } from '@ridy/database';
import { SetupPaymentMethodDto } from './dto/setup_payment_method.dto';
import {
  IntentResult,
  SetupSavedPaymentMethodDecryptedBody,
} from '@ridy/database';
import { firstValueFrom } from 'rxjs';
import { CryptoService } from '@ridy/database';
import { HttpService } from '@nestjs/axios';
import { WalletService } from './wallet.service';
import { DriverEntity } from '@ridy/database';
import { RazorpayService } from '@ridy/database';
import { SharedDriverService } from '@ridy/database';
import { RazorpayOrderDTO } from './dto/razorpay-order.dto';
import {
  DriverRechargeTransactionType,
  TransactionAction,
  TransactionStatus,
} from '@ridy/database';

@UseGuards(GqlAuthGuard)
@Resolver()
export class WalletResolver {
  constructor(
    @InjectRepository(PaymentGatewayEntity)
    private gatewayRepo: Repository<PaymentGatewayEntity>,
    @InjectRepository(DriverEntity)
    private driverRepo: Repository<DriverEntity>,
    @Inject(CONTEXT) private context: UserContext,
    private earningsService: EarningsService,
    private commonGiftCardService: CommonGiftCardService,
    private httpService: HttpService,
    private cryptoService: CryptoService,
    private walletService: WalletService,
    private razorpayService: RazorpayService,
    private sharedDriverService: SharedDriverService,
  ) {}

  @Mutation(() => TopUpWalletResponse)
  async topUpWallet(
    @Args('input', { type: () => TopUpWalletInput }) input: TopUpWalletInput,
  ): Promise<TopUpWalletResponse> {
    const gateway = await this.gatewayRepo.findOneByOrFail({
      id: input.gatewayId,
    });
    const params = `userType=driver&userId=${this.context.req.user.id}&paymentGatewayId=${gateway.id}&amount=${input.amount}&currency=${input.currency}&returnUrl=${process.env.DRIVER_SERVER_URL}/payment_result`;
    return {
      status: TopUpWalletStatus.Redirect,
      url: `${process.env.GATEWAY_SERVER_URL}/pay?${params}`,
    };
  }

  @Mutation(() => RazorpayOrderDTO)
  async createRazorpayTopUpOrder(
    @Args('amount', { type: () => Number }) amount: number,
  ): Promise<RazorpayOrderDTO> {
    const order = await this.razorpayService.createOrder(
      amount,
      'INR',
      `topup_${this.context.req.user.id}_${Date.now()}`,
    );
    return {
      orderId: order.id,
      amount: amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID!,
    };
  }

  @Mutation(() => Boolean)
  async verifyRazorpayTopUp(
    @Args('razorpayOrderId', { type: () => String }) razorpayOrderId: string,
    @Args('razorpayPaymentId', { type: () => String }) razorpayPaymentId: string,
    @Args('razorpaySignature', { type: () => String }) razorpaySignature: string,
    @Args('amount', { type: () => Number }) amount: number,
  ): Promise<boolean> {
    const isValid = this.razorpayService.verifySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
    if (!isValid) {
      throw new Error('INVALID_PAYMENT_SIGNATURE');
    }
    await this.sharedDriverService.rechargeWallet({
      status: TransactionStatus.Done,
      driverId: this.context.req.user.id,
      currency: 'INR',
      action: TransactionAction.Recharge,
      rechargeType: DriverRechargeTransactionType.InAppPayment,
      amount: amount,
      requestId: null,
      operatorId: null,
      paymentGatewayId: null,
      refrenceNumber: razorpayPaymentId,
      description: 'Razorpay wallet top-up',
      giftCardId: null,
    });
    return true;
  }

  @Query(() => StatisticsResult)
  async getStats(
    @Args('timeframe', { type: () => TimeQuery }) timeFrame: TimeQuery,
  ) {
    return this.earningsService.getStats(this.context.req.user.id, timeFrame);
  }

  @Query(() => StatisticsResult)
  async getStatsNew(
    @Args('timeframe', { type: () => TimeQuery }) timeFrame: TimeQuery,
    @Args('startDate', { type: () => GraphQLISODateTime }) startDate: Date,
    @Args('endDate', { type: () => GraphQLISODateTime }) endDate: Date,
  ) {
    return this.earningsService.getStatsNew({
      driverId: this.context.req.user.id,
      timeFrame,
      startDate,
      endDate,
    });
  }

  @Mutation(() => SetupPaymentMethodDto)
  async setupPaymentMethod(
    @Args('gatewayId', { type: () => ID }) gatewayId: number,
  ): Promise<SetupPaymentMethodDto> {
    const user = await this.driverRepo.findOneOrFail({
      where: { id: this.context.req.user.id },
      relations: {
        wallet: true,
      },
    });
    const walletsLargestBalance =
      user.wallet!.length > 0
        ? user.wallet!.reduce((prev, current) => {
            return prev.balance > current.balance ? prev : current;
          })
        : { balance: 0, currency: 'USD' };
    const obj: SetupSavedPaymentMethodDecryptedBody = {
      gatewayId: gatewayId.toString(),
      userType: 'driver',
      currency: walletsLargestBalance.currency ?? 'USD',
      userId: this.context.req.user.id.toString(),
      returnUrl: `${
        process.env.DRIVER_APPLICATION_ID ?? 'default.driver.redirection'
      }://`,
    };
    const encrypted = await this.cryptoService.encrypt(JSON.stringify(obj));
    const result = await firstValueFrom(
      this.httpService.post<IntentResult>(
        `${process.env.GATEWAY_SERVER_URL}/setup_saved_payment_method`,
        {
          token: encrypted,
        },
      ),
    );
    return result.data;
  }

  @Mutation(() => GiftCardDTO)
  async redeemGiftCard(
    @Args('code', { type: () => String }) code: string,
  ): Promise<GiftCardDTO> {
    return this.commonGiftCardService.redeemGiftCard({
      code,
      userType: 'driver',
      userId: this.context.req.user.id,
    });
  }

  @Mutation(() => [PaymentMethodBase])
  async markPaymentMethodAsDefault(
    @Args('id', { type: () => ID }) savedPaymentMethodId: number,
  ): Promise<PaymentMethodBase[]> {
    return this.walletService.markPaymentMethodAsDefault({
      userId: this.context.req.user.id,
      savedPaymentMethodId,
    });
  }

  @Mutation(() => Boolean)
  async deleteSavedPaymentMethod(
    @Args('id', { type: () => ID }) savedPaymentMethodId: number,
  ): Promise<boolean> {
    await this.walletService.deletePaymentMethod({
      userId: this.context.req.user.id,
      savedPaymentMethodId,
    });
    return true;
  }

  @Query(() => [PaymentMethodBase])
  async paymentMethods(): Promise<PaymentMethodBase[]> {
    const savedMethods = await this.walletService.getPaymentMethodsForDriver({
      userId: this.context.req.user.id,
    });
    return savedMethods;
  }
}
