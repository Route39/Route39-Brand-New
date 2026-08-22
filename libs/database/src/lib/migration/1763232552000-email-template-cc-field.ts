import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EmailTemplateCcField1763232552000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // Add cc column to email_template table
      await queryRunner.addColumn(
        'email_template',
        new TableColumn({
          name: 'cc',
          type: 'varchar',
          length: '500',
          isNullable: true,
          comment: 'Comma-separated list of CC email addresses',
        }),
      );

      // Add cc column to email table (transaction log)
      await queryRunner.addColumn(
        'email',
        new TableColumn({
          name: 'cc',
          type: 'varchar',
          length: '500',
          isNullable: true,
          comment: 'Comma-separated list of CC email addresses used',
        }),
      );

      // Add DRIVER_REGISTRATION_SUBMITTED to email_event_type enum
      // First, alter the email_template eventType column
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
          'AUTH_VERIFICATION'
        ) NOT NULL
      `);

      // Seed default template for DRIVER_REGISTRATION_SUBMITTED
      await queryRunner.query(`
        INSERT INTO email_template (eventType, name, subject, bodyHtml, isActive, cc)
        VALUES (
          'DRIVER_REGISTRATION_SUBMITTED',
          'Driver Registration Submitted',
          'New Driver Registration: {firstName} {lastName}',
          '<h1>New Driver Registration</h1>
<p>A new driver has completed their registration and is awaiting approval.</p>
<p><strong>Name:</strong> {firstName} {lastName}</p>
<p><strong>Email:</strong> {email}</p>
<p><strong>Phone:</strong> {phone}</p>
<p>Please review their application in the admin dashboard.</p>',
          1,
          NULL
        )
      `);

      console.log(
        'Successfully added CC field and DRIVER_REGISTRATION_SUBMITTED event',
      );
    } catch (error) {
      console.error('Error in EmailTemplateCcField migration:', error);
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      // Remove the seeded template
      await queryRunner.query(`
        DELETE FROM email_template WHERE eventType = 'DRIVER_REGISTRATION_SUBMITTED'
      `);

      // Revert the email_template eventType enum
      await queryRunner.query(`
        ALTER TABLE email_template
        MODIFY COLUMN eventType ENUM(
          'DRIVER_APPROVED',
          'DRIVER_REJECTED',
          'DRIVER_DOCUMENTS_PENDING',
          'DRIVER_SUSPENDED',
          'ORDER_CONFIRMED',
          'ORDER_COMPLETED',
          'ORDER_CANCELLED',
          'ORDER_REFUNDED',
          'AUTH_WELCOME',
          'AUTH_PASSWORD_RESET',
          'AUTH_VERIFICATION'
        ) NOT NULL
      `);

      // Revert the email table eventType enum
      await queryRunner.query(`
        ALTER TABLE email
        MODIFY COLUMN eventType ENUM(
          'DRIVER_APPROVED',
          'DRIVER_REJECTED',
          'DRIVER_DOCUMENTS_PENDING',
          'DRIVER_SUSPENDED',
          'ORDER_CONFIRMED',
          'ORDER_COMPLETED',
          'ORDER_CANCELLED',
          'ORDER_REFUNDED',
          'AUTH_WELCOME',
          'AUTH_PASSWORD_RESET',
          'AUTH_VERIFICATION'
        ) NOT NULL
      `);

      // Remove cc columns
      await queryRunner.dropColumn('email', 'cc');
      await queryRunner.dropColumn('email_template', 'cc');

      console.log('Successfully reverted EmailTemplateCcField migration');
    } catch (error) {
      console.error('Error in EmailTemplateCcField down migration:', error);
      throw error;
    }
  }
}
