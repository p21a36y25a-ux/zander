import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EmployeeEntity } from './employee.entity';
import { PayrollPeriodEntity } from './payroll-period.entity';

@Entity('payroll_records')
export class PayrollRecordEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  payrollPeriodId!: string;

  @ManyToOne(() => PayrollPeriodEntity, (period) => period.records, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payrollPeriodId' })
  payrollPeriod!: PayrollPeriodEntity;

  @Column()
  employeeId!: string;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.payrolls, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employeeId' })
  employee!: EmployeeEntity;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hourlyRateEur!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalHours!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  regularHours!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  overtimeHours!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  premiumHours!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  grossAmount!: string;

  @Column({ default: 'EUR' })
  currency!: string;

  @Column({ type: 'datetime' })
  calculatedAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  paidAt?: Date;
}
