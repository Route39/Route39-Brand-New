import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailProviderService } from './email-provider.service';
import { EmailTemplateService } from './email-template.service';
import { SendGridService } from './providers/sendgrid.service';
import { MailerSendService } from './providers/mailersend.service';
import { EmailEntity } from '../entities/email.entity';
import { EmailProviderType } from '../entities/enums/email-provider-type.enum';
import { EmailEventType } from '../entities/enums/email-event-type.enum';
import { EmailStatus } from '../entities/enums/email-status.enum';
import { EmailContentSource } from '../entities/enums/email-content-source.enum';
import { ForbiddenError } from '@nestjs/apollo';

export interface SendEmailOptions {
  to: string;
  eventType: EmailEventType;
  variables: Record<string, string | undefined>;
  locale?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private emailProviderService: EmailProviderService,
    private emailTemplateService: EmailTemplateService,
    private sendGridService: SendGridService,
    private mailerSendService: MailerSendService,
    @InjectRepository(EmailEntity)
    private emailLogRepository: Repository<EmailEntity>,
  ) {}

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { to, eventType, variables, locale } = options;

    // Check if email provider is configured
    const hasProvider = await this.emailProviderService.hasDefaultProvider();
    if (!hasProvider) {
      this.logger.warn(
        `No default email provider configured, skipping email for event: ${eventType}`,
      );
      return;
    }

    const provider = await this.emailProviderService.getDefaultProvider();

    // Get the template for this event type
    const template = await this.emailTemplateService.getTemplateByEventType(
      eventType,
      locale,
    );

    if (!template) {
      this.logger.warn(
        `No active email template found for event: ${eventType}`,
      );
      return;
    }

    // Replace placeholders in subject
    const subject = this.emailTemplateService.replacePlaceholders(
      template.subject,
      variables,
    );

    // Parse CC recipients from template
    const ccRecipients = template.cc
      ?.split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    // Determine content source and prepare email input
    const useProviderTemplate =
      template.contentSource === EmailContentSource.ProviderTemplate &&
      template.providerTemplateId;

    let bodyHtml: string | undefined;
    let bodyPlainText: string | undefined;

    if (!useProviderTemplate) {
      // Replace placeholders in body for inline content
      bodyHtml = template.bodyHtml
        ? this.emailTemplateService.replacePlaceholders(
            template.bodyHtml,
            variables,
          )
        : undefined;
      bodyPlainText = template.bodyPlainText
        ? this.emailTemplateService.replacePlaceholders(
            template.bodyPlainText,
            variables,
          )
        : undefined;
    }

    // Send via the appropriate provider
    let result;
    switch (provider.type) {
      case EmailProviderType.SendGrid:
        result = await this.sendGridService.sendEmail({
          providerEntity: provider,
          to,
          cc: ccRecipients,
          subject,
          htmlContent: bodyHtml,
          plainTextContent: bodyPlainText,
          providerTemplateId: useProviderTemplate
            ? template.providerTemplateId
            : undefined,
          templateVariables: useProviderTemplate ? variables : undefined,
        });
        break;

      case EmailProviderType.MailerSend:
        result = await this.mailerSendService.sendEmail({
          providerEntity: provider,
          to,
          cc: ccRecipients,
          subject,
          htmlContent: bodyHtml,
          plainTextContent: bodyPlainText,
          providerTemplateId: useProviderTemplate
            ? template.providerTemplateId
            : undefined,
          templateVariables: useProviderTemplate ? variables : undefined,
        });
        break;

      default:
        throw new ForbiddenError('Email provider not supported');
    }

    // Log the email
    await this.emailLogRepository.save({
      to,
      from: provider.fromEmail ?? '',
      subject,
      bodyHtml: bodyHtml ?? `[Provider Template: ${template.providerTemplateId}]`,
      status: result.success ? EmailStatus.SENT : EmailStatus.FAILED,
      eventType,
      providerId: provider.id,
      providerMessageId: result.messageId,
      errorMessage: result.error,
      templateId: template.id,
      cc: ccRecipients?.join(','),
    });

    if (result.success) {
      this.logger.log(`Email sent successfully to ${to} for event ${eventType}`);
    } else {
      this.logger.error(
        `Failed to send email to ${to} for event ${eventType}: ${result.error}`,
      );
    }
  }
}
