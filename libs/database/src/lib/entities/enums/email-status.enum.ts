import { registerEnumType } from '@nestjs/graphql';

export enum EmailStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELIVERED = 'DELIVERED',
  BOUNCED = 'BOUNCED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
}

registerEnumType(EmailStatus, {
  name: 'EmailStatus',
  description: 'The status of the email',
});
