import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { EmailProviderEntity } from '../entities/email-provider.entity';
import { EmailTemplateEntity } from '../entities/email-template.entity';
import { EmailEntity } from '../entities/email.entity';
import { EmailService } from './email.service';
import { EmailProviderService } from './email-provider.service';
import { EmailTemplateService } from './email-template.service';
import { EmailNotificationService } from './email-notification.service';
import { SendGridService } from './providers/sendgrid.service';
import { MailerSendService } from './providers/mailersend.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmailProviderEntity,
      EmailTemplateEntity,
      EmailEntity,
    ]),
    HttpModule,
  ],
  providers: [
    EmailService,
    EmailProviderService,
    EmailTemplateService,
    EmailNotificationService,
    SendGridService,
    MailerSendService,
  ],
  exports: [EmailService, EmailNotificationService, EmailTemplateService],
})
export class EmailModule {}
