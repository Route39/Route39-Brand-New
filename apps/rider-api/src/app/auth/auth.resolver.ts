import { Inject, Logger, UseGuards } from '@nestjs/common';
import { Args, CONTEXT, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import {
  VersionStatus,
  SharedPasskeyService,
  BeginPasskeyRegistrationDTO,
  CompletePasskeyRegistrationInput,
  BeginPasskeyAuthenticationDTO,
  CompletePasskeyAuthenticationInput,
  AuthMethodDTO,
  UserType,
} from '@ridy/database';
import { SharedRiderService } from '@ridy/database';

import { RiderDTO } from '../rider/dto/rider.dto';
import { UserContext } from './authenticated-user';
import { LoginDTO } from './dto/login.dto';
import { LoginInput } from './dto/login.input';
import { GqlAuthGuard } from './access-token.guard';
import { ForbiddenError } from '@nestjs/apollo';
import { auth } from 'firebase-admin';
import { AuthService } from './auth.service';
import { VerifyNumberDto } from './dto/verify-number.dto';
import { VerificationDto } from './dto/verification.dto';
import { SendEmailVerificationDto } from './dto/send-email-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RiderService } from '../rider/rider.service';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';

@Resolver()
export class AuthResolver {
  constructor(
    private sharedRiderService: SharedRiderService,
    private jwtService: JwtService,
    private authService: AuthService,
    private riderService: RiderService,
    private sharedPasskeyService: SharedPasskeyService,
    @Inject(CONTEXT)
    private userContext: UserContext,
  ) {}

  @Mutation(() => LoginDTO)
  async login(
    @Args('input', { type: () => LoginInput }) input: LoginInput,
  ): Promise<LoginDTO> {
    const decodedToken = await auth().verifyIdToken(input.firebaseToken);
    const number = (
      decodedToken.firebase.identities.phone[0] as string
    ).substring(1);
    const user = await this.sharedRiderService.findOrCreateUserWithMobileNumber(
      {
        mobileNumber: number,
      },
    );
    const payload = { id: user.id };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload),
    };
  }

  @Query(() => VersionStatus)
  async requireUpdate(
    @Args('versionCode', { type: () => Int }) versionCode: number,
  ): Promise<VersionStatus> {
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

  @Mutation(() => RiderDTO)
  @UseGuards(GqlAuthGuard)
  async deleteUser(): Promise<RiderDTO> {
    const parsedUser = await this.riderService.getRiderProfile(
      this.userContext.req.user.id,
    );
    await this.sharedRiderService.repo.findOneByOrFail({
      id: this.userContext.req.user.id,
    });
    this.sharedRiderService.repo.softDelete({
      id: this.userContext.req.user.id,
    });
    return parsedUser;
  }

  @Mutation(() => VerifyNumberDto, {
    description:
      'Returns a hash that will need to be passed in subsequent verify code call in order for match and verifcation to happen. Real sms is not sent in demo mode. It is 123456 by default.',
  })
  async verifyNumber(
    @Args('mobileNumber') mobileNumber: string,
    @Args('countryIso', { nullable: true }) countryIso: string,
    @Args('forceSendOtp', { nullable: true }) forceSendOtp?: boolean,
  ): Promise<VerifyNumberDto> {
    const phoneUtil = PhoneNumberUtil.getInstance();
    const number = phoneUtil.parseAndKeepRawInput(mobileNumber, countryIso);
    // Allow test number +447700900000 to bypass validation
    const isTestNumber =
      mobileNumber === '+447700900000' ||
      mobileNumber === '7700900000' ||
      mobileNumber == '447700900000';
    if (!isTestNumber && !phoneUtil.isValidNumber(number))
      throw new ForbiddenError('INVALID_NUMBER');
    let formattedNumber = isTestNumber
      ? '+447700900000'
      : phoneUtil.format(number, PhoneNumberFormat.E164);
    // Remove the leading '+' sign
    formattedNumber = formattedNumber.substring(1);
    const rider = await this.sharedRiderService.findWithDeleted({
      mobileNumber: formattedNumber,
    });
    const passwordRequired =
      process.env.PASSWORD_REQUIRED?.toLowerCase() !== 'false';
    const isExistingUser =
      passwordRequired && rider != null && rider.password != null;
    if (isExistingUser && forceSendOtp !== true) {
      return {
        isExistingUser: true,
      };
    }
    const { hash } = await this.authService.sendVerificationCode({
      phoneNumber: formattedNumber,
      countryIso: countryIso,
    });
    Logger.log(
      `Verification code sent to ${formattedNumber} with hash ${hash}`,
      'AuthResolver.verifyNumber',
    );
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
    Logger.log(`Verifying OTP with hash ${hash}`, 'AuthResolver.verifyOtp');
    const verifyHash = await this.authService.verifyCode(hash, code);
    if (!verifyHash) throw new ForbiddenError('INVALID');
    const user =
      await this.sharedRiderService.findOrCreateUserWithMobileNumber(
        verifyHash,
      );
    Logger.log(
      `User ${user.id} verified successfully`,
      'AuthResolver.verifyOtp',
    );
    const parsedUser = await this.riderService.getRiderProfile(user.id);
    const payload = { id: user.id };
    return {
      jwtToken: this.jwtService.sign(payload),
      user: parsedUser,
      hasName: user.firstName != null && user.lastName != null,
      hasPassword:
        process.env.PASSWORD_REQUIRED?.toLowerCase() === 'false'
          ? true
          : user.password != null,
    };
  }

  @Mutation(() => VerificationDto)
  async verifyPassword(
    @Args('mobileNumber') mobileNumber: string,
    @Args('password') password: string,
  ): Promise<VerificationDto> {
    const user = await this.sharedRiderService.findWithDeleted({
      mobileNumber: mobileNumber,
    });
    if (user == null) {
      throw new ForbiddenError('User not found');
    }
    if (user!.password !== password) {
      throw new ForbiddenError('Wrong password');
    }
    if (user?.deletedAt != null) {
      await this.sharedRiderService.restore(user?.id);
    }
    const parsedUser = await this.riderService.getRiderProfile(user.id);
    const payload = { id: user!.id };
    return {
      jwtToken: this.jwtService.sign(payload),
      user: parsedUser,
      hasName: parsedUser.firstName != null && parsedUser.lastName != null,
      hasPassword: user!.password != null,
    };
  }

  @Mutation(() => VerificationDto)
  @UseGuards(GqlAuthGuard)
  async setPassword(
    @Args('password') password: string,
  ): Promise<VerificationDto> {
    const user = await this.authService.setPassword({
      riderId: this.userContext.req.user.id,
      password,
    });
    if (!user) throw new ForbiddenError('User not found');
    const parsedUser = await this.riderService.getRiderProfile(user.id);
    const payload = { id: user.id };
    return {
      jwtToken: this.jwtService.sign(payload),
      user: parsedUser,
      hasName: parsedUser.firstName != null && parsedUser.lastName != null,
      hasPassword: user.password != null,
    };
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
      'Verify the email code and potentially log in the user. In demo mode, use code 123456.',
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

    if (result.customer && !result.requiresPhoneVerification) {
      // User can be logged in
      const parsedUser = await this.riderService.getRiderProfile(
        result.customer.id,
      );
      const payload = { id: result.customer.id };
      return {
        jwtToken: this.jwtService.sign(payload),
        user: parsedUser,
        hasPassword: result.customer.password != null,
        hasName:
          result.customer.firstName != null && result.customer.lastName != null,
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
    const user = await this.authService.loginWithEmail(email, password);
    if (!user) {
      throw new ForbiddenError('Invalid email or password');
    }

    const parsedUser = await this.riderService.getRiderProfile(user.id);
    const payload = { id: user.id };
    return {
      jwtToken: this.jwtService.sign(payload),
      user: parsedUser,
      hasName: parsedUser.firstName != null && parsedUser.lastName != null,
      hasPassword: user.password != null,
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
    const rider = await this.sharedRiderService.findById(
      this.userContext.req.user.id,
    );
    if (!rider) {
      throw new ForbiddenError('Rider not found');
    }

    return this.sharedPasskeyService.beginRegistration(
      UserType.Rider,
      rider.id,
      {
        name: rider.mobileNumber,
        displayName:
          `${rider.firstName ?? ''} ${rider.lastName ?? ''}`.trim() ||
          rider.mobileNumber,
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
      UserType.Rider,
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
    return this.sharedPasskeyService.beginAuthentication(UserType.Rider);
  }

  @Mutation(() => VerificationDto, {
    description: 'Complete passkey authentication and log in the user.',
  })
  async completePasskeyAuthentication(
    @Args('input') input: CompletePasskeyAuthenticationInput,
  ): Promise<VerificationDto> {
    const result = await this.sharedPasskeyService.completeAuthentication(
      UserType.Rider,
      input,
    );

    const parsedUser = await this.riderService.getRiderProfile(result.userId);
    const rider = await this.sharedRiderService.findById(result.userId);

    const payload = { id: result.userId };
    return {
      jwtToken: this.jwtService.sign(payload),
      user: parsedUser,
      hasName: rider?.firstName != null && rider?.lastName != null,
      hasPassword: rider?.password != null,
    };
  }
}
