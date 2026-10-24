import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('LiveSurgeZone')
export class LiveSurgeZoneDTO {
  @Field(() => ID) id!: number;
  @Field() name!: string;
  @Field(() => Float) percent!: number;
  @Field(() => Float) centerLat!: number;
  @Field(() => Float) centerLng!: number;
  @Field(() => Int) radiusMeters!: number;
  @Field(() => Float) rainMm!: number;
  @Field() type!: string;
  @Field(() => String, { nullable: true }) reason?: string | null;
}
