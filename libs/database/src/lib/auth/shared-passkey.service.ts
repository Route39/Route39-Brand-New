import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  VerifiedRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import { AuthenticatorTransportFuture } from '@simplewebauthn/types';
import { AuthMethodEntity } from '../entities/auth-method.entity';
import { AuthMethodType } from '../entities/enums/auth-method-type.enum';
import { UserType } from '../entities/enums/user-type.enum';
import { PasskeyRedisService } from './passkey-redis.service';
import { BeginPasskeyRegistrationDTO } from './dto/begin-passkey-registration.dto';
import { CompletePasskeyRegistrationInput } from './dto/complete-passkey-registration.input';
import { BeginPasskeyAuthenticationDTO } from './dto/begin-passkey-authentication.dto';
import { CompletePasskeyAuthenticationInput } from './dto/complete-passkey-authentication.input';

interface PasskeyCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
}

/**
 * Service for managing passkey (WebAuthn) registration.
 * Handles the registration ceremony for both riders and drivers.
 */
@Injectable()
export class SharedPasskeyService {
  private readonly logger = new Logger(SharedPasskeyService.name);

  // Configuration from environment with sensible defaults
  private readonly rpId: string;
  private readonly rpName: string;
  private readonly origin: string;

  constructor(
    @InjectRepository(AuthMethodEntity)
    private authMethodRepository: Repository<AuthMethodEntity>,
    private passkeyRedisService: PasskeyRedisService,
  ) {
    this.rpId = process.env['PASSKEY_RP_ID'] ?? 'localhost';
    this.rpName = process.env['PASSKEY_RP_NAME'] ?? 'BetterSuite';
    this.origin = process.env['PASSKEY_ORIGIN'] ?? 'https://localhost';
  }

  /**
   * Begin the passkey registration ceremony.
   * Generates registration options and stores the challenge.
   */
  async beginRegistration(
    userType: UserType,
    userId: number,
    userInfo: { name: string; displayName: string },
  ): Promise<BeginPasskeyRegistrationDTO> {
    // Get existing passkey credentials to exclude
    const existingPasskeys = await this.getExistingPasskeys(userType, userId);
    const excludeCredentials = existingPasskeys.map((cred) => ({
      id: Buffer.from(cred.credentialId, 'base64url'),
      type: 'public-key' as const,
      transports: (cred.transports as AuthenticatorTransportFuture[]) ?? [],
    }));

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpId,
      userName: userInfo.name,
      userDisplayName: userInfo.displayName,
      // Don't prompt for passkey if user already has one
      excludeCredentials,
      // Use platform authenticator (Face ID, Touch ID, Windows Hello)
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: true,
        residentKey: 'required',
        userVerification: 'required',
      },
      timeout: 60000, // 60 seconds
    });

    // Store the challenge for verification
    await this.passkeyRedisService.storeChallenge(
      userType,
      userId,
      options.challenge,
    );

    this.logger.log(`Started passkey registration for ${userType}:${userId}`);

    return {
      challenge: options.challenge,
      rpId: options.rp.id ?? this.rpId,
      rpName: options.rp.name,
      userId: options.user.id,
      userName: options.user.name,
      userDisplayName: options.user.displayName,
      excludeCredentials: existingPasskeys.map((c) => c.credentialId),
      timeout: options.timeout ?? 60000,
    };
  }

  /**
   * Complete the passkey registration ceremony.
   * Verifies the attestation response and stores the credential.
   */
  async completeRegistration(
    userType: UserType,
    userId: number,
    input: CompletePasskeyRegistrationInput,
  ): Promise<AuthMethodEntity> {
    // Retrieve the stored challenge
    const expectedChallenge = await this.passkeyRedisService.getChallenge(
      userType,
      userId,
    );

    if (!expectedChallenge) {
      throw new BadRequestException(
        'Registration challenge expired. Please try again.',
      );
    }

    let verification: VerifiedRegistrationResponse;
    try {
      verification = await verifyRegistrationResponse({
        response: {
          id: input.id,
          rawId: input.rawId,
          type: input.type as 'public-key',
          response: {
            clientDataJSON: input.clientDataJSON,
            attestationObject: input.attestationObject,
            transports: input.transports as AuthenticatorTransportFuture[],
          },
          clientExtensionResults: {},
          authenticatorAttachment: 'platform',
        },
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpId,
        requireUserVerification: true,
      });
    } catch (error) {
      this.logger.error(
        `Passkey verification failed for ${userType}:${userId}`,
        error,
      );
      throw new BadRequestException('Passkey verification failed.');
    }

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Passkey verification failed.');
    }

    // Clean up the challenge
    await this.passkeyRedisService.deleteChallenge(userType, userId);

    const { credential } = verification.registrationInfo;

    // Store the passkey credential as metadata
    const passkeyMetadata: PasskeyCredential = {
      credentialId: Buffer.from(credential.id).toString('base64url'),
      publicKey: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      transports: input.transports,
    };

    // Check if user already has a passkey auth method
    const existingAuthMethod = await this.authMethodRepository.findOne({
      where: {
        userType,
        userId,
        type: AuthMethodType.PASSKEY,
      },
    });

    if (existingAuthMethod) {
      // Update existing passkey (replace credential)
      existingAuthMethod.identifier = passkeyMetadata.credentialId;
      existingAuthMethod.metadata = passkeyMetadata;
      existingAuthMethod.isVerified = true;
      existingAuthMethod.verifiedAt = new Date();
      existingAuthMethod.updatedAt = new Date();

      this.logger.log(`Updated passkey for ${userType}:${userId}`);
      return this.authMethodRepository.save(existingAuthMethod);
    }

    // Create new passkey auth method
    const authMethod = this.authMethodRepository.create({
      userType,
      userId,
      type: AuthMethodType.PASSKEY,
      identifier: passkeyMetadata.credentialId,
      metadata: passkeyMetadata,
      isVerified: true,
      isPrimary: false,
      verifiedAt: new Date(),
    });

    this.logger.log(`Registered new passkey for ${userType}:${userId}`);
    return this.authMethodRepository.save(authMethod);
  }

  /**
   * Check if a user has a passkey registered.
   */
  async hasPasskey(userType: UserType, userId: number): Promise<boolean> {
    const count = await this.authMethodRepository.count({
      where: {
        userType,
        userId,
        type: AuthMethodType.PASSKEY,
      },
    });
    return count > 0;
  }

  /**
   * Get existing passkey credentials for a user.
   */
  private async getExistingPasskeys(
    userType: UserType,
    userId: number,
  ): Promise<PasskeyCredential[]> {
    const authMethods = await this.authMethodRepository.find({
      where: {
        userType,
        userId,
        type: AuthMethodType.PASSKEY,
      },
    });

    return authMethods
      .filter((am) => am.metadata)
      .map((am) => am.metadata as PasskeyCredential);
  }

  // ============================================
  // Passkey Authentication (Login) Methods
  // ============================================

  /**
   * Begin the passkey authentication ceremony.
   * This is used for "Login with Passkey" - a usernameless flow.
   * Returns authentication options for the client.
   */
  async beginAuthentication(
    userType: UserType,
  ): Promise<BeginPasskeyAuthenticationDTO> {
    // Generate a unique session ID for this authentication attempt
    const sessionId = `auth_${userType}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Generate authentication options (usernameless/discoverable credentials)
    const options = await generateAuthenticationOptions({
      rpID: this.rpId,
      userVerification: 'required',
      timeout: 60000, // 60 seconds
      // Empty allowCredentials for discoverable credential flow
      allowCredentials: [],
    });

    // Store the challenge with session ID
    await this.passkeyRedisService.storeAuthChallenge(
      sessionId,
      options.challenge,
    );

    this.logger.log(`Started passkey authentication for ${userType}, session: ${sessionId}`);

    return {
      sessionId,
      challenge: options.challenge,
      rpId: this.rpId,
      timeout: options.timeout ?? 60000,
      userVerification: 'required',
    };
  }

  /**
   * Complete the passkey authentication ceremony.
   * Verifies the assertion response and returns the authenticated user.
   */
  async completeAuthentication(
    userType: UserType,
    input: CompletePasskeyAuthenticationInput,
  ): Promise<{ userId: number; authMethod: AuthMethodEntity }> {
    // Retrieve the stored challenge
    const expectedChallenge = await this.passkeyRedisService.getAuthChallenge(
      input.sessionId,
    );

    if (!expectedChallenge) {
      throw new BadRequestException(
        'Authentication challenge expired. Please try again.',
      );
    }

    // Find the passkey by credential ID
    const credentialId = input.id;
    const authMethod = await this.authMethodRepository.findOne({
      where: {
        userType,
        type: AuthMethodType.PASSKEY,
        identifier: credentialId,
      },
    });

    if (!authMethod || !authMethod.metadata) {
      throw new BadRequestException('Passkey not found.');
    }

    const passkeyMetadata = authMethod.metadata as PasskeyCredential;

    let verification: VerifiedAuthenticationResponse;
    try {
      verification = await verifyAuthenticationResponse({
        response: {
          id: input.id,
          rawId: input.rawId,
          type: input.type as 'public-key',
          response: {
            clientDataJSON: input.clientDataJSON,
            authenticatorData: input.authenticatorData,
            signature: input.signature,
            userHandle: input.userHandle,
          },
          clientExtensionResults: {},
          authenticatorAttachment: 'platform',
        },
        expectedChallenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpId,
        credential: {
          id: Buffer.from(passkeyMetadata.credentialId, 'base64url'),
          publicKey: Buffer.from(passkeyMetadata.publicKey, 'base64url'),
          counter: passkeyMetadata.counter,
          transports: passkeyMetadata.transports as AuthenticatorTransportFuture[],
        },
        requireUserVerification: true,
      });
    } catch (error) {
      this.logger.error(
        `Passkey authentication failed for credential: ${credentialId}`,
        error,
      );
      throw new BadRequestException('Passkey authentication failed.');
    }

    if (!verification.verified) {
      throw new BadRequestException('Passkey authentication failed.');
    }

    // Clean up the challenge
    await this.passkeyRedisService.deleteAuthChallenge(input.sessionId);

    // Update the counter to prevent replay attacks
    passkeyMetadata.counter = verification.authenticationInfo.newCounter;
    authMethod.metadata = passkeyMetadata;
    authMethod.lastUsedAt = new Date();
    await this.authMethodRepository.save(authMethod);

    this.logger.log(`Passkey authentication successful for ${userType}:${authMethod.userId}`);

    return {
      userId: authMethod.userId,
      authMethod,
    };
  }
}
