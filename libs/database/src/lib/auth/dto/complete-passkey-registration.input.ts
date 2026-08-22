import { Field, InputType } from '@nestjs/graphql';

/**
 * Input for completing passkey registration.
 * Contains the attestation response from the authenticator.
 */
@InputType('CompletePasskeyRegistrationInput')
export class CompletePasskeyRegistrationInput {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  rawId!: string;

  @Field(() => String)
  type!: string;

  @Field(() => String)
  clientDataJSON!: string;

  @Field(() => String)
  attestationObject!: string;

  @Field(() => [String], { nullable: true })
  transports?: string[];
}
