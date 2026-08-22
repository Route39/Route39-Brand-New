// pubsub.module.ts
import { Module, Global } from '@nestjs/common';
import { PubSubService } from './pubsub.service';
import { RedisPubSubAdapter } from './pubsub.redis.adapter';
import { PUBSUB } from './pubsub.token';
import { getRedisUrl } from '../../config/redis.connection';

@Global()
@Module({
  providers: [
    {
      provide: PUBSUB,
      useFactory: () => {
        return new RedisPubSubAdapter(getRedisUrl());
      },
    },
    PubSubService,
  ],
  exports: [PUBSUB, PubSubService],
})
export class PubSubModule {}
