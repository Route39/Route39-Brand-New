import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { AuthMethodType } from './enums/auth-method-type.enum';
import { UserType } from './enums/user-type.enum';

@Entity('auth_verification_config')
@Unique(['userType', 'authMethodType'])
export class AuthVerificationConfigEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('enum', { enum: UserType })
  userType!: UserType;

  @Column('enum', { enum: AuthMethodType })
  authMethodType!: AuthMethodType;

  @Column({ default: false })
  verificationRequired!: boolean;

  @Column({ default: false })
  allowLoginWithoutVerification!: boolean;

  @Column({ default: 6 })
  codeLength!: number;

  @Column({ default: 180 }) // 3 minutes
  codeTtlSeconds!: number;

  @Column({ default: 5 })
  maxAttempts!: number;

  @Column({ default: 300 }) // 5 minutes cooldown after max attempts
  cooldownSeconds!: number;
}
