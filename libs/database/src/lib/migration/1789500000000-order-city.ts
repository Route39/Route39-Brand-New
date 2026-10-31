import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const cityCase = (col: string) => `CASE
  WHEN ${col} LIKE '%Tirup%' THEN 'Tiruppur'
  WHEN ${col} LIKE '%Coimbatore%' THEN 'Coimbatore'
  WHEN ${col} LIKE '%Chennai%' THEN 'Chennai'
  WHEN ${col} LIKE '%Bangalore%' OR ${col} LIKE '%Bengaluru%' THEN 'Bangalore'
  ELSE NULL END`;

export class OrderCity1789500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'request',
      new TableColumn({ name: 'city', type: 'varchar', isNullable: true }),
    );
    // Pickup address first
    await queryRunner.query(
      `UPDATE request SET city = ${cityCase("SUBSTRING_INDEX(addresses,'|',1)")}`,
    );
    // Fallback: any address (pickup may be empty)
    await queryRunner.query(
      `UPDATE request SET city = ${cityCase('addresses')} WHERE city IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('request', 'city');
  }
}
