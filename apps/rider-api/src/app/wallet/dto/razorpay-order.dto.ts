import { ObjectType, Field, Float, ID } from '@nestjs/graphql';

@ObjectType()
export class RazorpayOrderDTO {
  @Field(() => ID)
  orderId!: string;

  @Field(() => Float)
  amount!: number;

  @Field(() => String)
  currency!: string;

  @Field(() => String)
  keyId!: string;
}
