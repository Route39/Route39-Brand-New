import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { AuthMethodType } from './enums/auth-method-type.enum';
import { UserType } from './enums/user-type.enum';

@Entity('auth_method')
@Unique(['userType', 'userId', 'type'])
@Index(['userType', 'userId'])
@Index(['type', 'identifier'])
export class AuthMethodEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('enum', { enum: UserType })
  userType!: UserType;

  @Column()
  userId!: number;

  @Column('enum', { enum: AuthMethodType })
  type!: AuthMethodType;

  @Column()
  identifier!: string; // phone number, email, or OAuth subject ID

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ default: false })
  isPrimary!: boolean;

  @Column({ nullable: true })
  externalProviderId?: string; // OAuth provider user ID (sub claim)

  @Column('json', { nullable: true })
  metadata?: Record<string, unknown>; // Additional provider data

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  verifiedAt?: Date;

  @Column({ nullable: true })
  lastUsedAt?: Date;
}
