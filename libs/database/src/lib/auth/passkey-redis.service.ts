import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS } from '../redis';
import { UserType } from '../entities/enums/user-type.enum';

/**
 * Redis service for managing passkey registration challenges.
 * Challenges are stored temporarily during the registration flow.
 */
@Injectable()
export class PasskeyRedisService {
  private readonly logger = new Logger(PasskeyRedisService.name);
  private readonly CHALLENGE_TTL_SECONDS = 300; // 5 minutes

  constructor(@Inject(REDIS) private readonly redisService: RedisClientType) {}

  /**
   * Store a passkey registration challenge
   */
  async storeChallenge(
    userType: UserType,
    userId: number,
    challenge: string,
  ): Promise<void> {
    const key = this.getChallengeKey(userType, userId);
    await this.redisService.setEx(key, this.CHALLENGE_TTL_SECONDS, challenge);
    this.logger.debug(`Stored passkey challenge for ${userType}:${userId}`);
  }

  /**
   * Retrieve a stored challenge
   */
  async getChallenge(
    userType: UserType,
    userId: number,
  ): Promise<string | null> {
    const key = this.getChallengeKey(userType, userId);
    return this.redisService.get(key);
  }

  /**
   * Delete a challenge after use
   */
  async deleteChallenge(userType: UserType, userId: number): Promise<void> {
    const key = this.getChallengeKey(userType, userId);
    await this.redisService.del(key);
    this.logger.debug(`Deleted passkey challenge for ${userType}:${userId}`);
  }

  private getChallengeKey(userType: UserType, userId: number): string {
    return `passkey-challenge:${userType}:${userId}`;
  }

  // ============================================
  // Authentication Challenge Methods (for login)
  // ============================================

  /**
   * Store a passkey authentication challenge (for login flow)
   */
  async storeAuthChallenge(sessionId: string, challenge: string): Promise<void> {
    const key = this.getAuthChallengeKey(sessionId);
    await this.redisService.setEx(key, this.CHALLENGE_TTL_SECONDS, challenge);
    this.logger.debug(`Stored passkey auth challenge for session: ${sessionId}`);
  }

  /**
   * Retrieve a stored authentication challenge
   */
  async getAuthChallenge(sessionId: string): Promise<string | null> {
    const key = this.getAuthChallengeKey(sessionId);
    return this.redisService.get(key);
  }

  /**
   * Delete an authentication challenge after use
   */
  async deleteAuthChallenge(sessionId: string): Promise<void> {
    const key = this.getAuthChallengeKey(sessionId);
    await this.redisService.del(key);
    this.logger.debug(`Deleted passkey auth challenge for session: ${sessionId}`);
  }

  private getAuthChallengeKey(sessionId: string): string {
    return `passkey-auth-challenge:${sessionId}`;
  }
}
