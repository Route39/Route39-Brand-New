import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DriverAdditionalFields1789460100000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'driver',
      new TableColumn({
        name: 'city',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'driver',
      new TableColumn({
        name: 'vehicleOwnership',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'driver',
      new TableColumn({
        name: 'aadhaarNumber',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'driver',
      new TableColumn({
        name: 'panNumber',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'driver',
      new TableColumn({
        name: 'dob',
        type: 'varchar',
        isNullable: true,
        comment: 'Driver date of birth, stored as free-text from onboarding form',
      }),
    );

    await queryRunner.query(
      `INSERT INTO driver_document (title, description, isEnabled, isRequired, hasExpiryDate) VALUES
        ('Aadhar Card', 'Government issued Aadhaar identity card', true, true, false),
        ('PAN Card', 'Permanent Account Number card', true, true, false),
        ('Original Driving License', 'Valid driving license issued by RTO', true, true, true),
        ('RC / Vehicle Registration', 'Vehicle Registration Certificate', true, false, true)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM driver_document WHERE title IN ('Aadhar Card', 'PAN Card', 'Original Driving License', 'RC / Vehicle Registration')`,
    );
    await queryRunner.dropColumn('driver', 'dob');
    await queryRunner.dropColumn('driver', 'panNumber');
    await queryRunner.dropColumn('driver', 'aadhaarNumber');
    await queryRunner.dropColumn('driver', 'vehicleOwnership');
    await queryRunner.dropColumn('driver', 'city');
  }
}
