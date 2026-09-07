import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class RouteDistanceDTO {
  @Field(() => Float)
  distance!: number;

  @Field(() => Int)
  duration!: number;
}