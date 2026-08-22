import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EmailTemplateProviderTemplateId1763232553000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // Add content_source enum column to email_template table
      await queryRunner.addColumn(
        'email_template',
        new TableColumn({
          name: 'contentSource',
          type: 'enum',
          enum: ['Inline', 'ProviderTemplate'],
          default: "'Inline'",
          comment:
            'Source of email content - Inline body or Provider template ID',
        }),
      );

      // Add provider_template_id column to email_template table
      await queryRunner.addColumn(
        'email_template',
        new TableColumn({
          name: 'providerTemplateId',
          type: 'varchar',
          length: '255',
          isNullable: true,
          comment: 'External template ID from email provider (SendGrid/MailerSend)',
        }),
      );

      // Make bodyHtml nullable (since it's not required when using provider template)
      await queryRunner.changeColumn(
        'email_template',
        'bodyHtml',
        new TableColumn({
          name: 'bodyHtml',
          type: 'text',
          isNullable: true,
          comment: 'HTML body content for inline email templates',
        }),
      );

      console.log(
        'Successfully added contentSource and providerTemplateId fields to email_template',
      );
    } catch (error) {
      console.error(
        'Error in EmailTemplateProviderTemplateId migration:',
        error,
      );
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      // Revert bodyHtml to non-nullable (set empty string for null values first)
      await queryRunner.query(`
        UPDATE email_template SET bodyHtml = '' WHERE bodyHtml IS NULL
      `);

      await queryRunner.changeColumn(
        'email_template',
        'bodyHtml',
        new TableColumn({
          name: 'bodyHtml',
          type: 'text',
          isNullable: false,
        }),
      );

      // Remove providerTemplateId column
      await queryRunner.dropColumn('email_template', 'providerTemplateId');

      // Remove contentSource column
      await queryRunner.dropColumn('email_template', 'contentSource');

      console.log(
        'Successfully reverted EmailTemplateProviderTemplateId migration',
      );
    } catch (error) {
      console.error(
        'Error in EmailTemplateProviderTemplateId down migration:',
        error,
      );
      throw error;
    }
  }
}
