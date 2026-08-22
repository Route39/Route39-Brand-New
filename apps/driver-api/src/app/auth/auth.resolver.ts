import { Args, CONTEXT, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';

import { DriverService } from '../driver/driver.service';
import { LoginDTO } from './dto/login.dto';
import { LoginInput } from './dto/login.input';
import {
  CarColorEntity,
  CarModelEntity,
  VersionStatus,
  SharedPasskeyService,
  BeginPasskeyRegistrationDTO,
  CompletePasskeyRegistrationInput,
  BeginPasskeyAuthenticationDTO,
  CompletePasskeyAuthenticationInput,
  AuthMethodDTO,
  UserType,
} from '@ridy/database';
import { DriverDTO } from '../core/dtos/driver.dto';
import { Inject, UseGuards, Logger } from '@nestjs/common';
import { GqlAuthGuard } from './jwt-gql-auth.guard';
import { UserContext } from './authenticated-user';
import { SharedDriverService } from '@ridy/database';
import { ForbiddenError } from '@nestjs/apollo';
import { auth } from 'firebase-admin';
import { VerificationDto } from './dto/verification.dto';
import { VerifyNumberDto } from './dto/verify-number.dto';
import { SendEmailVerificationDto } from './dto/send-email-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { AuthService } from './auth.service';
import { DriverDocumentDTO } from './dto/driver-document.dto';
import { Repository, Like } from 'typeorm';
import { DriverDocumentEntity } from '@ridy/database';
import { InjectRepository } from '@nestjs/typeorm';
import { CarModelDTO } from '../core/dtos/car-model.dto';
import { CarColorDTO } from '../core/dtos/car-color.dto';
import { CompleteRegistrationInput } from './dto/complete-registration.input';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';

@Resolver()
export class AuthResolver {
  constructor(
    private driverService: DriverService,
    private sharedDriverService: SharedDriverService,
    @InjectRepository(DriverDocumentEntity)
    private driverDocumentRepository: Repository<DriverDocumentEntity>,
    @InjectRepository(CarModelEntity)
    private carModelRepository: Repository<CarModelEntity>,
    @InjectRepository(CarColorEntity)
    private carColorRepository: Repository<CarColorEntity>,
    private jwtService: JwtService,
    @Inject(CONTEXT)
    private userContext: UserContext,
    private authService: AuthService,
    private sharedPasskeyService: SharedPasskeyService,
  ) {}

  @Mutation(() => LoginDTO)
  async login(
    @Args('input', { type: () => LoginInput }) input: LoginInput,
  ): Promise<LoginDTO> {
    const decodedToken = await auth().verifyIdToken(input.firebaseToken);
    const number = (
      decodedToken.firebase.identities.phone[0] as string
    ).substring(1);
    const user = await this.driverService.findOrCreateUserWithMobileNumber({
      mobileNumber: number,
      countryIso: undefined,
    });
    const payload = { id: user.id };
    return {
      jwtToken: this.jwtService.sign(payload),
    };
  }

  @Query(() => VersionStatus)
  async requireUpdate(
    @Args('versionCode', { type: () => Int }) versionCode: number,
  ) {
    if (
      process.env.MANDATORY_VERSION_CODE != null &&
      versionCode < parseInt(process.env.MANDATORY_VERSION_CODE)
    ) {
      return VersionStatus.MandatoryUpdate;
    }
    if (
      process.env.OPTIONAL_VERSION_CODE != null &&
      versionCode < parseInt(process.env.OPTIONAL_VERSION_CODE)
    ) {
      return VersionStatus.OptionalUpdate;
    }
    return VersionStatus.Latest;
  }

  @Mutation(() => DriverDTO)
  @UseGuards(GqlAuthGuard)
  async deleteUser() {
    return this.sharedDriverService.deleteById(this.userContext.req.user.id);
  }

  @Query(() => [DriverDocumentDTO])
  @UseGuards(GqlAuthGuard)
  async driverRequiredDocuments(): Promise<DriverDocumentDTO[]> {
    return this.driverDocumentRepository.find({
      where: {
        isEnabled: true,
      },
    });
  }

  @Mutation(() => VerifyNumberDto, {
    description:
      'Returns a hash required for the subsequent code verification call to validate the OTP. In demo mode, SMS is not sent and the default OTP is 123456.',
  })
  async verifyNumber(
    @Args('mobileNumber') mobileNumber: string,
    @Args('countryIso', { nullable: true }) countryIso?: string,
    @Args('forceSendOtp', { nullable: true }) forceSendOtp?: boolean,
  ): Promise<VerifyNumberDto> {
    const phoneUtil = PhoneNumberUtil.getInstance();
    Logger.debug(
      `Received mobileNumber: ${mobileNumber}, countryIso: ${countryIso}, forceSendOtp: ${forceSendOtp}`,
      'AuthResolver.verifyNumber',
    );
    // Allow test number +447700900000 to bypass validation
    const isTestNumber =
      mobileNumber === '+447700900000' ||
      mobileNumber === '7700900000' ||
      mobileNumber == '447700900000';
    if (isTestNumber) {
      mobileNumber = '447700900000';
    } else if (countryIso != null) {
      const number = phoneUtil.parseAndKeepRawInput(mobileNumber, countryIso);
      if (!phoneUtil.isValidNumber(number))
        throw new ForbiddenError('INVALID_NUMBER');
      mobileNumber = phoneUtil.format(number, PhoneNumberFormat.E164);
      // Remove the leading '+' sign
      mobileNumber = mobileNumber.substring(1);
    }
    const driver = await this.driverService.findWithDeleted({
      mobileNumber,
    });
    const passwordRequired =
      process.env.PASSWORD_REQUIRED?.toLowerCase() !== 'false';
    const isExistingUser =
      passwordRequired && driver != null && driver.password != null;
    if (isExistingUser && forceSendOtp !== true) {
      return {
        isExistingUser: true,
      };
    }
    const { hash } = await this.authService.sendVerificationCode({
      mobileNumber,
      countryIso,
    });
    return { isExistingUser: false, hash };
  }

  @Mutation(() => VerificationDto, {
    description:
      'Returns a JWT token if the code matches the hash. In demo mode the OTP is not sent. It is 123456 by default.',
  })
  async verifyOtp(
    @Args('hash') hash: string,
    @Args('code') code: string,
  ): Promise<VerificationDto> {
    const verifyCoderesult = await this.authService.verifyCode(hash, code);
    const driver = await this.driverService.findOrCreateUserWithMobileNumber({
      ...verifyCoderesult,
    });
    const payload = { id: driver.id };
    return {
      jwtToken: this.jwtService.sign(payload),
      user: this.driverService.createDTOFromEntity(driver),
      hasName: driver.firstName != null && driver.lastName != null,
      hasPassword:
        process.env.PASSWORD_REQUIRED?.toLowerCase() === 'false'
          ? true
          : driver.password != null,
    };
  }

  @Mutation(() => VerificationDto)
  async verifyPassword(
    @Args('mobileNumber') mobileNumber: string,
    @Args('password') password: string,
  ): Promise<VerificationDto> {
    const driver = await this.driverService.findWithDeleted({ mobileNumber });
    if (driver == null || driver.password !== password) {
      throw new ForbiddenError('Wrong password');
    }
    if (driver?.deletedAt != null) {
      await this.driverService.restore(driver.id);
    }
    const payload = { id: driver.id };
    return {
      jwtToken: this.jwtService.sign(payload),
      user: this.driverService.createDTOFromEntity(driver),
      hasName: driver.firstName != null && driver.lastName != null,
      hasPassword: driver.password != null,
    };
  }

  @Mutation(() => VerificationDto)
  @UseGuards(GqlAuthGuard)
  async setPassword(
    @Args('password') password: string,
  ): Promise<VerificationDto> {
    const driver = await this.driverService.setPassword({
      driverId: this.userContext.req.user.id,
      password,
    });
    const payload = { id: driver.id };
    return {
      jwtToken: this.jwtService.sign(payload),
      user: this.driverService.createDTOFromEntity(driver),
      hasName: driver.firstName != null && driver.lastName != null,
      hasPassword: driver.password != null,
    };
  }

  @Query(() => [CarModelDTO])
  async carModels(
    @Args('query', { type: () => String, nullable: true }) query: string,
  ): Promise<CarModelDTO[]> {
    return this.carModelRepository.find({
      where: query != null ? { name: Like(`%${query}%`) } : {},
    });
  }

  @Query(() => [CarColorDTO])
  async carColors(): Promise<CarColorDTO[]> {
    return this.carColorRepository.find();
  }

  @Mutation(() => DriverDTO)
  @UseGuards(GqlAuthGuard)
  async completeRegistration(
    @Args('input') input: CompleteRegistrationInput,
  ): Promise<DriverDTO> {
    return this.authService.completeRegistration({
      userId: this.userContext.req.user.id,
      input: input,
    });
  }

  // ============================================
  // Email Authentication Mutations
  // ============================================

  @Mutation(() => SendEmailVerificationDto, {
    description:
      'Send a verification code to the provided email address. Returns a hash for subsequent verification.',
  })
  async sendEmailVerification(
    @Args('email') email: string,
  ): Promise<SendEmailVerificationDto> {
    Logger.log(
      `Sending email verification to ${email}`,
      'AuthResolver.sendEmailVerification',
    );
    const result = await this.authService.sendEmailVerification(email);
    return {
      hash: result.hash,
      isExistingUser: result.isExistingUser,
      requiresPhoneVerification: result.requiresPhoneVerification,
    };
  }

  @Mutation(() => VerifyEmailDto, {
    description:
      'Verify the email code and potentially log in the driver. In demo mode, use code 123456.',
  })
  async verifyEmailCode(
    @Args('hash') hash: string,
    @Args('code') code: string,
  ): Promise<VerifyEmailDto> {
    Logger.log(
      `Verifying email code with hash ${hash}`,
      'AuthResolver.verifyEmailCode',
    );
    const result = await this.authService.verifyEmailCode(hash, code);

    if (result.driver && !result.requiresPhoneVerification) {
      // Driver can be logged in
      const driverDTO = this.driverService.createDTOFromEntity(result.driver);
      const payload = { id: result.driver.id };
      return {
        jwtToken: this.jwtService.sign(payload),
        user: driverDTO,
        hasPassword: result.driver.password != null,
        hasName:
          result.driver.firstName != null && result.driver.lastName != null,
        isNewAccount: result.isNewAccount,
        isEmailLinked: result.isEmailLinked,
        requiresPhoneVerification: false,
      };
    }

    // Phone verification required - don't log in yet
    return {
      hasPassword: false,
      hasName: false,
      isNewAccount: result.isNewAccount,
      isEmailLinked: result.isEmailLinked,
      requiresPhoneVerification: result.requiresPhoneVerification,
    };
  }

  @Mutation(() => VerificationDto, {
    description: 'Login with email and password.',
  })
  async loginWithEmail(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<VerificationDto> {
    const driver = await this.authService.loginWithEmail(email, password);
    if (!driver) {
      throw new ForbiddenError('Invalid email or password');
    }

    const driverDTO = this.driverService.createDTOFromEntity(driver);
    const payload = { id: driver.id };
    return {
      jwtToken: this.jwtService.sign(payload),
      user: driverDTO,
      hasName: driver.firstName != null && driver.lastName != null,
      hasPassword: driver.password != null,
    };
  }

  @Mutation(() => AuthMethodDTO, {
    description:
      'Link an email address to the current account. Requires authentication.',
  })
  @UseGuards(GqlAuthGuard)
  async linkEmail(@Args('email') email: string): Promise<AuthMethodDTO> {
    try {
      await this.authService.linkEmailToAccount(
        this.userContext.req.user.id,
        email,
      );
    } catch (error: unknown) {
      if ((error as Error).message === 'EMAIL_ALREADY_IN_USE') {
        throw new ForbiddenError(
          'This email is already linked to another account',
        );
      }
      throw error;
    }

    const authMethods = await this.authService.getAuthMethods(
      this.userContext.req.user.id,
    );
    const emailMethod = authMethods.find(
      (m) => m.identifier === email.toLowerCase(),
    );
    if (!emailMethod) {
      throw new ForbiddenError('Failed to link email');
    }

    return {
      id: emailMethod.id,
      type: emailMethod.type,
      identifier: emailMethod.identifier,
      isVerified: emailMethod.isVerified,
      isPrimary: emailMethod.isPrimary,
      verifiedAt: emailMethod.verifiedAt ?? undefined,
      lastUsedAt: emailMethod.lastUsedAt ?? undefined,
    };
  }

  @Query(() => [AuthMethodDTO], {
    description:
      'Get all authentication methods linked to the current account.',
  })
  @UseGuards(GqlAuthGuard)
  async myAuthMethods(): Promise<AuthMethodDTO[]> {
    const authMethods = await this.authService.getAuthMethods(
      this.userContext.req.user.id,
    );

    return authMethods.map((m) => ({
      id: m.id,
      type: m.type,
      identifier: m.identifier,
      isVerified: m.isVerified,
      isPrimary: m.isPrimary,
      verifiedAt: m.verifiedAt ?? undefined,
      lastUsedAt: m.lastUsedAt ?? undefined,
    }));
  }

  // ============================================
  // Passkey Authentication Mutations
  // ============================================

  @Mutation(() => BeginPasskeyRegistrationDTO, {
    description:
      'Begin passkey registration. Returns options for the WebAuthn ceremony.',
  })
  @UseGuards(GqlAuthGuard)
  async beginPasskeyRegistration(): Promise<BeginPasskeyRegistrationDTO> {
    const driver = await this.sharedDriverService.findById(
      this.userContext.req.user.id,
    );
    if (!driver) {
      throw new ForbiddenError('Driver not found');
    }

    return this.sharedPasskeyService.beginRegistration(
      UserType.DRIVER,
      driver.id,
      {
        name: driver.mobileNumber,
        displayName:
          `${driver.firstName ?? ''} ${driver.lastName ?? ''}`.trim() ||
          driver.mobileNumber,
      },
    );
  }

  @Mutation(() => AuthMethodDTO, {
    description: 'Complete passkey registration with attestation response.',
  })
  @UseGuards(GqlAuthGuard)
  async completePasskeyRegistration(
    @Args('input') input: CompletePasskeyRegistrationInput,
  ): Promise<AuthMethodDTO> {
    const authMethod = await this.sharedPasskeyService.completeRegistration(
      UserType.DRIVER,
      this.userContext.req.user.id,
      input,
    );

    return {
      id: authMethod.id,
      type: authMethod.type,
      identifier: authMethod.identifier,
      isVerified: authMethod.isVerified,
      isPrimary: authMethod.isPrimary,
    };
  }

  @Mutation(() => BeginPasskeyAuthenticationDTO, {
    description:
      'Begin passkey authentication (login). Returns options for the WebAuthn ceremony.',
  })
  async beginPasskeyAuthentication(): Promise<BeginPasskeyAuthenticationDTO> {
    return this.sharedPasskeyService.beginAuthentication(UserType.DRIVER);
  }

  @Mutation(() => VerificationDto, {
    description: 'Complete passkey authentication and log in the driver.',
  })
  async completePasskeyAuthentication(
    @Args('input') input: CompletePasskeyAuthenticationInput,
  ): Promise<VerificationDto> {
    const result = await this.sharedPasskeyService.completeAuthentication(
      UserType.DRIVER,
      input,
    );

    const driver = await this.sharedDriverService.findById(result.userId);
    if (!driver) {
      throw new ForbiddenError('Driver not found');
    }

    const payload = { id: result.userId };
    return {
      jwtToken: this.jwtService.sign(payload),
      user: this.driverService.createDTOFromEntity(driver),
      hasName: driver.firstName != null && driver.lastName != null,
      hasPassword: driver.password != null,
    };
  }
}
