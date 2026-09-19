import { MigrationInterface, QueryRunner } from 'typeorm';

export class DriverCode1758200000000 implements MigrationInterface {
  name = 'DriverCode1758200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`driver\` ADD \`driverCode\` varchar(20) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`driver\` ADD UNIQUE INDEX \`IDX_driver_driverCode\` (\`driverCode\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`driver\` DROP INDEX \`IDX_driver_driverCode\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`driver\` DROP COLUMN \`driverCode\``,
    );
  }
}
