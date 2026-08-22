import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import {
  EmailProviderInterface,
  SendEmailInput,
  SendEmailResult,
} from './email-provider.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MailerSendService implements EmailProviderInterface {
  private readonly logger = new Logger(MailerSendService.name);

  constructor(private readonly httpService: HttpService) {}

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      // Build request body
      const requestBody: Record<string, unknown> = {
        from: {
          email: input.providerEntity.fromEmail,
          name: input.providerEntity.fromName,
        },
        to: [
          {
            email: input.to,
          },
        ],
        ...(input.cc?.length && {
          cc: input.cc.map((email) => ({ email })),
        }),
        reply_to: input.providerEntity.replyToEmail
          ? {
              email: input.providerEntity.replyToEmail,
            }
          : undefined,
        subject: input.subject,
      };

      if (input.providerTemplateId) {
        // Use MailerSend template
        requestBody.template_id = input.providerTemplateId;

        // Convert template variables to MailerSend format
        if (input.templateVariables) {
          const substitutions = Object.entries(input.templateVariables)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => ({
              var: key,
              value: value ?? '',
            }));

          requestBody.variables = [
            {
              email: input.to,
              substitutions,
            },
          ];
        }
      } else {
        // Use inline content
        requestBody.html = input.htmlContent;
        requestBody.text = input.plainTextContent;
      }

      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.mailersend.com/v1/email',
          requestBody,
          {
            headers: {
              Authorization: `Bearer ${input.providerEntity.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // MailerSend returns the message ID in the response headers
      const messageId = response.headers['x-message-id'] as string | undefined;

      this.logger.log(`Email sent successfully via MailerSend to ${input.to}`);

      return {
        success: true,
        messageId,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to send email via MailerSend: ${errorMessage}`,
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
