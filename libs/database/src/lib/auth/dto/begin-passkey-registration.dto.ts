import { Field, ObjectType } from '@nestjs/graphql';

/**
 * DTO containing the options required to begin passkey registration.
 * This is sent to the client to initiate the WebAuthn registration ceremony.
 */
@ObjectType('BeginPasskeyRegistrationDTO')
export class BeginPasskeyRegistrationDTO {
  @Field(() => String)
  challenge!: string;

  @Field(() => String)
  rpId!: string;

  @Field(() => String)
  rpName!: string;

  @Field(() => String)
  userId!: string;

  @Field(() => String)
  userName!: string;

  @Field(() => String)
  userDisplayName!: string;

  @Field(() => [String])
  excludeCredentials!: string[];

  @Field(() => Number)
  timeout!: number;
}
