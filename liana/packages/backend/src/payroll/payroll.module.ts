import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AttendanceEntity,
  EmployeeEntity,
  PayrollPeriodEntity,
  PayrollRecordEntity,
} from '../common/entities';
import { PayrollController } from './payroll.controller';
import { PayrollService } from './payroll.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayrollPeriodEntity,
      PayrollRecordEntity,
      AttendanceEntity,
      EmployeeEntity,
    ]),
  ],
  controllers: [PayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}
