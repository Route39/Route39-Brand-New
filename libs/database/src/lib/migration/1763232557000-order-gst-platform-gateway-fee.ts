import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class OrderGstPlatformGatewayFee1763232557000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'request',
      new TableColumn({
        name: 'gstAmount',
        type: 'float',
        precision: 10,
        scale: 2,
        default: 0,
        isNullable: false,
        comment: 'GST amount charged on this order, snapshotted at dispatch',
      }),
    );

    await queryRunner.addColumn(
      'request',
      new TableColumn({
        name: 'platformFeeAmount',
        type: 'float',
        precision: 10,
        scale: 2,
        default: 0,
        isNullable: false,
        comment: 'Platform fee charged on this order, snapshotted at dispatch',
      }),
    );

    await queryRunner.addColumn(
      'request',
      new TableColumn({
        name: 'paymentGatewayFeeAmount',
        type: 'float',
        precision: 10,
        scale: 2,
        default: 0,
        isNullable: false,
        comment:
          'Payment gateway fee charged on this order (only for online payment modes), snapshotted at dispatch',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('request', 'paymentGatewayFeeAmount');
    await queryRunner.dropColumn('request', 'platformFeeAmount');
    await queryRunner.dropColumn('request', 'gstAmount');
  }
}