import { MigrationInterface, QueryRunner } from 'typeorm';

export class FleetStaffSessionNullableStaffId1763232550000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE fleet_staff_session MODIFY fleetStaffId int NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE fleet_staff_session MODIFY fleetStaffId int NOT NULL`,
    );
  }
}
