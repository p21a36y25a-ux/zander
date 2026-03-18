import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';
import {
  AttendanceEntity,
  AuditLogEntity,
  DepartmentEntity,
  EmployeeEntity,
  LeaveRequestEntity,
  LeaveTypeEntity,
  NotificationLogEntity,
  PayrollPeriodEntity,
  PayrollRecordEntity,
  PunchEntity,
  UserEntity,
} from '../common/entities';

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_NAME ?? 'liana_hr',
  entities: [
    UserEntity,
    DepartmentEntity,
    EmployeeEntity,
    PunchEntity,
    AttendanceEntity,
    LeaveTypeEntity,
    LeaveRequestEntity,
    PayrollPeriodEntity,
    PayrollRecordEntity,
    NotificationLogEntity,
    AuditLogEntity,
  ],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: false,
});
