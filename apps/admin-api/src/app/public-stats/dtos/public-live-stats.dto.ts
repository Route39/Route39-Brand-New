import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('PublicLiveStats')
export class PublicLiveStatsDTO {
  @Field(() => Int)
  driversOnline!: number;

  @Field(() => Int)
  tripsToday!: number;

  @Field(() => Float, { nullable: true })
  avgPickupMinutes?: number;
}
