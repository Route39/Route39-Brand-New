import { Field, Float, ID, InputType } from '@nestjs/graphql';
import {
  BeforeCreateOne,
  CreateOneInputType,
} from '@ptc-org/nestjs-query-graphql';
import { Point } from '@ridy/database';

@InputType()
@BeforeCreateOne((input: CreateOneInputType<CreateFleetInput>) => {
  if (input.input.exclusivityAreas) {
    for (const location of input.input.exclusivityAreas) {
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
export class CreateFleetInput {
  @Field(() => String, { nullable: false })
  name!: string;
  @Field(() => String, { nullable: false })
  phoneNumber!: string;
  @Field(() => String, { nullable: false })
  mobileNumber!: string;
  @Field(() => String, { nullable: false })
  userName!: string;
  @Field(() => String, { nullable: false })
  password!: string;
  @Field(() => String, { nullable: false })
  accountNumber!: string;
  @Field(() => Float)
  commissionSharePercent!: number;
  @Field(() => Float, { nullable: false })
  commissionShareFlat!: number;
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
