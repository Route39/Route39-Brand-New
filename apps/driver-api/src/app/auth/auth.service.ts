import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  DriverEntity,
  DriverServicesServiceEntity,
  DriverStatus,
  DriverToDriverDocumentEntity,
  EmailNotificationService,
  MediaEntity,
  ServiceEntity,
  VerifyHash,
  SMSService,
  AuthRedisService,
  SharedAuthMethodService,
  UserType,
  AuthMethodType,
} from '@ridy/database';

import { ForbiddenError } from '@nestjs/apollo';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverService } from '../driver/driver.service';
import { CompleteRegistrationInput } from './dto/complete-registration.input';
import { DriverDTO } from '../core/dtos/driver.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private driverService: DriverService,
    private jwtService: JwtService,
    private smsService: SMSService,
    private authRedisService: AuthRedisService,
    private emailNotificationService: EmailNotificationService,
    private sharedAuthMethodService: SharedAuthMethodService,
    @InjectRepository(DriverEntity)
    public driverRepository: Repository<DriverEntity>,
    @InjectRepository(ServiceEntity)
    public serviceRepository: Repository<ServiceEntity>,
    @InjectRepository(MediaEntity)
    public mediaRepository: Repository<MediaEntity>,
    @InjectRepository(DriverServicesServiceEntity)
    public driverServiceRepository: Repository<DriverServicesServiceEntity>,
    @InjectRepository(DriverToDriverDocumentEntity)
    public driverToDocumentRepository: Repository<DriverToDriverDocumentEntity>,
  ) {}

  async loginUser(user: DriverEntity): Promise<TokenObject> {
    const payload = { id: user.id };
    return {
      token: this.jwtService.sign(payload),
    };
  }

  async sendVerificationCode(input: {
    mobileNumber: string;
    countryIso?: string;
  }): Promise<{ hash: string }> {
    const code =
      input.mobileNumber === '447700900000'
        ? '839274'
        : process.env.DEMO_MODE?.toLowerCase() == 'true'
          ? '123456'
          : await this.smsService.sendVerificationCodeSms(input.mobileNumber);
    const hash = await this.authRedisService.createVerificationCode({
      ...input,
      code,
    });
    return hash;
  }

  async verifyCode(hash: string, code: string): Promise<VerifyHash> {
    const result = await this.authRedisService.isVerificationCodeValid(
      hash,
      code,
    );
    if (!result) {
      throw new ForbiddenError('Invalid verification code');
    }
    await this.authRedisService.deleteVerificationCode(hash);
    return result;
  }

  async completeRegistration(input: {
    userId: number;
    input: CompleteRegistrationInput;
  }): Promise<DriverDTO> {
    let driver = await this.driverRepository.findOneOrFail({
      where: { id: input.userId },
    });
    if (!driver) {
      throw new Error('Driver not found');
    }
    const isDemoMode = process.env.DEMO_MODE?.toLowerCase() == 'true';
    const {
      firstName,
      lastName,
      certificateNumber,
      email,
      carProductionYear,
      carPlate,
      profilePictureId,
      gender,
      address,
      carId,
      carColorId,
      documentPairs,
    } = input.input;
    this.driverRepository.update(input.userId, {
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      certificateNumber: certificateNumber?.trim(),
      email: email?.trim(),
      carProductionYear,
      carPlate: carPlate?.trim(),
      mediaId: profilePictureId,
      gender,
      address: address,
      carId,
      carColorId,
      status: isDemoMode ? DriverStatus.Offline : DriverStatus.PendingApproval,
    });
    if (isDemoMode) {
      const allowedServices = await this.serviceRepository.find();
      const services = [];
      for (const service of allowedServices) {
        services.push(
          this.driverServiceRepository.create({
            driverId: input.userId,
            serviceId: service.id,
            driverEnabled: true,
          }),
        );
      }
      await this.driverServiceRepository.save(services);
    }
    if (input.input.documentPairs) {
      await this.driverToDocumentRepository.delete({ driverId: input.userId });
      await this.driverToDocumentRepository.save(
        documentPairs.map(
          (pair): Partial<DriverToDriverDocumentEntity> => ({
            driverId: input.userId,
            driverDocumentId: pair.documentId,
            mediaId: pair.mediaId,
          }),
        ),
      );
    }
    if (input.input.legacyDocumentIds) {
      // No need to do anything as assignment automatically happen on upload
      // const legacyIds = input.input.legacyDocumentIds;
      // const medias = await this.mediaRepository
      //   .createQueryBuilder('media')
      //   .where('media.id IN (:...ids)', { ids: legacyIds })
      //   .getMany();
      // if (medias.length) {
      //   for (const media of medias) {
      //     (media as MediaEntity).driverDocumentId = input.userId;
      //   }
      //   await this.mediaRepository.save(medias);
      // }
    }
    driver = await this.driverRepository.findOneOrFail({
      where: { id: input.userId },
      relations: {
        wallet: true,
        enabledServices: true,
      },
    });

    // Send registration submitted notification (async, don't block the response)
    // This notifies platform admins via CC that a new driver is awaiting approval
    if (!isDemoMode) {
      this.emailNotificationService
        .sendDriverRegistrationSubmitted({
          email: driver.email,
          firstName: driver.firstName,
          lastName: driver.lastName,
          mobileNumber: driver.mobileNumber,
        })
        .catch((error) => {
          console.error('Failed to send driver registration email:', error);
        });
    }

    return this.driverService.createDTOFromEntity(driver);
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
    const existingLink =
      await this.sharedAuthMethodService.autoLinkIfEmailMatches(
        UserType.DRIVER,
        email,
      );

    if (existingLink) {
      // Email is already linked to an account
      const driver = await this.driverRepository.findOne({
        where: { id: existingLink.userId },
      });

      // If driver doesn't have a phone number verified yet, they need to complete that first
      const hasVerifiedPhone = driver?.mobileNumber != null;
      const requiresPhoneVerification = !hasVerifiedPhone;

      // Send verification email
      const { hash } = await this.sharedAuthMethodService.sendEmailVerification(
        email,
        UserType.DRIVER,
        driver?.firstName ?? undefined,
        existingLink.userId,
      );

      return {
        hash,
        isExistingUser: true,
        requiresPhoneVerification,
        userId: existingLink.userId,
      };
    }

    // Check if email exists in the driver table (legacy email field)
    const driverWithEmail = await this.driverRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (driverWithEmail) {
      // Link the email to auth_method and send verification
      await this.sharedAuthMethodService.linkEmail(
        UserType.DRIVER,
        driverWithEmail.id,
        email,
      );

      const hasVerifiedPhone = driverWithEmail.mobileNumber != null;

      const { hash } = await this.sharedAuthMethodService.sendEmailVerification(
        email,
        UserType.DRIVER,
        driverWithEmail.firstName ?? undefined,
        driverWithEmail.id,
      );

      return {
        hash,
        isExistingUser: true,
        requiresPhoneVerification: !hasVerifiedPhone,
        userId: driverWithEmail.id,
      };
    }

    // New driver - they need to verify phone first
    const { hash } = await this.sharedAuthMethodService.sendEmailVerification(
      email,
      UserType.DRIVER,
    );

    return {
      hash,
      isExistingUser: false,
      requiresPhoneVerification: true, // Phone is required for new drivers
    };
  }

  /**
   * Verify email code and potentially log driver in
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
    driver?: DriverEntity;
  }> {
    const result = await this.sharedAuthMethodService.verifyEmailCode(
      hash,
      code,
    );

    if (result.userId) {
      // Existing driver - update emailVerified status
      const driver = await this.driverRepository.findOneBy({
        id: result.userId,
      });
      if (driver) {
        await this.driverRepository.update(result.userId, {
          emailVerified: true,
        });
        const hasVerifiedPhone = driver.mobileNumber != null;
        return {
          email: result.email,
          userId: result.userId,
          isNewAccount: false,
          isEmailLinked: true,
          requiresPhoneVerification: !hasVerifiedPhone,
          driver,
        };
      }
    }

    // New email, no existing driver
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
  ): Promise<DriverEntity | null> {
    // Find driver by email in auth_method table
    const userId = await this.sharedAuthMethodService.findUserByEmail(
      UserType.DRIVER,
      email,
    );

    if (!userId) {
      // Try legacy email field
      const driver = await this.driverRepository.findOne({
        where: { email: email.toLowerCase() },
      });
      if (driver && driver.password === password) {
        return driver;
      }
      return null;
    }

    const driver = await this.driverRepository.findOne({
      where: { id: userId },
    });

    if (!driver || driver.password !== password) {
      return null;
    }

    // Update last used timestamp for the auth method
    const authMethods = await this.sharedAuthMethodService.getAuthMethods(
      UserType.DRIVER,
      userId,
    );
    const emailMethod = authMethods.find(
      (m) =>
        m.type === AuthMethodType.EMAIL && m.identifier === email.toLowerCase(),
    );
    if (emailMethod) {
      await this.sharedAuthMethodService.updateLastUsed(emailMethod.id);
    }

    return driver;
  }

  /**
   * Link email to current driver's account
   */
  async linkEmailToAccount(driverId: number, email: string): Promise<void> {
    // Check if email is already used by another account
    const existingUserId = await this.sharedAuthMethodService.findUserByEmail(
      UserType.DRIVER,
      email,
    );

    if (existingUserId && existingUserId !== driverId) {
      throw new Error('EMAIL_ALREADY_IN_USE');
    }

    // Link email to current account
    await this.sharedAuthMethodService.linkEmail(
      UserType.DRIVER,
      driverId,
      email,
    );

    // Also update the email field in driver table
    await this.driverRepository.update(driverId, {
      email: email.toLowerCase(),
      emailVerified: false,
    });
  }

  /**
   * Get all auth methods for a driver
   */
  async getAuthMethods(driverId: number) {
    return this.sharedAuthMethodService.getAuthMethods(
      UserType.DRIVER,
      driverId,
    );
  }
}

export type TokenObject = { token: string };
