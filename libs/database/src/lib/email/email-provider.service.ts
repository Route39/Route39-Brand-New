import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenError } from '@nestjs/apollo';
import { EmailProviderEntity } from '../entities/email-provider.entity';

@Injectable()
export class EmailProviderService {
  constructor(
    @InjectRepository(EmailProviderEntity)
    private readonly emailProviderRepository: Repository<EmailProviderEntity>,
  ) {}

  async getDefaultProvider(): Promise<EmailProviderEntity> {
    const defaultProvider = await this.emailProviderRepository.findOne({
      where: { isDefault: true },
    });
    if (defaultProvider == null) {
      throw new ForbiddenError('Default email provider not found');
    }
    return defaultProvider;
  }

  async hasDefaultProvider(): Promise<boolean> {
    const defaultProvider = await this.emailProviderRepository.findOne({
      where: { isDefault: true },
    });
    return defaultProvider != null;
  }
}
