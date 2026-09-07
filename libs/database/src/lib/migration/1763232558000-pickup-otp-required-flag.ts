import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class PickupOtpRequiredFlag1763232558000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'request',
      new TableColumn({
        name: 'pickupOtpRequired',
        type: 'boolean',
        isNullable: false,
        default: true,
        comment:
          'Whether the driver must verify a pickup OTP before starting this ride. False for rides manually assigned by a dispatcher.',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('request', 'pickupOtpRequired');
  }
}