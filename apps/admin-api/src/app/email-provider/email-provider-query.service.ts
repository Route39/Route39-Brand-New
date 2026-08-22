import { InjectRepository } from '@nestjs/typeorm';
import { QueryService } from '@ptc-org/nestjs-query-core';
import { TypeOrmQueryService } from '@ptc-org/nestjs-query-typeorm';
import { EmailProviderEntity } from '@ridy/database';
import { Not, Repository } from 'typeorm';
import { EmailProviderInput } from './dto/email-provider.input';

@QueryService(EmailProviderEntity)
export class EmailProviderQueryService extends TypeOrmQueryService<EmailProviderEntity> {
  constructor(
    @InjectRepository(EmailProviderEntity)
    public override repo: Repository<EmailProviderEntity>,
  ) {
    super(repo);
  }

  override async createOne(
    record: EmailProviderInput,
  ): Promise<EmailProviderEntity> {
    const count = await this.repo.count();
    // If this is the first provider, make it default
    if (count === 0) {
      record.isDefault = true;
    }
    // If this provider should be default, unset other defaults
    if (record.isDefault) {
      await this.repo.update(
        {
          id: Not(0),
        },
        { isDefault: false },
      );
    }
    return super.createOne(record);
  }
}
