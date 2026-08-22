import { Field, ObjectType, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType('LostPropertyEligibility')
export class LostPropertyEligibilityDTO {
  @Field(() => Boolean)
  canCall!: boolean;

  @Field(() => GraphQLISODateTime, { nullable: true })
  finishedAt?: Date;
}
