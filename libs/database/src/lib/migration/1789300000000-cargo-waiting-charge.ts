import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class CargoWaitingCharge1789300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'request',
      new TableColumn({
        name: 'arrivedAt',
        type: 'datetime',
        isNullable: true,
        comment:
          'Timestamp when the driver confirmed arrival at the pickup point. Starts the free-wait clock for cargo waiting charges.',
      }),
    );
    await queryRunner.addColumn(
      'request',
      new TableColumn({
        name: 'waitingChargeAmount',
        type: 'float',
        precision: 10,
        scale: 2,
        isNullable: true,
        default: 0,
        comment:
          'Extra charge billed when the driver confirms pickup more than 45 minutes after confirming arrival, for Cargo services.',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('request', 'waitingChargeAmount');
    await queryRunner.dropColumn('request', 'arrivedAt');
  }
}