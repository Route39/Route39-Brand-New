import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SendEmailVerificationDto {
  @Field({
    nullable: true,
    description:
      'Hash that will need to be passed in subsequent verify code call in order for verification to happen.',
  })
  hash?: string;

  @Field({
    description: 'Whether this email is already linked to an existing account.',
  })
  isExistingUser!: boolean;

  @Field({
    description:
      'Whether phone verification is required before email can be used for login.',
  })
  requiresPhoneVerification!: boolean;
}
