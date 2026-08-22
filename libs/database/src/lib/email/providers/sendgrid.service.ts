import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  EmailProviderInterface,
  SendEmailInput,
  SendEmailResult,
} from './email-provider.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SendGridService implements EmailProviderInterface {
  private readonly logger = new Logger(SendGridService.name);

  constructor(private readonly httpService: HttpService) {}

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      // Build personalizations with dynamic template data if using provider template
      const personalizations: Record<string, unknown>[] = [
        {
          to: [{ email: input.to }],
          ...(input.cc?.length && {
            cc: input.cc.map((email) => ({ email })),
          }),
          ...(input.providerTemplateId &&
            input.templateVariables && {
              dynamic_template_data: input.templateVariables,
            }),
        },
      ];

      // Build request body - use template_id or content based on mode
      const requestBody: Record<string, unknown> = {
        personalizations,
        from: {
          email: input.providerEntity.fromEmail,
          name: input.providerEntity.fromName,
        },
        reply_to: input.providerEntity.replyToEmail
          ? { email: input.providerEntity.replyToEmail }
          : undefined,
      };

      if (input.providerTemplateId) {
        // Use SendGrid dynamic template
        requestBody.template_id = input.providerTemplateId;
        // Subject is set in the template, but we can override it
        if (input.subject) {
          requestBody.subject = input.subject;
        }
      } else {
        // Use inline content
        requestBody.subject = input.subject;
        requestBody.content = [
          {
            type: 'text/html',
            value: input.htmlContent,
          },
          ...(input.plainTextContent
            ? [
                {
                  type: 'text/plain',
                  value: input.plainTextContent,
                },
              ]
            : []),
        ];
      }

      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.sendgrid.com/v3/mail/send',
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${input.providerEntity.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // SendGrid returns 202 Accepted on success
      const messageId = response.headers['x-message-id'] as string | undefined;

      this.logger.log(`Email sent successfully via SendGrid to ${input.to}`);

      return {
        success: true,
        messageId,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email via SendGrid: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
