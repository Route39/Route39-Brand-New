import { Field, Float, InputType } from '@nestjs/graphql';
import { Point } from '@ridy/database';

@InputType('SurgeZoneInput')
export class SurgeZoneInput {
  @Field(() => String, { nullable: true }) name?: string;
  @Field(() => [[Point]], { nullable: true }) area?: Point[][];
  @Field(() => String, { nullable: true }) status?: string;
  @Field(() => String, { nullable: true }) type?: string;
  @Field(() => Float, { nullable: true }) surgePercent?: number | null;
  @Field(() => Float, { nullable: true }) surgeFlat?: number | null;
  @Field(() => Float, { nullable: true }) commissionPercent?: number | null;
  @Field(() => String, { nullable: true }) startTime?: string | null;
  @Field(() => String, { nullable: true }) endTime?: string | null;
  @Field(() => String, { nullable: true }) startDate?: string | null;
  @Field(() => String, { nullable: true }) endDate?: string | null;
}
