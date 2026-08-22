import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

export enum EmailProviderType {
  SendGrid = 'SendGrid',
  MailerSend = 'MailerSend',
}

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELIVERED = 'DELIVERED',
  BOUNCED = 'BOUNCED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
}

export enum EmailEventType {
  DRIVER_APPROVED = 'DRIVER_APPROVED',
  DRIVER_REJECTED = 'DRIVER_REJECTED',
  DRIVER_DOCUMENTS_PENDING = 'DRIVER_DOCUMENTS_PENDING',
  DRIVER_SUSPENDED = 'DRIVER_SUSPENDED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_REFUNDED = 'ORDER_REFUNDED',
  AUTH_WELCOME = 'AUTH_WELCOME',
  AUTH_PASSWORD_RESET = 'AUTH_PASSWORD_RESET',
  AUTH_VERIFICATION = 'AUTH_VERIFICATION',
}

export enum OperatorPermission {
  Critical_View = 'Critical_View',
  Critical_Edit = 'Critical_Edit',
  Drivers_View = 'Drivers_View',
  Drivers_Edit = 'Drivers_Edit',
  Riders_View = 'Riders_View',
  Riders_Edit = 'Riders_Edit',
  Regions_View = 'Regions_View',
  Regions_Edit = 'Regions_Edit',
  Services_View = 'Services_View',
  Services_Edit = 'Services_Edit',
  Complaints_View = 'Complaints_View',
  Complaints_Edit = 'Complaints_Edit',
  Coupons_View = 'Coupons_View',
  Coupons_Edit = 'Coupons_Edit',
  Announcements_View = 'Announcements_View',
  Announcements_Edit = 'Announcements_Edit',
  Requests_View = 'Requests_View',
  Fleets_View = 'Fleets_View',
  Fleets_Edit = 'Fleets_Edit',
  Gateways_View = 'Gateways_View',
  Gateways_Edit = 'Gateways_Edit',
  Users_View = 'Users_View',
  Users_Edit = 'Users_Edit',
  Cars_View = 'Cars_View',
  Cars_Edit = 'Cars_Edit',
  FleetWallet_View = 'FleetWallet_View',
  FleetWallet_Edit = 'FleetWallet_Edit',
  ProviderWallet_View = 'ProviderWallet_View',
  ProviderWallet_Edit = 'ProviderWallet_Edit',
  DriverWallet_View = 'DriverWallet_View',
  DriverWallet_Edit = 'DriverWallet_Edit',
  RiderWallet_View = 'RiderWallet_View',
  RiderWallet_Edit = 'RiderWallet_Edit',
  ReviewParameter_Edit = 'ReviewParameter_Edit',
  Payouts_View = 'Payouts_View',
  Payouts_Edit = 'Payouts_Edit',
  GiftBatch_View = 'GiftBatch_View',
  GiftBatch_Create = 'GiftBatch_Create',
  GiftBatch_ViewCodes = 'GiftBatch_ViewCodes',
  SMSProviders_View = 'SMSProviders_View',
  SMSProviders_Edit = 'SMSProviders_Edit',
  EmailProviders_View = 'EmailProviders_View',
  EmailProviders_Edit = 'EmailProviders_Edit',
  EmailTemplates_View = 'EmailTemplates_View',
  EmailTemplates_Edit = 'EmailTemplates_Edit',
}

export class EmailProviderModule1763232551000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // Create email_provider table
      await queryRunner.createTable(
        new Table({
          name: 'email_provider',
          columns: [
            new TableColumn({
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            }),
            new TableColumn({
              name: 'name',
              type: 'varchar',
              isNullable: false,
            }),
            new TableColumn({
              name: 'type',
              type: 'enum',
              enum: Object.values(EmailProviderType),
              isNullable: false,
            }),
            new TableColumn({
              name: 'isDefault',
              type: 'boolean',
              isNullable: false,
              default: false,
            }),
            new TableColumn({
              name: 'apiKey',
              type: 'varchar',
              isNullable: true,
            }),
            new TableColumn({
              name: 'fromEmail',
              type: 'varchar',
              isNullable: true,
            }),
            new TableColumn({
              name: 'fromName',
              type: 'varchar',
              isNullable: true,
            }),
            new TableColumn({
              name: 'replyToEmail',
              type: 'varchar',
              isNullable: true,
            }),
            new TableColumn({
              name: 'createdAt',
              type: 'datetime',
              default: 'NOW()',
            }),
            new TableColumn({
              name: 'deletedAt',
              type: 'datetime',
              isNullable: true,
            }),
          ],
        }),
        true,
      );

      // Create email_template table
      await queryRunner.createTable(
        new Table({
          name: 'email_template',
          columns: [
            new TableColumn({
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            }),
            new TableColumn({
              name: 'eventType',
              type: 'enum',
              enum: Object.values(EmailEventType),
              isNullable: false,
            }),
            new TableColumn({
              name: 'name',
              type: 'varchar',
              isNullable: false,
            }),
            new TableColumn({
              name: 'subject',
              type: 'varchar',
              isNullable: false,
            }),
            new TableColumn({
              name: 'bodyHtml',
              type: 'text',
              isNullable: false,
            }),
            new TableColumn({
              name: 'bodyPlainText',
              type: 'text',
              isNullable: true,
            }),
            new TableColumn({
              name: 'isActive',
              type: 'boolean',
              isNullable: false,
              default: true,
            }),
            new TableColumn({
              name: 'locale',
              type: 'varchar',
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
              name: 'deletedAt',
              type: 'datetime',
              isNullable: true,
            }),
          ],
        }),
        true,
      );

      // Create email table (logs)
      await queryRunner.createTable(
        new Table({
          name: 'email',
          columns: [
            new TableColumn({
              name: 'id',
              type: 'int',
              isPrimary: true,
              isGenerated: true,
              generationStrategy: 'increment',
            }),
            new TableColumn({
              name: 'to',
              type: 'varchar',
              isNullable: false,
            }),
            new TableColumn({
              name: 'from',
              type: 'varchar',
              isNullable: false,
            }),
            new TableColumn({
              name: 'subject',
              type: 'varchar',
              isNullable: false,
            }),
            new TableColumn({
              name: 'bodyHtml',
              type: 'text',
              isNullable: false,
            }),
            new TableColumn({
              name: 'status',
              type: 'enum',
              enum: Object.values(EmailStatus),
              default: "'PENDING'",
            }),
            new TableColumn({
              name: 'eventType',
              type: 'enum',
              enum: Object.values(EmailEventType),
              isNullable: false,
            }),
            new TableColumn({
              name: 'providerMessageId',
              type: 'varchar',
              isNullable: true,
            }),
            new TableColumn({
              name: 'errorMessage',
              type: 'text',
              isNullable: true,
            }),
            new TableColumn({
              name: 'providerId',
              type: 'int',
              isNullable: false,
            }),
            new TableColumn({
              name: 'templateId',
              type: 'int',
              isNullable: true,
            }),
            new TableColumn({
              name: 'sentAt',
              type: 'datetime',
              default: 'NOW()',
            }),
          ],
        }),
        true,
      );

      // Add foreign key for email -> email_provider
      await queryRunner.createForeignKey(
        'email',
        new TableForeignKey({
          columnNames: ['providerId'],
          referencedTableName: 'email_provider',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      // Update operator_role permissions to include email permissions
      await queryRunner.changeColumn(
        'operator_role',
        'permissions',
        new TableColumn({
          name: 'permissions',
          type: 'set',
          enum: Object.values(OperatorPermission),
        }),
      );

      // Grant email permissions to all existing roles by default
      await this.grantEmailPermissionsToAllRoles(queryRunner);

      // Seed default email templates
      await this.seedDefaultTemplates(queryRunner);
    } catch (error) {
      console.error('Error in EmailProviderModule migration:', error);
    }
  }

  private async grantEmailPermissionsToAllRoles(
    queryRunner: QueryRunner,
  ): Promise<void> {
    try {
      // Get all existing roles
      const roles = await queryRunner.query(
        `SELECT id, permissions FROM operator_role`,
      );

      const emailPermissions = [
        'EmailProviders_View',
        'EmailProviders_Edit',
        'EmailTemplates_View',
        'EmailTemplates_Edit',
      ];

      for (const role of roles) {
        // Parse existing permissions
        const existingPermissions: string[] = role.permissions
          ? role.permissions.split(',').filter((p: string) => p.trim())
          : [];

        // Add email permissions if not already present
        const newPermissions = [
          ...new Set([...existingPermissions, ...emailPermissions]),
        ];

        // Update the role with new permissions
        await queryRunner.query(
          `UPDATE operator_role SET permissions = ? WHERE id = ?`,
          [newPermissions.join(','), role.id],
        );
      }

      console.log('Email permissions granted to all existing roles');
    } catch (error) {
      console.error('Error granting email permissions to roles:', error);
    }
  }

  private async seedDefaultTemplates(queryRunner: QueryRunner): Promise<void> {
    const templates = [
      {
        eventType: EmailEventType.DRIVER_APPROVED,
        name: 'Driver Approved',
        subject: 'Congratulations! Your driver application has been approved',
        bodyHtml: `<h1>Welcome aboard, {firstName}!</h1>
<p>Great news! Your driver application has been approved.</p>
<p>You can now start accepting rides and earning with us.</p>
<p>Open the driver app to get started!</p>`,
      },
      {
        eventType: EmailEventType.DRIVER_REJECTED,
        name: 'Driver Rejected',
        subject: 'Update on your driver application',
        bodyHtml: `<h1>Hi {firstName},</h1>
<p>We've reviewed your driver application and unfortunately, we're unable to approve it at this time.</p>
<p>If you have any questions, please contact our support team.</p>`,
      },
      {
        eventType: EmailEventType.DRIVER_DOCUMENTS_PENDING,
        name: 'Driver Documents Pending',
        subject: 'Action required: Please submit your documents',
        bodyHtml: `<h1>Hi {firstName},</h1>
<p>We're reviewing your driver application but need some additional documents from you.</p>
<p>Please open the driver app and submit the required documents to continue.</p>`,
      },
      {
        eventType: EmailEventType.ORDER_CONFIRMED,
        name: 'Order Confirmed',
        subject: 'Your ride has been confirmed - Order #{orderNumber}',
        bodyHtml: `<h1>Hi {firstName},</h1>
<p>Your ride has been confirmed!</p>
<p><strong>Order:</strong> #{orderNumber}</p>
<p><strong>Pickup:</strong> {pickup}</p>
<p><strong>Dropoff:</strong> {dropoff}</p>
<p><strong>Driver:</strong> {driverName}</p>
<p><strong>Vehicle:</strong> {vehicleModel} - {licensePlate}</p>`,
      },
      {
        eventType: EmailEventType.ORDER_COMPLETED,
        name: 'Order Completed',
        subject: 'Thanks for riding with us! - Order #{orderNumber}',
        bodyHtml: `<h1>Thanks for riding with us, {firstName}!</h1>
<p>Your ride has been completed.</p>
<p><strong>Order:</strong> #{orderNumber}</p>
<p><strong>Amount:</strong> {amount}</p>
<p>We hope you had a great experience!</p>`,
      },
      {
        eventType: EmailEventType.ORDER_CANCELLED,
        name: 'Order Cancelled',
        subject: 'Your ride has been cancelled - Order #{orderNumber}',
        bodyHtml: `<h1>Hi {firstName},</h1>
<p>Your ride (Order #{orderNumber}) has been cancelled.</p>
<p>If you didn't request this cancellation, please contact our support team.</p>`,
      },
      {
        eventType: EmailEventType.AUTH_WELCOME,
        name: 'Welcome Email',
        subject: 'Welcome to our platform!',
        bodyHtml: `<h1>Welcome, {firstName}!</h1>
<p>Thank you for joining our platform.</p>
<p>We're excited to have you on board. Start exploring and book your first ride today!</p>`,
      },
      {
        eventType: EmailEventType.AUTH_PASSWORD_RESET,
        name: 'Password Reset',
        subject: 'Reset your password',
        bodyHtml: `<h1>Hi {firstName},</h1>
<p>We received a request to reset your password.</p>
<p>Your reset code is: <strong>{verificationCode}</strong></p>
<p>If you didn't request this, please ignore this email.</p>`,
      },
      {
        eventType: EmailEventType.AUTH_VERIFICATION,
        name: 'Email Verification',
        subject: 'Verify your email address',
        bodyHtml: `<h1>Hi {firstName},</h1>
<p>Please verify your email address.</p>
<p>Your verification code is: <strong>{verificationCode}</strong></p>`,
      },
    ];

    for (const template of templates) {
      await queryRunner.query(
        `INSERT INTO email_template (eventType, name, subject, bodyHtml, isActive) VALUES ('${template.eventType}', '${template.name}', '${template.subject.replace(/'/g, "''")}', '${template.bodyHtml.replace(/'/g, "''")}', 1)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.dropTable('email');
      await queryRunner.dropTable('email_template');
      await queryRunner.dropTable('email_provider');
    } catch (error) {
      console.error('Error in EmailProviderModule down migration:', error);
    }
  }
}
