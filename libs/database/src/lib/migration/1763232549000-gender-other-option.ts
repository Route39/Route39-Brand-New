import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
  Unknown = 'unknown',
}

export class GenderOtherOption1763232549000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update gender column in rider table (CustomerEntity)
    await queryRunner.changeColumn(
      'rider',
      'gender',
      new TableColumn({
        name: 'gender',
        type: 'enum',
        enum: Object.values(Gender),
        isNullable: true,
      }),
    );

    // Update gender column in driver table (DriverEntity)
    await queryRunner.changeColumn(
      'driver',
      'gender',
      new TableColumn({
        name: 'gender',
        type: 'enum',
        enum: Object.values(Gender),
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to original enum without 'other'
    const originalGender = ['male', 'female', 'unknown'];

    await queryRunner.changeColumn(
      'rider',
      'gender',
      new TableColumn({
        name: 'gender',
        type: 'enum',
        enum: originalGender,
        isNullable: true,
      }),
    );

    await queryRunner.changeColumn(
      'driver',
      'gender',
      new TableColumn({
        name: 'gender',
        type: 'enum',
        enum: originalGender,
        isNullable: true,
      }),
    );
  }
}
