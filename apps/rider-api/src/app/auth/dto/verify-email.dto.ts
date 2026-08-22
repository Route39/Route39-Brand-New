import { Field, ObjectType } from '@nestjs/graphql';
import { RiderDTO } from '../../rider/dto/rider.dto';

@ObjectType()
export class VerifyEmailDto {
  @Field(() => String, {
    nullable: true,
    description:
      'JWT token for authentication. Null if phone verification is required first.',
  })
  jwtToken?: string;

  @Field(() => RiderDTO, {
    nullable: true,
    description: 'The user object. Null if phone verification is required first.',
  })
  user?: RiderDTO;

  @Field(() => Boolean)
  hasPassword!: boolean;

  @Field(() => Boolean)
  hasName!: boolean;

  @Field(() => Boolean, {
    description: 'Whether this is a newly created account.',
  })
  isNewAccount!: boolean;

  @Field(() => Boolean, {
    description: 'Whether the email was linked to an existing account.',
  })
  isEmailLinked!: boolean;

  @Field(() => Boolean, {
    description:
      'If true, the user must complete phone verification before they can log in with email.',
  })
  requiresPhoneVerification!: boolean;
}
