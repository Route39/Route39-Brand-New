import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class CargoWaitingTimeMinutes1789400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'service',
      new TableColumn({
        name: 'cargoWaitingTimeMinutes',
        type: 'int',
        isNullable: true,
        comment:
          'Free waiting time (in minutes) before cargo waiting charges start applying.',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('service', 'cargoWaitingTimeMinutes');
  }
}