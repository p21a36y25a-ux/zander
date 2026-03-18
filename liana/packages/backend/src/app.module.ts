import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
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
} from './common/entities';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PunchesModule } from './punches/punches.module';
import { LeavesModule } from './leaves/leaves.module';
import { PayrollModule } from './payroll/payroll.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USER', 'root'),
        password: configService.get<string>('DB_PASSWORD', 'root'),
        database: configService.get<string>('DB_NAME', 'liana_hr'),
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
        synchronize: configService.get<string>('DB_SYNC', 'false') === 'true',
        logging: false,
      }),
    }),
    UsersModule,
    AuthModule,
    EmployeesModule,
    AttendanceModule,
    PunchesModule,
    LeavesModule,
    PayrollModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
