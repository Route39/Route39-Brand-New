import { Field, InputType } from '@nestjs/graphql';
import { EmailProviderType } from '@ridy/database';

@InputType()
export class EmailProviderInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => EmailProviderType, { nullable: true })
  type?: EmailProviderType;

  @Field(() => Boolean, { nullable: true })
  isDefault?: boolean;

  @Field(() => String, { nullable: true })
  apiKey?: string;

  @Field(() => String, { nullable: true })
  fromEmail?: string;

  @Field(() => String, { nullable: true })
  fromName?: string;

  @Field(() => String, { nullable: true })
  replyToEmail?: string;
}
