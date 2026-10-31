import { Field, ID, InputType, Int } from '@nestjs/graphql';

@InputType()
export class ServiceCategoryInput {
  @Field(() => String)
  name!: string;
  @Field(() => String, { nullable: true })
  enabled?: boolean;
  @Field(() => String, { nullable: true })
  description?: string;
  @Field(() => Int, { nullable: true })
  displayPriority?: number;
  @Field(() => Boolean, { nullable: true })
  isEnabled?: boolean;
  @Field(() => ID, { nullable: true })
  mediaId?: number;
}
