import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EmailStatus } from './enums/email-status.enum';
import { EmailEventType } from './enums/email-event-type.enum';
import { EmailProviderEntity } from './email-provider.entity';

@Entity('email')
export class EmailEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  to!: string;

  @Column()
  from!: string;

  @Column()
  subject!: string;

  @Column('text')
  bodyHtml!: string;

  @Column('enum', {
    enum: EmailStatus,
    default: EmailStatus.PENDING,
  })
  status!: EmailStatus;

  @Column('enum', {
    enum: EmailEventType,
  })
  eventType!: EmailEventType;

  @Column({ nullable: true })
  providerMessageId?: string; // External ID from SendGrid/MailerSend

  @Column('text', { nullable: true })
  errorMessage?: string;

  @ManyToOne(() => EmailProviderEntity, (provider) => provider.emails)
  provider?: EmailProviderEntity;

  @Column()
  providerId!: number;

  @Column({ nullable: true })
  templateId?: number;

  @Column({ nullable: true, length: 500 })
  cc?: string; // Comma-separated list of CC email addresses used

  @CreateDateColumn()
  sentAt!: Date;
}
