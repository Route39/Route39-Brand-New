import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RazorpayRideOrderDTO {
  @Field()
  orderId!: string;

  @Field(() => Float)
  amount!: number;

  @Field()
  currency!: string;

  @Field()
  keyId!: string;
}
