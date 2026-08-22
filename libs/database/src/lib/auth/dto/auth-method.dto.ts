import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AuthMethodType } from '../../entities/enums/auth-method-type.enum';

/**
 * DTO representing an authentication method.
 */
@ObjectType('AuthMethodDTO')
export class AuthMethodDTO {
  @Field(() => ID)
  id!: number;

  @Field(() => AuthMethodType)
  type!: AuthMethodType;

  @Field(() => String)
  identifier!: string;

  @Field(() => Boolean)
  isVerified!: boolean;

  @Field(() => Boolean)
  isPrimary!: boolean;

  @Field({ nullable: true })
  verifiedAt?: Date;

  @Field({ nullable: true })
  lastUsedAt?: Date;
}
