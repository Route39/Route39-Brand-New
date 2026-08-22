import { ForbiddenError } from '@nestjs/apollo';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS } from '../redis';
import { UserType } from '../entities/enums/user-type.enum';

@Injectable()
export class EmailAuthRedisService {
  private readonly logger = new Logger(EmailAuthRedisService.name);

  constructor(@Inject(REDIS) private readonly redisService: RedisClientType) {}

  async createEmailVerificationCode(
    input: EmailVerifyInput,
  ): Promise<{ hash: string }> {
    const hash = Math.random().toString(36).substring(7);
    const ttlSeconds = input.ttlSeconds ?? 180; // Default 3 minutes

    const pipeline = this.redisService.multi();
    pipeline.hSet(`email-verify:${hash}`, 'email', input.email.toLowerCase());
    pipeline.hSet(`email-verify:${hash}`, 'userType', input.userType);
    pipeline.hSet(`email-verify:${hash}`, 'code', input.code);
    if (input.userId) {
      pipeline.hSet(
        `email-verify:${hash}`,
        'userId',
        input.userId.toString(),
      );
    }
    pipeline.expire(`email-verify:${hash}`, ttlSeconds);
    await pipeline.exec();

    this.logger.log(
      `Created email verification code for ${input.email} (${input.userType})`,
    );
    return { hash };
  }

  async isEmailVerificationCodeValid(
    hash: string,
    code: string,
  ): Promise<EmailVerifyHash | null> {
    const verifyHash = (await this.redisService.hGetAll(
      `email-verify:${hash}`,
    )) as unknown as EmailVerifyHash;

    this.logger.debug(verifyHash, 'email-verifyHash');

    if (!verifyHash || !verifyHash.email) {
      throw new ForbiddenError('EXPIRED');
    }

    // Support demo mode with hardcoded code
    if (process.env.DEMO_MODE != null || verifyHash.code === code) {
      return verifyHash;
    } else {
      throw new ForbiddenError('INVALID');
    }
  }

  async deleteEmailVerificationCode(hash: string): Promise<void> {
    await this.redisService.del(`email-verify:${hash}`);
  }

  async getVerificationAttempts(email: string): Promise<number> {
    const key = `email-verify-attempts:${email.toLowerCase()}`;
    const attempts = await this.redisService.get(key);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  async incrementVerificationAttempts(
    email: string,
    cooldownSeconds: number,
  ): Promise<number> {
    const key = `email-verify-attempts:${email.toLowerCase()}`;
    const attempts = await this.redisService.incr(key);

    // Set or refresh expiry
    await this.redisService.expire(key, cooldownSeconds);

    return attempts;
  }

  async clearVerificationAttempts(email: string): Promise<void> {
    const key = `email-verify-attempts:${email.toLowerCase()}`;
    await this.redisService.del(key);
  }

  async isEmailOnCooldown(
    email: string,
    maxAttempts: number,
  ): Promise<boolean> {
    const attempts = await this.getVerificationAttempts(email);
    return attempts >= maxAttempts;
  }
}

export class EmailVerifyInput {
  email!: string;
  userType!: UserType;
  code!: string;
  userId?: number;
  ttlSeconds?: number;
}

export class EmailVerifyHash {
  email!: string;
  userType!: string;
  code!: string;
  userId?: string;
}
