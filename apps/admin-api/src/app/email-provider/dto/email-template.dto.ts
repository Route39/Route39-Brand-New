import { ID, ObjectType, Field } from '@nestjs/graphql';
import {
  Authorize,
  FilterableField,
  IDField,
} from '@ptc-org/nestjs-query-graphql';
import { EmailEventType, EmailContentSource } from '@ridy/database';
import { EmailTemplateAuthorizer } from '../email-template.authorizer';

@ObjectType('EmailTemplate', {
  description: 'Email Template',
})
@Authorize(EmailTemplateAuthorizer)
export class EmailTemplateDTO {
  @IDField(() => ID)
  id: number;

  @FilterableField(() => EmailEventType)
  eventType!: EmailEventType;

  @FilterableField()
  name!: string;

  @Field(() => String)
  subject!: string;

  @FilterableField(() => EmailContentSource, {
    description: 'Source of email content - Inline or ProviderTemplate',
  })
  contentSource!: EmailContentSource;

  @Field(() => String, { nullable: true })
  bodyHtml?: string;

  @Field(() => String, { nullable: true })
  bodyPlainText?: string;

  @Field(() => String, {
    nullable: true,
    description:
      'External template ID from email provider (SendGrid/MailerSend)',
  })
  providerTemplateId?: string;

  @FilterableField(() => Boolean)
  isActive!: boolean;

  @FilterableField(() => String, { nullable: true })
  locale?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Comma-separated list of CC email addresses',
  })
  cc?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
