import { Field, InputType } from '@nestjs/graphql';
import { EmailEventType, EmailContentSource } from '@ridy/database';

@InputType()
export class EmailTemplateInput {
  @Field(() => EmailEventType, { nullable: true })
  eventType?: EmailEventType;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  subject?: string;

  @Field(() => EmailContentSource, {
    nullable: true,
    description: 'Source of email content - Inline or ProviderTemplate',
  })
  contentSource?: EmailContentSource;

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

  @Field(() => Boolean, { nullable: true })
  isActive?: boolean;

  @Field(() => String, { nullable: true })
  locale?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Comma-separated list of CC email addresses',
  })
  cc?: string;
}
