import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DepartmentEntity } from './department.entity';
import { UserEntity } from './user.entity';
import { PunchEntity } from './punch.entity';
import { AttendanceEntity } from './attendance.entity';
import { LeaveRequestEntity } from './leave-request.entity';
import { PayrollRecordEntity } from './payroll-record.entity';

@Entity('employees')
export class EmployeeEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'employee_number', unique: true })
  employeeNumber!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hourlyRateEur!: string;

  @Column({ type: 'date' })
  hireDate!: string;

  @Column({ default: true })
  active!: boolean;

  @Column()
  userId!: string;

  @OneToOne(() => UserEntity, (user) => user.employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ nullable: true })
  birthDate?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  personalId?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  municipality?: string;

  @Column({ nullable: true })
  tel?: string;

  @Column({ nullable: true })
  maritalStatus?: string;

  @Column({ nullable: true })
  education?: string;

  @Column({ nullable: true })
  position?: string;

  @Column({ nullable: true })
  emergencyContact?: string;

  @Column({ nullable: true })
  familyConnection?: string;

  @Column({ nullable: true, default: 'Prishtina' })
  branchName?: string;

  @Column({ type: 'int', default: 20 })
  annualLeaveEntitlement!: number;

  @Column({ type: 'int', default: 20 })
  annualLeaveRemaining!: number;

  @Column({ type: 'int', default: 2026 })
  leaveBalanceYear!: number;

  @Column({ nullable: true })
  departmentId?: string;

  @ManyToOne(() => DepartmentEntity, (department) => department.employees, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'departmentId' })
  department?: DepartmentEntity;

  @OneToMany(() => PunchEntity, (punch) => punch.employee)
  punches?: PunchEntity[];

  @OneToMany(() => AttendanceEntity, (attendance) => attendance.employee)
  attendances?: AttendanceEntity[];

  @OneToMany(() => LeaveRequestEntity, (leave) => leave.employee)
  leaves?: LeaveRequestEntity[];

  @OneToMany(() => PayrollRecordEntity, (payroll) => payroll.employee)
  payrolls?: PayrollRecordEntity[];
}
