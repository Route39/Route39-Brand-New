import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { SMSProviderInterface } from './sms-provider.interface';
import { SMSProviderEntity } from '../../entities/sms-provider.entity';
import { firstValueFrom } from 'rxjs';
import { ForbiddenError } from '@nestjs/apollo';

@Injectable()
export class BulkSMSPlansService implements SMSProviderInterface {
  constructor(private httpService: HttpService) {}

  async sendOTP(input: {
    providerEntity: SMSProviderEntity;
    phoneNumber: string;
    message: string;
  }): Promise<void> {
    const { providerEntity, phoneNumber, message } = input;
    try {
      const url = 'https://bulksmsplans.com/api/send_sms';
      const params: Record<string, string> = {
        api_id: providerEntity.authToken!,
        api_password: providerEntity.accountId!,
        sms_type: 'Transactional',
        sms_encoding: 'text',
        sender: providerEntity.fromNumber || '',
        number: phoneNumber.replace(/\D/g, '').slice(-10),
        message: message,
        template_id: providerEntity.smsType || '',
      };

      const response = await firstValueFrom(
        this.httpService.post(url, null, { params }),
      );

      const body = response.data;
      Logger.log(
        `BulkSMSPlans response: ${JSON.stringify(body)}`,
        'BulkSMSPlansService.sendOTP',
      );

      const statusStr = String(body?.status || body?.Status || '').toLowerCase();
      const msgStr = String(body?.message || body?.msg || '').toLowerCase();
      const isError =
        (statusStr && !['success', 'ok', 'true', 'submitted'].includes(statusStr)) ||
        msgStr.includes('error') ||
        msgStr.includes('invalid') ||
        msgStr.includes('fail');

      if (response.status < 200 || response.status >= 300 || isError) {
        throw new ForbiddenError(
          `BulkSMSPlans rejected the request: ${JSON.stringify(body)}`,
        );
      }
    } catch (error: any) {
      Logger.error(error, 'BulkSMSPlansService.sendOTP');
      throw new ForbiddenError(`Failed to send BulkSMSPlans SMS: ${error.message}`);
    }
  }
}
