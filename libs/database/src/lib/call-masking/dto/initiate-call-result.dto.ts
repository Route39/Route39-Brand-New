import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('InitiateCallResult')
export class InitiateCallResultDTO {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => String, { nullable: true })
  maskingNumber?: string;

  @Field(() => String, { nullable: true })
  error?: string;
}
