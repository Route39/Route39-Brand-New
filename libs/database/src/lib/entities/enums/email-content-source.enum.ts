import { registerEnumType } from '@nestjs/graphql';

export enum EmailContentSource {
  Inline = 'Inline',
  ProviderTemplate = 'ProviderTemplate',
}

registerEnumType(EmailContentSource, {
  name: 'EmailContentSource',
  description: 'The source of email content - inline body or provider template',
});
