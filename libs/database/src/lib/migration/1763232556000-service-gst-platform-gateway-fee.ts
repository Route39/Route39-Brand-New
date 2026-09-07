import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ServiceGstPlatformGatewayFee1763232556000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'service',
      new TableColumn({
        name: 'gstPercent',
        type: 'float',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment: 'GST percentage applied to this service (optional)',
      }),
    );

    await queryRunner.addColumn(
      'service',
      new TableColumn({
        name: 'platformFee',
        type: 'float',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment: 'Platform fee for this service (optional)',
      }),
    );

    await queryRunner.addColumn(
      'service',
      new TableColumn({
        name: 'paymentGatewayFee',
        type: 'float',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment: 'Payment gateway fee for this service (optional)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('service', 'paymentGatewayFee');
    await queryRunner.dropColumn('service', 'platformFee');
    await queryRunner.dropColumn('service', 'gstPercent');
  }
}