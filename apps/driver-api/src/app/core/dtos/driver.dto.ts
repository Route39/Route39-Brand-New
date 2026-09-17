import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { IDField } from '@ptc-org/nestjs-query-graphql';
import { DriverStatus } from '@ridy/database';

@ObjectType('Driver')
export class DriverDTO {
  @IDField(() => ID)
  id!: number;
  @Field(() => String)
  firstName!: string;
  @Field(() => String)
  lastName!: string;
  @Field(() => String)
  profileImageUrl!: string;
  @Field(() => String)
  mobileNumber!: string;
  @Field(() => String, { nullable: true })
  email?: string;
  @Field(() => DriverStatus)
  status!: DriverStatus;
  @Field(() => Float, { nullable: true })
  walletCredit!: number;
  @Field(() => String)
  currency!: string;
  @Field(() => Int, { nullable: true })
  searchDistance!: number | null;
  @Field(() => String, { nullable: true })
  softRejectionNote!: string | null;
  @Field(() => String, { nullable: true })
  city!: string | null;
  @Field(() => String, { nullable: true })
  vehicleOwnership!: string | null;
  @Field(() => String, { nullable: true })
  carPlate!: string | null;
  @Field(() => Int, { nullable: true })
  carId!: number | null;
  @Field(() => Int, { nullable: true })
  carColorId!: number | null;
  @Field(() => Int, { nullable: true })
  carProductionYear!: number | null;
  @Field(() => String, { nullable: true })
  aadhaarNumber!: string | null;
  @Field(() => String, { nullable: true })
  panNumber!: string | null;
  @Field(() => Int)
  documentsUploadedCount!: number;
}
