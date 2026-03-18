import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PayrollRecordEntity } from './payroll-record.entity';

export enum PayrollPeriodStatus {
  DRAFT = 'draft',
  PROCESSED = 'processed',
  PAID = 'paid',
}

@Entity('payroll_periods')
export class PayrollPeriodEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date' })
  endDate!: string;

  @Column({
    type: 'enum',
    enum: PayrollPeriodStatus,
    default: PayrollPeriodStatus.DRAFT,
  })
  status!: PayrollPeriodStatus;

  @OneToMany(() => PayrollRecordEntity, (record) => record.payrollPeriod)
  records?: PayrollRecordEntity[];
}
