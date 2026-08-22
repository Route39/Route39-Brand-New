import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
  TableUnique,
} from 'typeorm';

export enum AuthMethodType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
  PASSKEY = 'PASSKEY',
}

export enum UserType {
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
}

export class AuthMethodModule1763232553000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // Create auth_method table
      await queryRunner.createTable(
        new Table({
          name: 'auth_method',
          columns: [
            new TableColumn({
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            }),
            new TableColumn({
              name: 'userType',
              type: 'enum',
              enum: Object.values(UserType),
              isNullable: false,
            }),
            new TableColumn({
              name: 'userId',
              type: 'int',
              isNullable: false,
            }),
            new TableColumn({
              name: 'type',
              type: 'enum',
              enum: Object.values(AuthMethodType),
              isNullable: false,
            }),
            new TableColumn({
              name: 'identifier',
              type: 'varchar',
              length: '255',
              isNullable: false,
            }),
            new TableColumn({
              name: 'isVerified',
              type: 'boolean',
              default: false,
            }),
            new TableColumn({
              name: 'isPrimary',
              type: 'boolean',
              default: false,
            }),
            new TableColumn({
              name: 'externalProviderId',
              type: 'varchar',
              length: '255',
              isNullable: true,
            }),
            new TableColumn({
              name: 'metadata',
              type: 'json',
              isNullable: true,
            }),
            new TableColumn({
              name: 'createdAt',
              type: 'datetime',
              default: 'NOW()',
            }),
            new TableColumn({
              name: 'updatedAt',
              type: 'datetime',
              default: 'NOW()',
              onUpdate: 'NOW()',
            }),
            new TableColumn({
              name: 'verifiedAt',
              type: 'datetime',
              isNullable: true,
            }),
            new TableColumn({
              name: 'lastUsedAt',
              type: 'datetime',
              isNullable: true,
            }),
          ],
        }),
        true,
      );

      // Add unique constraint: one auth method type per user
      await queryRunner.createUniqueConstraint(
        'auth_method',
        new TableUnique({
          name: 'UQ_auth_method_user_type',
          columnNames: ['userType', 'userId', 'type'],
        }),
      );

      // Add index for user lookup
      await queryRunner.createIndex(
        'auth_method',
        new TableIndex({
          name: 'IDX_auth_method_user',
          columnNames: ['userType', 'userId'],
        }),
      );

      // Add index for auth method lookup by identifier
      await queryRunner.createIndex(
        'auth_method',
        new TableIndex({
          name: 'IDX_auth_method_identifier',
          columnNames: ['type', 'identifier'],
        }),
      );

      // Create auth_verification_config table
      await queryRunner.createTable(
        new Table({
          name: 'auth_verification_config',
          columns: [
            new TableColumn({
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            }),
            new TableColumn({
              name: 'userType',
              type: 'enum',
              enum: Object.values(UserType),
              isNullable: false,
            }),
            new TableColumn({
              name: 'authMethodType',
              type: 'enum',
              enum: Object.values(AuthMethodType),
              isNullable: false,
            }),
            new TableColumn({
              name: 'verificationRequired',
              type: 'boolean',
              default: false,
            }),
            new TableColumn({
              name: 'allowLoginWithoutVerification',
              type: 'boolean',
              default: false,
            }),
            new TableColumn({
              name: 'codeLength',
              type: 'int',
              default: 6,
            }),
            new TableColumn({
              name: 'codeTtlSeconds',
              type: 'int',
              default: 180, // 3 minutes
            }),
            new TableColumn({
              name: 'maxAttempts',
              type: 'int',
              default: 5,
            }),
            new TableColumn({
              name: 'cooldownSeconds',
              type: 'int',
              default: 300, // 5 minutes
            }),
          ],
        }),
        true,
      );

      // Add unique constraint for userType + authMethodType
      await queryRunner.createUniqueConstraint(
        'auth_verification_config',
        new TableUnique({
          name: 'UQ_auth_verification_config_user_method',
          columnNames: ['userType', 'authMethodType'],
        }),
      );

      // Add emailVerified column to rider (customer) table
      await queryRunner.addColumn(
        'rider',
        new TableColumn({
          name: 'emailVerified',
          type: 'boolean',
          default: false,
        }),
      );

      // Add emailVerified column to driver table
      await queryRunner.addColumn(
        'driver',
        new TableColumn({
          name: 'emailVerified',
          type: 'boolean',
          default: false,
        }),
      );

      // Migrate existing phone numbers to auth_method table
      await this.migrateExistingPhoneNumbers(queryRunner);

      // Seed default verification configs
      await this.seedDefaultConfigs(queryRunner);
    } catch (error) {
      console.error('Error in AuthMethodModule migration:', error);
    }
  }

  private async migrateExistingPhoneNumbers(
    queryRunner: QueryRunner,
  ): Promise<void> {
    try {
      // Migrate customer phone numbers
      const customers = await queryRunner.query(
        `SELECT id, mobileNumber FROM rider WHERE mobileNumber IS NOT NULL AND deletedAt IS NULL`,
      );

      for (const customer of customers) {
        await queryRunner.query(
          `INSERT INTO auth_method (userType, userId, type, identifier, isVerified, isPrimary, createdAt, updatedAt)
           VALUES ('CUSTOMER', ?, 'PHONE', ?, true, true, NOW(), NOW())`,
          [customer.id, customer.mobileNumber],
        );
      }

      console.log(
        `Migrated ${customers.length} customer phone numbers to auth_method`,
      );

      // Migrate driver phone numbers
      const drivers = await queryRunner.query(
        `SELECT id, mobileNumber FROM driver WHERE mobileNumber IS NOT NULL AND deletedAt IS NULL`,
      );

      for (const driver of drivers) {
        await queryRunner.query(
          `INSERT INTO auth_method (userType, userId, type, identifier, isVerified, isPrimary, createdAt, updatedAt)
           VALUES ('DRIVER', ?, 'PHONE', ?, true, true, NOW(), NOW())`,
          [driver.id, driver.mobileNumber],
        );
      }

      console.log(
        `Migrated ${drivers.length} driver phone numbers to auth_method`,
      );

      // Migrate existing emails if present
      const customersWithEmail = await queryRunner.query(
        `SELECT id, email FROM rider WHERE email IS NOT NULL AND email != '' AND deletedAt IS NULL`,
      );

      for (const customer of customersWithEmail) {
        await queryRunner.query(
          `INSERT INTO auth_method (userType, userId, type, identifier, isVerified, isPrimary, createdAt, updatedAt)
           VALUES ('CUSTOMER', ?, 'EMAIL', ?, false, false, NOW(), NOW())`,
          [customer.id, customer.email],
        );
      }

      console.log(
        `Migrated ${customersWithEmail.length} customer emails to auth_method`,
      );

      const driversWithEmail = await queryRunner.query(
        `SELECT id, email FROM driver WHERE email IS NOT NULL AND email != '' AND deletedAt IS NULL`,
      );

      for (const driver of driversWithEmail) {
        await queryRunner.query(
          `INSERT INTO auth_method (userType, userId, type, identifier, isVerified, isPrimary, createdAt, updatedAt)
           VALUES ('DRIVER', ?, 'EMAIL', ?, false, false, NOW(), NOW())`,
          [driver.id, driver.email],
        );
      }

      console.log(
        `Migrated ${driversWithEmail.length} driver emails to auth_method`,
      );
    } catch (error) {
      console.error('Error migrating phone numbers:', error);
    }
  }

  private async seedDefaultConfigs(queryRunner: QueryRunner): Promise<void> {
    try {
      // Customer: Email verification optional, allow login without verification
      await queryRunner.query(
        `INSERT INTO auth_verification_config (userType, authMethodType, verificationRequired, allowLoginWithoutVerification, codeLength, codeTtlSeconds, maxAttempts, cooldownSeconds)
         VALUES ('CUSTOMER', 'EMAIL', false, true, 6, 180, 5, 300)`,
      );

      // Customer: Phone verification (existing behavior - required)
      await queryRunner.query(
        `INSERT INTO auth_verification_config (userType, authMethodType, verificationRequired, allowLoginWithoutVerification, codeLength, codeTtlSeconds, maxAttempts, cooldownSeconds)
         VALUES ('CUSTOMER', 'PHONE', true, false, 4, 120, 5, 300)`,
      );

      // Driver: Email verification required
      await queryRunner.query(
        `INSERT INTO auth_verification_config (userType, authMethodType, verificationRequired, allowLoginWithoutVerification, codeLength, codeTtlSeconds, maxAttempts, cooldownSeconds)
         VALUES ('DRIVER', 'EMAIL', true, false, 6, 180, 5, 300)`,
      );

      // Driver: Phone verification (existing behavior - required)
      await queryRunner.query(
        `INSERT INTO auth_verification_config (userType, authMethodType, verificationRequired, allowLoginWithoutVerification, codeLength, codeTtlSeconds, maxAttempts, cooldownSeconds)
         VALUES ('DRIVER', 'PHONE', true, false, 4, 120, 5, 300)`,
      );

      console.log('Seeded default auth verification configs');
    } catch (error) {
      console.error('Error seeding verification configs:', error);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      // Drop emailVerified columns
      await queryRunner.dropColumn('rider', 'emailVerified');
      await queryRunner.dropColumn('driver', 'emailVerified');

      // Drop tables
      await queryRunner.dropTable('auth_verification_config');
      await queryRunner.dropTable('auth_method');
    } catch (error) {
      console.error('Error in AuthMethodModule down migration:', error);
    }
  }
}
