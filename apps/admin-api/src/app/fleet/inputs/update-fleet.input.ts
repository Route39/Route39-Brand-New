import { Field, Float, ID, InputType } from '@nestjs/graphql';
import {
  BeforeUpdateOne,
  UpdateOneInputType,
} from '@ptc-org/nestjs-query-graphql';
import { Point } from '@ridy/database';

@InputType()
@BeforeUpdateOne((input: UpdateOneInputType<UpdateFleetInput>) => {
  if (input.update.exclusivityAreas) {
    for (const location of input.update.exclusivityAreas) {
      if (
        location[0].lat !== location[location.length - 1].lat ||
        location[0].lng !== location[location.length - 1].lng
      ) {
        location.push(location[0]);
      }
    }
  }
  return input;
})
export class UpdateFleetInput {
  @Field(() => String, { nullable: true })
  name?: string;
  @Field(() => String, { nullable: true })
  phoneNumber?: string;
  @Field(() => String, { nullable: true })
  mobileNumber?: string;
  @Field(() => String, { nullable: true })
  userName?: string;
  @Field(() => String, { nullable: true })
  password?: string;
  @Field(() => String, { nullable: true })
  accountNumber?: string;
  @Field(() => Float, { nullable: true })
  commissionSharePercent?: number;
  @Field(() => Float, { nullable: true })
  commissionShareFlat?: number;
  @Field(() => Float, { nullable: true })
  feeMultiplier?: number;
  @Field(() => String, { nullable: true })
  address?: string;
  @Field(() => [[Point]], { nullable: true })
  exclusivityAreas?: Point[][];
  @Field(() => ID, { nullable: true })
  profilePictureId?: number;
  @Field(() => Boolean, { nullable: true })
  isBlocked?: boolean;
}
