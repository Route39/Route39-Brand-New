import { Field, Int, ObjectType } from '@nestjs/graphql';

/**
 * DTO returned when beginning passkey authentication.
 * Contains the challenge and options for the WebAuthn ceremony.
 */
@ObjectType('BeginPasskeyAuthenticationDTO')
export class BeginPasskeyAuthenticationDTO {
  @Field(() => String, {
    description: 'Session ID to identify this authentication attempt',
  })
  sessionId!: string;

  @Field(() => String, {
    description: 'The challenge to be signed by the authenticator',
  })
  challenge!: string;

  @Field(() => String, {
    description: 'The relying party ID (domain)',
  })
  rpId!: string;

  @Field(() => Int, {
    description: 'Timeout in milliseconds for the authentication ceremony',
  })
  timeout!: number;

  @Field(() => String, {
    description: 'User verification requirement',
  })
  userVerification!: string;
}
