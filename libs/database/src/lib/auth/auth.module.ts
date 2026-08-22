import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthMethodEntity } from '../entities/auth-method.entity';
import { AuthVerificationConfigEntity } from '../entities/auth-verification-config.entity';
import { EmailAuthRedisService } from './email-auth-redis.service';
import { PasskeyRedisService } from './passkey-redis.service';
import { SharedAuthMethodService } from './shared-auth-method.service';
import { SharedPasskeyService } from './shared-passkey.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthMethodEntity, AuthVerificationConfigEntity]),
    EmailModule,
  ],
  providers: [
    EmailAuthRedisService,
    PasskeyRedisService,
    SharedAuthMethodService,
    SharedPasskeyService,
  ],
  exports: [
    EmailAuthRedisService,
    PasskeyRedisService,
    SharedAuthMethodService,
    SharedPasskeyService,
  ],
})
export class SharedAuthModule {}
