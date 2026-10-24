import { IDField } from '@ptc-org/nestjs-query-graphql';
import { Field, Float, GraphQLISODateTime, ID, ObjectType , Int } from '@nestjs/graphql';
import { Point } from '@ridy/database';

@ObjectType('SurgeZone')
export class SurgeZoneDTO {
  @IDField(() => ID) id!: number;
  @Field(() => String) name!: string;
  @Field(() => [[Point]]) area!: Point[][];
  @Field(() => String) status!: string;
  @Field(() => String) type!: string;
  @Field(() => Float, { nullable: true }) surgePercent?: number | null;
  @Field(() => Float, { nullable: true }) surgeFlat?: number | null;
  @Field(() => Float, { nullable: true }) commissionPercent?: number | null;
  @Field(() => String, { nullable: true }) startTime?: string | null;
  @Field(() => String, { nullable: true }) endTime?: string | null;
  @Field(() => String, { nullable: true }) startDate?: string | null;
  @Field(() => String, { nullable: true }) endDate?: string | null;
  @Field(() => Boolean, { nullable: true }) autoLive?: boolean;
  @Field(() => String, { nullable: true }) autoReason?: string | null;
  @Field(() => Boolean, { nullable: true }) autoCreated?: boolean;
  @Field(() => Int, { nullable: true }) regionId?: number | null;
  @Field(() => GraphQLISODateTime) createdAt!: Date;
  @Field(() => GraphQLISODateTime) updatedAt!: Date;
}
