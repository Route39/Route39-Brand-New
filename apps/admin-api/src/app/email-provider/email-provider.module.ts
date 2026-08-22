import { Module } from '@nestjs/common';
import {
  NestjsQueryGraphQLModule,
  PagingStrategies,
} from '@ptc-org/nestjs-query-graphql';
import {
  EmailProviderEntity,
  EmailTemplateEntity,
  EmailEntity,
} from '@ridy/database';
import { EmailProviderDTO } from './dto/email-provider.dto';
import { EmailTemplateDTO } from './dto/email-template.dto';
import { EmailDTO } from './dto/email.dto';
import { NestjsQueryTypeOrmModule } from '@ptc-org/nestjs-query-typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailProviderService } from './email-provider.service';
import { EmailProviderResolver } from './email-provider.resolver';
import { EmailProviderInput } from './dto/email-provider.input';
import { EmailTemplateInput } from './dto/email-template.input';
import { EmailProviderQueryService } from './email-provider-query.service';

@Module({
  imports: [
    NestjsQueryGraphQLModule.forFeature({
      imports: [
        NestjsQueryTypeOrmModule.forFeature([
          EmailProviderEntity,
          EmailTemplateEntity,
          EmailEntity,
        ]),
      ],
      services: [EmailProviderQueryService],
      resolvers: [
        {
          DTOClass: EmailProviderDTO,
          CreateDTOClass: EmailProviderInput,
          UpdateDTOClass: EmailProviderInput,
          EntityClass: EmailProviderEntity,
          ServiceClass: EmailProviderQueryService,
          guards: [JwtAuthGuard],
          read: {
            many: {
              name: 'emailProviders',
            },
            one: {
              name: 'emailProvider',
            },
          },
          delete: {
            many: { disabled: false },
          },
          update: {
            many: { disabled: false },
          },
          pagingStrategy: PagingStrategies.OFFSET,
          enableTotalCount: true,
        },
        {
          DTOClass: EmailTemplateDTO,
          CreateDTOClass: EmailTemplateInput,
          UpdateDTOClass: EmailTemplateInput,
          EntityClass: EmailTemplateEntity,
          guards: [JwtAuthGuard],
          read: {
            many: {
              name: 'emailTemplates',
            },
            one: {
              name: 'emailTemplate',
            },
          },
          delete: {
            many: { disabled: false },
          },
          update: {
            many: { disabled: false },
          },
          pagingStrategy: PagingStrategies.OFFSET,
          enableTotalCount: true,
        },
        {
          EntityClass: EmailEntity,
          DTOClass: EmailDTO,
          guards: [JwtAuthGuard],
          read: {
            many: {
              name: 'emails',
            },
            one: {
              name: 'email',
            },
          },
          create: {
            disabled: true, // Emails are created by the system, not by users
          },
          update: {
            disabled: true,
          },
          delete: {
            many: { disabled: false },
          },
          pagingStrategy: PagingStrategies.OFFSET,
          enableTotalCount: true,
        },
      ],
    }),
    TypeOrmModule.forFeature([EmailProviderEntity]),
  ],
  providers: [EmailProviderService, EmailProviderResolver],
})
export class EmailProviderModule {}
