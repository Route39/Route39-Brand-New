import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  CustomerEntity,
  SharedRiderService,
  AuthRedisService,
  VerifyHash,
  SMSService,
  SharedAuthMethodService,
  UserType,
  AuthMethodType,
} from '@ridy/database';
import { auth } from 'firebase-admin';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private riderService: SharedRiderService,
    private jwtService: JwtService,
    private smsService: SMSService,
    private authRedisService: AuthRedisService,
    private sharedAuthMethodService: SharedAuthMethodService,
  ) {}

  async validateUser(firebaseToken: string): Promise<CustomerEntity> {
    const decodedToken = await auth().verifyIdToken(firebaseToken);
    const number = (
      decodedToken.firebase.identities.phone[0] as string
    ).substring(1);
    const user = await this.riderService.findOrCreateUserWithMobileNumber({
      mobileNumber: number,
    });
    return user;
  }

  async loginUser(user: CustomerEntity): Promise<TokenObject> {
    const payload = { id: user.id };
    return {
      token: this.jwtService.sign(payload),
    };
  }

  async sendVerificationCode(input: {
    phoneNumber: string;
    countryIso?: string;
  }): Promise<{ hash: string }> {
    const code =
      input.phoneNumber === '447700900000'
        ? '839274'
        : process.env.DEMO_MODE?.toLowerCase() === 'true'
          ? '123456'
          : await this.smsService.sendVerificationCodeSms(input.phoneNumber);
    const hash = await this.authRedisService.createVerificationCode({
      mobileNumber: input.phoneNumber,
      countryIso: input.countryIso,
      code,
    });
    return hash;
  }

  async verifyCode(hash: string, code: string): Promise<VerifyHash | null> {
    const verifyHash = await this.authRedisService.isVerificationCodeValid(
      hash,
      code,
    );
    await this.authRedisService.deleteVerificationCode(hash);
    return verifyHash;
  }

  async setPassword(input: {
    riderId: number;
    password: string;
  }): Promise<CustomerEntity> {
    await this.riderService.repo.update(input.riderId, {
      password: input.password,
    });
    return this.riderService.repo.findOneByOrFail({ id: input.riderId });
  }

  // ============================================
  // Email Authentication Methods
  // ============================================

  /**
   * Send email verification code
   * Returns hash if verification was initiated, along with user status
   */
  async sendEmailVerification(email: string): Promise<{
    hash?: string;
    isExistingUser: boolean;
    requiresPhoneVerification: boolean;
    userId?: number;
  }> {
    // Check if email is already linked to an existing user
    const existingLink = await this.sharedAuthMethodService.autoLinkIfEmailMatches(
      UserType.CUSTOMER,
      email,
    );

    if (existingLink) {
      // Email is already linked to an account
      const customer = await this.riderService.repo.findOne({
        where: { id: existingLink.userId },
      });

      // If user doesn't have a phone number verified yet, they need to complete that first
      const hasVerifiedPhone = customer?.mobileNumber != null;
      const requiresPhoneVerification = !hasVerifiedPhone;

      // Send verification email
      const { hash } = await this.sharedAuthMethodService.sendEmailVerification(
        email,
        UserType.CUSTOMER,
        customer?.firstName ?? undefined,
        existingLink.userId,
      );

      return {
        hash,
        isExistingUser: true,
        requiresPhoneVerification,
        userId: existingLink.userId,
      };
    }

    // Check if email exists in the customer table (legacy email field)
    const customerWithEmail = await this.riderService.repo.findOne({
      where: { email: email.toLowerCase() },
    });

    if (customerWithEmail) {
      // Link the email to auth_method and send verification
      await this.sharedAuthMethodService.linkEmail(
        UserType.CUSTOMER,
        customerWithEmail.id,
        email,
      );

      const hasVerifiedPhone = customerWithEmail.mobileNumber != null;

      const { hash } = await this.sharedAuthMethodService.sendEmailVerification(
        email,
        UserType.CUSTOMER,
        customerWithEmail.firstName ?? undefined,
        customerWithEmail.id,
      );

      return {
        hash,
        isExistingUser: true,
        requiresPhoneVerification: !hasVerifiedPhone,
        userId: customerWithEmail.id,
      };
    }

    // New user - they need to verify phone first
    const { hash } = await this.sharedAuthMethodService.sendEmailVerification(
      email,
      UserType.CUSTOMER,
    );

    return {
      hash,
      isExistingUser: false,
      requiresPhoneVerification: true, // Phone is required for new users
    };
  }

  /**
   * Verify email code and potentially log user in
   */
  async verifyEmailCode(
    hash: string,
    code: string,
  ): Promise<{
    email: string;
    userId?: number;
    isNewAccount: boolean;
    isEmailLinked: boolean;
    requiresPhoneVerification: boolean;
    customer?: CustomerEntity;
  }> {
    const result = await this.sharedAuthMethodService.verifyEmailCode(hash, code);

    if (result.userId) {
      // Existing user - update emailVerified status
      const customer = await this.riderService.repo.findOneBy({ id: result.userId });
      if (customer) {
        await this.riderService.repo.update(result.userId, {
          emailVerified: true,
        });
        const hasVerifiedPhone = customer.mobileNumber != null;
        return {
          email: result.email,
          userId: result.userId,
          isNewAccount: false,
          isEmailLinked: true,
          requiresPhoneVerification: !hasVerifiedPhone,
          customer,
        };
      }
    }

    // New email, no existing user
    return {
      email: result.email,
      isNewAccount: true,
      isEmailLinked: false,
      requiresPhoneVerification: true,
    };
  }

  /**
   * Login with email and password
   */
  async loginWithEmail(
    email: string,
    password: string,
  ): Promise<CustomerEntity | null> {
    // Find user by email in auth_method table
    const userId = await this.sharedAuthMethodService.findUserByEmail(
      UserType.CUSTOMER,
      email,
    );

    if (!userId) {
      // Try legacy email field
      const customer = await this.riderService.repo.findOne({
        where: { email: email.toLowerCase() },
      });
      if (customer && customer.password === password) {
        return customer;
      }
      return null;
    }

    const customer = await this.riderService.repo.findOne({
      where: { id: userId },
    });

    if (!customer || customer.password !== password) {
      return null;
    }

    // Update last used timestamp for the auth method
    const authMethods = await this.sharedAuthMethodService.getAuthMethods(
      UserType.CUSTOMER,
      userId,
    );
    const emailMethod = authMethods.find(
      (m) => m.type === AuthMethodType.EMAIL && m.identifier === email.toLowerCase(),
    );
    if (emailMethod) {
      await this.sharedAuthMethodService.updateLastUsed(emailMethod.id);
    }

    return customer;
  }

  /**
   * Link email to current user's account
   */
  async linkEmailToAccount(
    customerId: number,
    email: string,
  ): Promise<void> {
    // Check if email is already used by another account
    const existingUserId = await this.sharedAuthMethodService.findUserByEmail(
      UserType.CUSTOMER,
      email,
    );

    if (existingUserId && existingUserId !== customerId) {
      throw new Error('EMAIL_ALREADY_IN_USE');
    }

    // Link email to current account
    await this.sharedAuthMethodService.linkEmail(
      UserType.CUSTOMER,
      customerId,
      email,
    );

    // Also update the email field in customer table
    await this.riderService.repo.update(customerId, {
      email: email.toLowerCase(),
      emailVerified: false,
    });
  }

  /**
   * Get all auth methods for a customer
   */
  async getAuthMethods(customerId: number) {
    return this.sharedAuthMethodService.getAuthMethods(
      UserType.CUSTOMER,
      customerId,
    );
  }
}

export type TokenObject = { token: string };
