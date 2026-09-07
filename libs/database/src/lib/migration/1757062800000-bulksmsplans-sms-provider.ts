import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export enum SMSProviderType {
  Firebase = 'Firebase',
  Twilio = 'Twilio',
  Plivo = 'Plivo',
  Pahappa = 'Pahappa',
  BroadNet = 'BroadNet',
  Vonage = 'Vonage',
  ClickSend = 'ClickSend',
  Infobip = 'Infobip',
  MessageBird = 'MessageBird',
  VentisSMS = 'VentisSMS',
  ClickSMSNet = 'ClickSMSNet',
  BulkSMSPlans = 'BulkSMSPlans',
}

export class BulksmsplansSmsProvider1757062800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'sms_provider',
      'type',
      new TableColumn({
        name: 'type',
        type: 'enum',
        enum: Object.values(SMSProviderType),
      }),
    );

    const apiId = process.env.BULKSMSPLANS_API_ID;
    const apiPassword = process.env.BULKSMSPLANS_API_PASSWORD;
    const senderId = process.env.BULKSMSPLANS_SENDER_ID;

    if (apiId && apiPassword) {
      await queryRunner.query(
        `INSERT INTO sms_provider (type, isDefault, name, accountId, authToken, fromNumber, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          'BulkSMSPlans',
          true,
          'BulkSMSPlans',
          apiPassword,
          apiId,
          senderId || '',
        ],
      );

      await queryRunner.query(
        `UPDATE sms_provider SET isDefault = false WHERE type != 'BulkSMSPlans'`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
