import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS } from './redis-token';

@Injectable()
export class ActiveOrderDriverRedisService {
  constructor(@Inject(REDIS) private readonly redisService: RedisClientType) {}

  async updateLastSeenForDriver(orderId: number, lastSeenAt: Date) {
    const key = `active_order:${orderId}`;
    const res = (await this.redisService.json.arrLen(key, '$.chatMessages')) as unknown;
    const len = Array.isArray(res) ? Number(res[0] ?? 0) : Number(res ?? 0);
    if (!len) return;
    const pipeline = this.redisService.multi();
    for (let i = 0; i < len; i++) {
      pipeline.json.set(key, `$.chatMessages[${i}].driverLastSeenAt`, lastSeenAt.getTime());
    }
    await pipeline.exec();
  }
}
