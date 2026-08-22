import { MigrationInterface, QueryRunner } from 'typeorm';

export class CallMaskingFields1733836800000 implements MigrationInterface {
  name = 'CallMaskingFields1733836800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`sms_provider\` ADD \`callMaskingNumber\` varchar(255) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`sms_provider\` ADD \`callMaskingEnabled\` tinyint NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`sms_provider\` DROP COLUMN \`callMaskingEnabled\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`sms_provider\` DROP COLUMN \`callMaskingNumber\``,
    );
  }
}
