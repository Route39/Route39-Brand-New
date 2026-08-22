import { ID, ObjectType, Field } from '@nestjs/graphql';
import { FilterableField, IDField } from '@ptc-org/nestjs-query-graphql';
import { EmailStatus, EmailEventType } from '@ridy/database';

@ObjectType('Email', {
  description: 'Email Log',
})
export class EmailDTO {
  @IDField(() => ID)
  id: number;

  @FilterableField()
  to!: string;

  @Field()
  from!: string;

  @Field()
  subject!: string;

  @Field()
  bodyHtml!: string;

  @FilterableField(() => EmailStatus)
  status!: EmailStatus;

  @FilterableField(() => EmailEventType)
  eventType!: EmailEventType;

  @Field(() => String, { nullable: true })
  providerMessageId?: string;

  @Field(() => String, { nullable: true })
  errorMessage?: string;

  @FilterableField(() => ID)
  providerId!: number;

  @FilterableField(() => ID, { nullable: true })
  templateId?: number;

  @Field(() => String, { nullable: true })
  cc?: string;

  @Field()
  sentAt!: Date;
}
