import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmailKycExpirationEvents1763232554000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // Add KYC expiration reminder event types to email_template eventType column
      await queryRunner.query(`
        ALTER TABLE email_template
        MODIFY COLUMN eventType ENUM(
          'DRIVER_APPROVED',
          'DRIVER_REJECTED',
          'DRIVER_DOCUMENTS_PENDING',
          'DRIVER_SUSPENDED',
          'DRIVER_REGISTRATION_SUBMITTED',
          'ORDER_CONFIRMED',
          'ORDER_COMPLETED',
          'ORDER_CANCELLED',
          'ORDER_REFUNDED',
          'AUTH_WELCOME',
          'AUTH_PASSWORD_RESET',
          'AUTH_VERIFICATION',
          'EXPIRING_KYC_30_DAY_REMINDER',
          'EXPIRING_KYC_14_DAY_REMINDER',
          'EXPIRING_KYC_7_DAY_REMINDER',
          'EXPIRING_KYC_3_DAY_REMINDER',
          'EXPIRING_KYC_2_DAY_REMINDER',
          'EXPIRING_KYC_1_DAY_REMINDER'
        ) NOT NULL
      `);

      // Also update the email table eventType column
      await queryRunner.query(`
        ALTER TABLE email
        MODIFY COLUMN eventType ENUM(
          'DRIVER_APPROVED',
          'DRIVER_REJECTED',
          'DRIVER_DOCUMENTS_PENDING',
          'DRIVER_SUSPENDED',
          'DRIVER_REGISTRATION_SUBMITTED',
          'ORDER_CONFIRMED',
          'ORDER_COMPLETED',
          'ORDER_CANCELLED',
          'ORDER_REFUNDED',
          'AUTH_WELCOME',
          'AUTH_PASSWORD_RESET',
          'AUTH_VERIFICATION',
          'EXPIRING_KYC_30_DAY_REMINDER',
          'EXPIRING_KYC_14_DAY_REMINDER',
          'EXPIRING_KYC_7_DAY_REMINDER',
          'EXPIRING_KYC_3_DAY_REMINDER',
          'EXPIRING_KYC_2_DAY_REMINDER',
          'EXPIRING_KYC_1_DAY_REMINDER'
        ) NOT NULL
      `);

      console.log(
        'Successfully added KYC expiration reminder event types to email tables',
      );
    } catch (error) {
      console.error('Error in EmailKycExpirationEvents migration:', error);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      // Revert email_template eventType enum
      await queryRunner.query(`
        ALTER TABLE email_template
        MODIFY COLUMN eventType ENUM(
          'DRIVER_APPROVED',
          'DRIVER_REJECTED',
          'DRIVER_DOCUMENTS_PENDING',
          'DRIVER_SUSPENDED',
          'DRIVER_REGISTRATION_SUBMITTED',
          'ORDER_CONFIRMED',
          'ORDER_COMPLETED',
          'ORDER_CANCELLED',
          'ORDER_REFUNDED',
          'AUTH_WELCOME',
          'AUTH_PASSWORD_RESET',
          'AUTH_VERIFICATION'
        ) NOT NULL
      `);

      // Revert email table eventType enum
      await queryRunner.query(`
        ALTER TABLE email
        MODIFY COLUMN eventType ENUM(
          'DRIVER_APPROVED',
          'DRIVER_REJECTED',
          'DRIVER_DOCUMENTS_PENDING',
          'DRIVER_SUSPENDED',
          'DRIVER_REGISTRATION_SUBMITTED',
          'ORDER_CONFIRMED',
          'ORDER_COMPLETED',
          'ORDER_CANCELLED',
          'ORDER_REFUNDED',
          'AUTH_WELCOME',
          'AUTH_PASSWORD_RESET',
          'AUTH_VERIFICATION'
        ) NOT NULL
      `);

      console.log('Successfully reverted EmailKycExpirationEvents migration');
    } catch (error) {
      console.error(
        'Error in EmailKycExpirationEvents down migration:',
        error,
      );
      throw error;
    }
  }
}
