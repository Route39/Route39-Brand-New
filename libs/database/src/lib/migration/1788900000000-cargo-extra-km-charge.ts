import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class CargoExtraKmCharge1788900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'service',
      new TableColumn({
        name: 'cargoExtraKmChargeAfter45Min',
        type: 'float',
        precision: 10,
        scale: 2,
        isNullable: true,
        comment:
          'Extra per-km charge applied after 45 minutes, used for Cargo services',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('service', 'cargoExtraKmChargeAfter45Min');
  }
}