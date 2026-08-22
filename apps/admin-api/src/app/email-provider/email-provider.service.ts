import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailProviderEntity } from '@ridy/database';
import { Not, Repository } from 'typeorm';

@Injectable()
export class EmailProviderService {
  constructor(
    @InjectRepository(EmailProviderEntity)
    private readonly emailProviderRepository: Repository<EmailProviderEntity>,
  ) {}

  async markAsDefault(id: number): Promise<EmailProviderEntity> {
    // First, set all providers to non-default
    await this.emailProviderRepository.update(
      { id: Not(id) },
      { isDefault: false },
    );
    // Then set the specified provider as default
    await this.emailProviderRepository.update({ id }, { isDefault: true });
    const provider = await this.emailProviderRepository.findOneBy({ id });
    return provider;
  }
}
