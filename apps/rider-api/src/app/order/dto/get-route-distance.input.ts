import { Field, InputType } from '@nestjs/graphql';
import { Point } from '@ridy/database';

@InputType()
export class GetRouteDistanceInput {
  @Field(() => [Point])
  points!: Point[];
}