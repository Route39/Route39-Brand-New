import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplateEntity } from '../entities/email-template.entity';
import { EmailEventType } from '../entities/enums/email-event-type.enum';

@Injectable()
export class EmailTemplateService {
  constructor(
    @InjectRepository(EmailTemplateEntity)
    private readonly templateRepository: Repository<EmailTemplateEntity>,
  ) {}

  async getTemplateByEventType(
    eventType: EmailEventType,
    locale?: string,
  ): Promise<EmailTemplateEntity | null> {
    // First try to find a locale-specific template
    if (locale) {
      const localeTemplate = await this.templateRepository.findOne({
        where: {
          eventType,
          isActive: true,
          locale,
        },
      });
      if (localeTemplate) {
        return localeTemplate;
      }
    }

    // Fall back to template without locale (default)
    return this.templateRepository.findOne({
      where: {
        eventType,
        isActive: true,
        locale: undefined,
      },
    });
  }

  /**
   * Replaces placeholders in a template string with provided values.
   * Placeholders are in the format {key} and will be replaced with the corresponding value.
   *
   * Supported placeholders:
   * - User: {firstName}, {lastName}, {email}, {phone}
   * - Order: {orderNumber}, {amount}, {date}, {pickup}, {dropoff}
   * - Driver: {driverName}, {vehicleModel}, {licensePlate}
   * - Auth: {verificationCode}, {resetToken}
   */
  replacePlaceholders(
    template: string,
    variables: Record<string, string | undefined>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      // Replace all occurrences of {key} with the value
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value ?? '');
    }
    return result;
  }
}
