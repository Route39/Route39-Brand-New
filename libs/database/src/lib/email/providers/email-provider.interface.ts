import { EmailProviderEntity } from '../../entities/email-provider.entity';

export interface SendEmailInput {
  providerEntity: EmailProviderEntity;
  to: string;
  cc?: string[]; // Array of CC email addresses
  subject: string;
  htmlContent?: string;
  plainTextContent?: string;
  providerTemplateId?: string;
  templateVariables?: Record<string, string | undefined>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export abstract class EmailProviderInterface {
  abstract sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
}
