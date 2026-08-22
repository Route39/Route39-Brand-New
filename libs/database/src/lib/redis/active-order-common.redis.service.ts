import { Inject, Injectable, Logger } from '@nestjs/common';
import { ActiveOrderRedisSnapshot } from './models/active-order-redis-snapshot';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { OrderStatus, TaxiOrderType } from '../entities';
import { Point, RideOptionDTO, WaypointBase } from '../interfaces';
import { TaxiServiceRedisService } from './taxi-service.redis.service';
import { PaymentMethodBase } from '../interfaces/payment-method.dto';
import { PricingMode } from '../entities/taxi/enums/pricing-mode.enum';
import { RangePolicy } from '../entities/taxi/enums/range-policy.enum';
import { REDIS } from './redis-token';
import { RedisClientType } from 'redis';

@Injectable()
export class ActiveOrderCommonRedisService {
  constructor(
    @Inject(REDIS) private readonly redisService: RedisClientType,
    private readonly taxiServiceRedisService: TaxiServiceRedisService,
  ) {}

  async getActiveOrders(
    orderId: string[],
  ): Promise<ActiveOrderRedisSnapshot[]> {
    const pipeline = this.redisService.multi();
    for (const id of orderId) {
      pipeline.json.get(`active_order:${id}`);
    }
    const results = await pipeline.exec();
    const orders: ActiveOrderRedisSnapshot[] = [];
    results.forEach((result, idx) => {
      if (result === null) {
        return;
      }
      const inst = plainToInstance(ActiveOrderRedisSnapshot, result);
      if (inst) {
        orders.push(inst);
      } else {
        Logger.debug(
          `Failed to transform active order for id ${orderId[idx]}, result: ${JSON.stringify(
            result,
          )}`,
        );
      }
    });
    return orders;
  }

  async getActiveOrder(orderId: string): Promise<ActiveOrderRedisSnapshot> {
    const result = await this.redisService.json.get(`active_order:${orderId}`);
    return result === null
      ? null
      : plainToInstance(ActiveOrderRedisSnapshot, result);
  }

  async addMessageToOrder(input: {
    orderId: string;
    message: string;
    user: 'rider' | 'driver';
  }) {
    const order = await this.getActiveOrder(input.orderId);
    if (!order) {
      throw new Error(`Active order with ID ${input.orderId} not found`);
    }
    order.chatMessages.push({
      content: input.message,
      createdAt: new Date(),
      isFromDriver: input.user === 'driver',
    });
    await this.redisService.json.set(
      `active_order:${input.orderId}`,
      '$.chatMessages',
      instanceToPlain(order.chatMessages),
    );
  }

  async createActiveOrder(input: {
    id: string;
    status: OrderStatus;
    type: TaxiOrderType;
    currency: string;
    createdAt: Date;
    scheduledAt?: Date;
    pickupEta: Date;
    waitMinutes?: number;
    dropoffEta: Date;
    driverId: string;
    riderId: string;
    fleetId?: string;
    serviceId: string;
    serviceName: string;
    serviceImageAddress: string;
    estimatedDistance: number;
    estimatedDuration: number;
    driverDirections: Point[];
    tripDirections: Point[];
    couponCode?: string;
    couponDiscount?: number;
    paymentMethod: PaymentMethodBase;
    costEstimateForRider: number;
    costEstimateForDriver: number;
    costMin?: number;
    costMax?: number;
    pricingMode: PricingMode;
    rangePolicy?: RangePolicy;
    totalPaid: number;
    waypoints: WaypointBase[];
    options: RideOptionDTO[];
  }): Promise<void> {
    const activeOrder: ActiveOrderRedisSnapshot = {
      ...input,
      currentLegIndex: 0,
      chatMessages: [],
      commissionDeducted: false,
      actualDistance: 0,
      actualDuration: 0,
    };
    await this.redisService.json.set(
      `active_order:${activeOrder.id}`,
      '$',
      instanceToPlain(activeOrder),
    );
  }

  async deleteOrder(orderId: string) {
    const order = await this.getActiveOrder(orderId);
    if (!order) return;

    const riderKey = `rider:${order.riderId}`;
    const driverKey = order.driverId ? `driver:${order.driverId}` : undefined;
    const orderKey = `active_order:${orderId}`;
    await this.redisService.unlink(orderKey);
    const removeOrderIdFromArray = async (key: string) => {
      const exists = await this.redisService.exists(key);
      if (!exists) {
        Logger.debug(`Key ${key} does not exist, skipping order removal`);
        return;
      }

      try {
        // Get current activeOrderIds - use legacy path syntax to get direct value
        const currentArray = await this.redisService.json.get(key, {
          path: '.activeOrderIds',
        });

        if (!currentArray) {
          Logger.debug(`No activeOrderIds found for ${key}`);
          return;
        }

        // Handle if it's corrupted to an object
        let arrayToFilter: string[];
        if (Array.isArray(currentArray)) {
          arrayToFilter = currentArray;
        } else if (typeof currentArray === 'object') {
          arrayToFilter = Object.values(currentArray) as string[];
        } else {
          Logger.warn(`Unexpected activeOrderIds type for ${key}: ${typeof currentArray}`);
          return;
        }

        // Filter out the orderId
        const filteredArray = arrayToFilter.filter(
          (id) => String(id) !== String(orderId),
        );

        if (filteredArray.length < arrayToFilter.length) {
          Logger.debug(
            `Removing orderId ${orderId} from ${key}, was ${arrayToFilter.length}, now ${filteredArray.length}`,
          );
          await this.redisService.json.set(key, '.activeOrderIds', filteredArray);
        } else {
          Logger.debug(`OrderId ${orderId} not found in ${key}.activeOrderIds`);
        }
      } catch (error) {
        Logger.error(`Error removing orderId ${orderId} from ${key}: ${error}`);
      }
    };
    await removeOrderIdFromArray(riderKey);
    if (driverKey) {
      await removeOrderIdFromArray(driverKey);
    }
  }

  async updateOrderStatus(
    id: string,
    update: Partial<ActiveOrderRedisSnapshot>,
  ) {
    const pipeline = this.redisService.multi();
    Object.entries(update).forEach(([key, value]) => {
      pipeline.json.set(
        `active_order:${id}`,
        `$.${key}`,
        instanceToPlain(value),
      );
    });
    await pipeline.exec();
  }

  async updateOrderWaitTime(
    orderId: string,
    waitMinutes: number,
  ): Promise<ActiveOrderRedisSnapshot> {
    const pipeline = this.redisService.multi();
    const order = await this.getActiveOrder(orderId);
    const service = await this.taxiServiceRedisService.getTaxiServiceById(
      order.serviceId,
    );
    const previousWaitCost =
      service.waitCostPerMinute * (order.waitMinutes ?? 0);
    const newWaitCost = service.waitCostPerMinute * waitMinutes;

    pipeline.json.set(`active_order:${orderId}`, '$.waitMinutes', waitMinutes);
    pipeline.json.set(
      `active_order:${orderId}`,
      '$.costEstimateForRider',
      order.costEstimateForRider - previousWaitCost + newWaitCost,
    );
    pipeline.json.set(
      `active_order:${orderId}`,
      '$.costEstimateForDriver',
      order.costEstimateForDriver - previousWaitCost + newWaitCost,
    );
    await pipeline.exec();
    return this.getActiveOrder(orderId);
  }
}
