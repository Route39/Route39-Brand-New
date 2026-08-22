import { registerEnumType } from '@nestjs/graphql';

export enum EmailProviderType {
  SendGrid = 'SendGrid',
  MailerSend = 'MailerSend',
}

registerEnumType(EmailProviderType, {
  name: 'EmailProviderType',
  description: 'The type of the email provider',
});
