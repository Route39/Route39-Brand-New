import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthMethodEntity } from '../entities/auth-method.entity';
import { AuthVerificationConfigEntity } from '../entities/auth-verification-config.entity';
import { AuthMethodType } from '../entities/enums/auth-method-type.enum';
import { UserType } from '../entities/enums/user-type.enum';
import { EmailAuthRedisService } from './email-auth-redis.service';
import { EmailNotificationService } from '../email/email-notification.service';

@Injectable()
export class SharedAuthMethodService {
  private readonly logger = new Logger(SharedAuthMethodService.name);

  constructor(
    @InjectRepository(AuthMethodEntity)
    private authMethodRepository: Repository<AuthMethodEntity>,
    @InjectRepository(AuthVerificationConfigEntity)
    private authVerificationConfigRepository: Repository<AuthVerificationConfigEntity>,
    private emailAuthRedisService: EmailAuthRedisService,
    private emailNotificationService: EmailNotificationService,
  ) {}

  /**
   * Find a user by their email address
   */
  async findUserByEmail(
    userType: UserType,
    email: string,
  ): Promise<number | null> {
    const authMethod = await this.authMethodRepository.findOne({
      where: {
        userType,
        type: AuthMethodType.EMAIL,
        identifier: email.toLowerCase(),
      },
    });

    return authMethod?.userId ?? null;
  }

  /**
   * Find a user by their phone number
   */
  async findUserByPhone(
    userType: UserType,
    phone: string,
  ): Promise<number | null> {
    const authMethod = await this.authMethodRepository.findOne({
      where: {
        userType,
        type: AuthMethodType.PHONE,
        identifier: phone,
      },
    });

    return authMethod?.userId ?? null;
  }

  /**
   * Link an email to an existing user account
   */
  async linkEmail(
    userType: UserType,
    userId: number,
    email: string,
  ): Promise<AuthMethodEntity> {
    const existingAuthMethod = await this.authMethodRepository.findOne({
      where: {
        userType,
        userId,
        type: AuthMethodType.EMAIL,
      },
    });

    if (existingAuthMethod) {
      // Update existing email
      existingAuthMethod.identifier = email.toLowerCase();
      existingAuthMethod.isVerified = false;
      existingAuthMethod.updatedAt = new Date();
      return this.authMethodRepository.save(existingAuthMethod);
    }

    // Create new auth method
    const authMethod = this.authMethodRepository.create({
      userType,
      userId,
      type: AuthMethodType.EMAIL,
      identifier: email.toLowerCase(),
      isVerified: false,
      isPrimary: false,
    });

    return this.authMethodRepository.save(authMethod);
  }

  /**
   * Link a phone number to a user account
   */
  async linkPhone(
    userType: UserType,
    userId: number,
    phone: string,
    isVerified = true,
    isPrimary = true,
  ): Promise<AuthMethodEntity> {
    const existingAuthMethod = await this.authMethodRepository.findOne({
      where: {
        userType,
        userId,
        type: AuthMethodType.PHONE,
      },
    });

    if (existingAuthMethod) {
      existingAuthMethod.identifier = phone;
      existingAuthMethod.isVerified = isVerified;
      existingAuthMethod.isPrimary = isPrimary;
      existingAuthMethod.updatedAt = new Date();
      return this.authMethodRepository.save(existingAuthMethod);
    }

    const authMethod = this.authMethodRepository.create({
      userType,
      userId,
      type: AuthMethodType.PHONE,
      identifier: phone,
      isVerified,
      isPrimary,
    });

    return this.authMethodRepository.save(authMethod);
  }

  /**
   * Check if there's an existing account with this email and auto-link if appropriate
   * Returns the existing user ID if found, along with verification requirements
   */
  async autoLinkIfEmailMatches(
    userType: UserType,
    email: string,
  ): Promise<{ userId: number; requiresVerification: boolean } | null> {
    // First, check if email already exists in auth_method table
    const existingAuthMethod = await this.authMethodRepository.findOne({
      where: {
        userType,
        type: AuthMethodType.EMAIL,
        identifier: email.toLowerCase(),
      },
    });

    if (existingAuthMethod) {
      const requiresVerification = await this.isVerificationRequired(
        userType,
        AuthMethodType.EMAIL,
      );
      return {
        userId: existingAuthMethod.userId,
        requiresVerification: !existingAuthMethod.isVerified && requiresVerification,
      };
    }

    return null;
  }

  /**
   * Check if verification is required for a given user type and auth method
   */
  async isVerificationRequired(
    userType: UserType,
    authMethodType: AuthMethodType,
  ): Promise<boolean> {
    const config = await this.getVerificationConfig(userType, authMethodType);
    return config?.verificationRequired ?? false;
  }

  /**
   * Get the verification configuration for a user type and auth method
   */
  async getVerificationConfig(
    userType: UserType,
    authMethodType: AuthMethodType,
  ): Promise<AuthVerificationConfigEntity | null> {
    return this.authVerificationConfigRepository.findOne({
      where: { userType, authMethodType },
    });
  }

  /**
   * Send email verification code
   */
  async sendEmailVerification(
    email: string,
    userType: UserType,
    firstName?: string,
    userId?: number,
  ): Promise<{ hash: string }> {
    const isDemoMode = process.env.DEMO_MODE?.toLowerCase() === 'true';

    // Get verification config
    const config = await this.getVerificationConfig(
      userType,
      AuthMethodType.EMAIL,
    );
    const codeLength = config?.codeLength ?? 6;
    const ttlSeconds = config?.codeTtlSeconds ?? 180;
    const maxAttempts = config?.maxAttempts ?? 5;

    // Check if user is on cooldown (skip in demo mode)
    if (!isDemoMode) {
      const isOnCooldown = await this.emailAuthRedisService.isEmailOnCooldown(
        email,
        maxAttempts,
      );
      if (isOnCooldown) {
        throw new Error('TOO_MANY_ATTEMPTS');
      }
    }

    // Generate verification code (use 123456 in demo mode)
    const code = isDemoMode ? '123456' : this.generateCode(codeLength);

    // Store code in Redis
    const { hash } = await this.emailAuthRedisService.createEmailVerificationCode({
      email,
      userType,
      code,
      userId,
      ttlSeconds,
    });

    // Send verification email (skip in demo mode)
    if (isDemoMode) {
      this.logger.log(`Demo mode: Email verification code for ${email} is 123456`);
    } else {
      try {
        await this.emailNotificationService.sendVerification(
          email,
          code,
          firstName,
        );
        this.logger.log(`Sent verification email to ${email}`);
      } catch (error) {
        this.logger.error(`Failed to send verification email to ${email}`, error);
        // Don't throw - user can still use the code if they received it
      }
    }

    return { hash };
  }

  /**
   * Verify email code and mark auth method as verified
   */
  async verifyEmailCode(
    hash: string,
    code: string,
  ): Promise<{ email: string; userType: UserType; userId?: number }> {
    const verifyHash = await this.emailAuthRedisService.isEmailVerificationCodeValid(
      hash,
      code,
    );

    if (!verifyHash) {
      throw new Error('INVALID_CODE');
    }

    const email = verifyHash.email;
    const userType = verifyHash.userType as UserType;
    const userId = verifyHash.userId ? parseInt(verifyHash.userId, 10) : undefined;

    // Mark the auth method as verified if exists
    if (userId) {
      await this.markEmailAsVerified(userType, userId, email);
    }

    // Clean up the verification code
    await this.emailAuthRedisService.deleteEmailVerificationCode(hash);
    await this.emailAuthRedisService.clearVerificationAttempts(email);

    return { email, userType, userId };
  }

  /**
   * Mark an email as verified for a user
   */
  async markEmailAsVerified(
    userType: UserType,
    userId: number,
    email: string,
  ): Promise<void> {
    const authMethod = await this.authMethodRepository.findOne({
      where: {
        userType,
        userId,
        type: AuthMethodType.EMAIL,
        identifier: email.toLowerCase(),
      },
    });

    if (authMethod) {
      authMethod.isVerified = true;
      authMethod.verifiedAt = new Date();
      await this.authMethodRepository.save(authMethod);
    }
  }

  /**
   * Get all auth methods for a user
   */
  async getAuthMethods(
    userType: UserType,
    userId: number,
  ): Promise<AuthMethodEntity[]> {
    return this.authMethodRepository.find({
      where: { userType, userId },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  /**
   * Set a specific auth method as primary
   */
  async setPrimaryAuthMethod(authMethodId: number): Promise<void> {
    const authMethod = await this.authMethodRepository.findOneOrFail({
      where: { id: authMethodId },
    });

    // Unset all other primary methods for this user
    await this.authMethodRepository.update(
      { userType: authMethod.userType, userId: authMethod.userId },
      { isPrimary: false },
    );

    // Set this one as primary
    authMethod.isPrimary = true;
    await this.authMethodRepository.save(authMethod);
  }

  /**
   * Update last used timestamp for an auth method
   */
  async updateLastUsed(authMethodId: number): Promise<void> {
    await this.authMethodRepository.update(authMethodId, {
      lastUsedAt: new Date(),
    });
  }

  /**
   * Generate a numeric verification code
   */
  private generateCode(length: number): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }
}
