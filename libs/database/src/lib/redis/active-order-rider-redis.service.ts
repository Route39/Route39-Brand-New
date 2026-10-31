import { Inject, Injectable } from '@nestjs/common';
import { REDIS } from './redis-token';
import { RedisClientType } from 'redis';

@Injectable()
export class ActiveOrderRiderRedisService {
  constructor(@Inject(REDIS) readonly redisService: RedisClientType) {}
  async updateLastSeenForRider(orderId: number, lastSeenAt: Date) {
    const key = `active_order:${orderId}`;
    const res = (await this.redisService.json.arrLen(key, '$.chatMessages')) as unknown;
    const len = Array.isArray(res) ? Number(res[0] ?? 0) : Number(res ?? 0);
    if (!len) return;
    const pipeline = this.redisService.multi();
    for (let i = 0; i < len; i++) {
      pipeline.json.set(key, `$.chatMessages[${i}].riderLastSeenAt`, lastSeenAt.getTime());
    }
    await pipeline.exec();
  }
}
