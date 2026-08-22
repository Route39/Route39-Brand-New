import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ActualDistanceDurationTracking1763232555000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'request',
      new TableColumn({
        name: 'distanceActual',
        type: 'int',
        isNullable: true,
        comment: 'Actual GPS-tracked distance in meters',
      }),
    );

    await queryRunner.addColumn(
      'request',
      new TableColumn({
        name: 'durationActual',
        type: 'int',
        isNullable: true,
        comment: 'Actual duration in seconds',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('request', 'distanceActual');
    await queryRunner.dropColumn('request', 'durationActual');
  }
}
