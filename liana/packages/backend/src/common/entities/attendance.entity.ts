import { AttendanceStatus } from '@liana/shared';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EmployeeEntity } from './employee.entity';

@Entity('attendance')
export class AttendanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  employeeId!: string;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.attendances, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employeeId' })
  employee!: EmployeeEntity;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'datetime', nullable: true })
  checkInAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  checkOutAt?: Date;

  @Column({ type: 'int', default: 0 })
  workedMinutes!: number;

  @Column({ type: 'int', default: 0 })
  lateMinutes!: number;

  @Column({ type: 'int', default: 0 })
  earlyDepartureMinutes!: number;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.ABSENT,
  })
  status!: AttendanceStatus;

  @Column({ nullable: true })
  leaveRequestId?: string;
}
