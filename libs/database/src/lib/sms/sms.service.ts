import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import { SharedConfigurationService } from '../config/shared-configuration.service';
import { SMSProviderService } from './sms-provider.service';
import { SMSProviderType } from '../entities/enums/sms-provider-type.enum';
import { BroadnetService } from './providers/broadnet.service';
import { TwilioService } from './providers/twilio.service';
import { PlivoService } from './providers/plivo.service';
import { VonageService } from './providers/vonage.service';
import { ForbiddenError } from '@nestjs/apollo';
import { PahappaService } from './providers/pahappa.service';
import { VentisService } from './providers/ventis.service';
import { ClickSMSService } from './providers/clicksms.service';

@Injectable()
export class SMSService {
  constructor(
    private smsProviderService: SMSProviderService,
    private sharedConfigService: SharedConfigurationService,
    private twilioService: TwilioService,
    private broadnetService: BroadnetService,
    private plivoService: PlivoService,
    private vonageService: VonageService,
    private pahappaService: PahappaService,
    private ventisService: VentisService,
    private clickSMSService: ClickSMSService,
  ) {}

  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    const provider = await this.smsProviderService.getDefaultProvider();

    switch (provider?.type) {
      case SMSProviderType.Twilio:
        await this.twilioService.sendOTP({
          providerEntity: provider,
          phoneNumber,
          message,
        });
        break;

      case SMSProviderType.BroadNet:
        await this.broadnetService.sendOTP({
          providerEntity: provider,
          phoneNumber,
          message,
        });
        break;

      case SMSProviderType.Vonage:
        await this.vonageService.sendOTP({
          providerEntity: provider,
          phoneNumber,
          message,
        });
        break;

      case SMSProviderType.Plivo:
        await this.plivoService.sendOTP({
          providerEntity: provider,
          phoneNumber,
          message,
        });
        break;

      case SMSProviderType.Pahappa:
        await this.pahappaService.sendOTP({
          providerEntity: provider,
          phoneNumber,
          message,
        });
        break;

      case SMSProviderType.VentisSMS:
        await this.ventisService.sendOTP({
          providerEntity: provider,
          phoneNumber,
          message,
        });
        break;

      case SMSProviderType.ClickSMSNet:
        await this.clickSMSService.sendOTP({
          providerEntity: provider,
          phoneNumber,
          message,
        });
        break;

      case SMSProviderType.Firebase:
        // Firebase doesn't actually send SMS, just return
        break;

      default:
        throw new ForbiddenError('The SMS provider is not supported');
    }
  }

  async sendVerificationCodeSms(phoneNumber: string): Promise<string> {
    const random6Digit = Math.floor(100000 + Math.random() * 900000).toString();
    const cleanNumber = phoneNumber.replace(/\+/g, '');

    try {
      const https = require('https');
      const postData = JSON.stringify({
        api_id: process.env.SMS_API_ID || 'APIuep8QlcP149188',
        api_password: process.env.SMS_API_PASSWORD || 'y6IzcYhq',
        sms_type: 'Transactional',
        sms_encoding: 'text',
        sender: process.env.SMS_SENDER_ID || 'ROUTEX',
        number: cleanNumber,
        message: random6Digit,
        template_id: process.env.SMS_TEMPLATE_ID_OTP || '189966'
      });
      
      const options = {
        hostname: 'www.bulksmsplans.com',
        path: '/api/send_sms',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      await new Promise((resolve, reject) => {
        const req = https.request(options, (res: any) => {
          let data = '';
          res.on('data', (chunk: any) => data += chunk);
          res.on('end', () => {
            console.log(`Successfully sent SMS to ${phoneNumber} via BulkSMSPlans: ${data}`);
            resolve(data);
          });
        });
        req.on('error', (e: any) => reject(e));
        req.write(postData);
        req.end();
      });
    } catch (e) {
      console.error('Failed to send SMS via BulkSMSPlans:', e);
    }

    return random6Digit;
  }

  async sendAnnouncement(phoneNumber: string, message: string): Promise<void> {
    await this.sendSMS(phoneNumber, message);
  }

  async sendVerificationCodeWhatsapp(phoneNumber: string): Promise<string> {
    const config = await this.sharedConfigService.getConfiguration();
    if (
      config?.twilioAccountSid == null ||
      config?.twilioAuthToken == null ||
      config?.twilioFromNumber == null ||
      config.twilioVerificationCodeSMSTemplate == null
    )
      throw new Error('twilio config not found');
    const client = new Twilio(
      config.twilioAccountSid!,
      config.twilioAuthToken!,
    );
    const random6Digit = Math.floor(100000 + Math.random() * 900000).toString();
    await client.messages.create({
      body: config.twilioVerificationCodeSMSTemplate.replace(
        '{code}',
        random6Digit,
      ),
      from: config.twilioFromNumber!,
      to: `whatsapp:+${phoneNumber}`,
    });
    return random6Digit;
  }
}
