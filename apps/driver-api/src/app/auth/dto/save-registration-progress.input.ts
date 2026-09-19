import { Field, ID, InputType, Int } from '@nestjs/graphql';

@InputType()
export class SaveRegistrationProgressInput {
  @Field(() => String, { nullable: true })
  city?: string;
  @Field(() => String, { nullable: true })
  vehicleOwnership?: string;
  @Field(() => ID, { nullable: true })
  carId?: number;
  @Field(() => ID, { nullable: true })
  carColorId?: number;
  @Field(() => Int, { nullable: true })
  carProductionYear?: number;
  @Field(() => String, { nullable: true })
  carPlate?: string;
  @Field(() => String, { nullable: true })
  aadhaarNumber?: string;
  @Field(() => String, { nullable: true })
  panNumber?: string;
  @Field(() => String, { nullable: true })
  dob?: string;
}
