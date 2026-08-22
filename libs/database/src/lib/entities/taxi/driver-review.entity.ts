import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CustomerEntity } from '../customer.entity';
import { DriverEntity } from './driver.entity';
import { TaxiOrderEntity } from './taxi-order.entity';

@Entity('driver_review')
export class DriverReviewEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('tinyint')
  score!: number;

  @Column({ name: 'review', nullable: true })
  description?: string;

  @ManyToOne(() => DriverEntity, (driver) => driver.reviewsForDriver)
  driver!: DriverEntity;

  @Column()
  driverId!: number;

  @ManyToOne(() => CustomerEntity, (customer) => customer.reviewsByCustomer)
  customer!: CustomerEntity;

  @Column()
  customerId!: number;

  @CreateDateColumn({ nullable: true })
  reviewTimestamp!: Date;

  @OneToOne(() => TaxiOrderEntity, (order) => order.customerReviewForDriver)
  @JoinColumn()
  request?: TaxiOrderEntity;

  @Column()
  orderId!: number;
}
