import { IDField } from '@ptc-org/nestjs-query-graphql';
import { Field, Float, ID, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('SurgeSetting')
export class SurgeSettingDTO {
  @IDField(() => ID) id!: number;
  @Field(() => Boolean) isEnabled!: boolean;
  @Field(() => Boolean) autoSurgeEnabled!: boolean;
  @Field(() => Float) defaultSurgePercent!: number;
  @Field(() => Float) maxSurgePercent!: number;
  @Field(() => Float) commissionPercent!: number;
  @Field(() => Float) autoDemandRatio!: number;
  @Field(() => Int) autoWindowMinutes!: number;
  @Field(() => Boolean) notifyDrivers!: boolean;
  @Field(() => String) stackingMode!: string;
  @Field(() => Int) notifyRadiusMeters!: number;
  @Field(() => Boolean) gridEnabled!: boolean;
  @Field(() => Int) gridSizeMeters!: number;
  @Field(() => Float) tierLowRatio!: number;
  @Field(() => Float) tierMidRatio!: number;
  @Field(() => Float) tierHighRatio!: number;
  @Field(() => Float) tierLowPercent!: number;
  @Field(() => Float) tierMidPercent!: number;
  @Field(() => Float) tierHighPercent!: number;
  @Field(() => Float) rainExtraPercent!: number;
}

@InputType('SurgeSettingInput')
export class SurgeSettingInput {
  @Field(() => Boolean, { nullable: true }) isEnabled?: boolean;
  @Field(() => Boolean, { nullable: true }) autoSurgeEnabled?: boolean;
  @Field(() => Float, { nullable: true }) defaultSurgePercent?: number;
  @Field(() => Float, { nullable: true }) maxSurgePercent?: number;
  @Field(() => Float, { nullable: true }) commissionPercent?: number;
  @Field(() => Float, { nullable: true }) autoDemandRatio?: number;
  @Field(() => Int, { nullable: true }) autoWindowMinutes?: number;
  @Field(() => Boolean, { nullable: true }) notifyDrivers?: boolean;
  @Field(() => String, { nullable: true }) stackingMode?: string;
  @Field(() => Int, { nullable: true }) notifyRadiusMeters?: number;
  @Field(() => Boolean, { nullable: true }) gridEnabled?: boolean;
  @Field(() => Int, { nullable: true }) gridSizeMeters?: number;
  @Field(() => Float, { nullable: true }) tierLowRatio?: number;
  @Field(() => Float, { nullable: true }) tierMidRatio?: number;
  @Field(() => Float, { nullable: true }) tierHighRatio?: number;
  @Field(() => Float, { nullable: true }) tierLowPercent?: number;
  @Field(() => Float, { nullable: true }) tierMidPercent?: number;
  @Field(() => Float, { nullable: true }) tierHighPercent?: number;
  @Field(() => Float, { nullable: true }) rainExtraPercent?: number;
}
