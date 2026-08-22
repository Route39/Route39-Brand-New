import { Field, ObjectType } from '@nestjs/graphql';
import { DriverDTO } from '../../core/dtos/driver.dto';

@ObjectType()
export class VerifyEmailDto {
  @Field(() => String, {
    nullable: true,
    description:
      'JWT token for authentication. Null if phone verification is required first.',
  })
  jwtToken?: string;

  @Field(() => DriverDTO, {
    nullable: true,
    description: 'The driver object. Null if phone verification is required first.',
  })
  user?: DriverDTO;

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
      'If true, the driver must complete phone verification before they can log in with email.',
  })
  requiresPhoneVerification!: boolean;
}
