import { Field, InputType } from '@nestjs/graphql';

/**
 * Input for completing passkey authentication.
 * Contains the assertion response from the WebAuthn ceremony.
 */
@InputType('CompletePasskeyAuthenticationInput')
export class CompletePasskeyAuthenticationInput {
  @Field(() => String, {
    description: 'Session ID from beginPasskeyAuthentication',
  })
  sessionId!: string;

  @Field(() => String, {
    description: 'Credential ID (base64url encoded)',
  })
  id!: string;

  @Field(() => String, {
    description: 'Raw credential ID (base64url encoded)',
  })
  rawId!: string;

  @Field(() => String, {
    description: 'Credential type (usually "public-key")',
  })
  type!: string;

  @Field(() => String, {
    description: 'Client data JSON (base64url encoded)',
  })
  clientDataJSON!: string;

  @Field(() => String, {
    description: 'Authenticator data (base64url encoded)',
  })
  authenticatorData!: string;

  @Field(() => String, {
    description: 'Signature (base64url encoded)',
  })
  signature!: string;

  @Field(() => String, {
    nullable: true,
    description: 'User handle (base64url encoded, optional)',
  })
  userHandle?: string;
}
