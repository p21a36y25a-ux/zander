import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeEntity, LeaveRequestEntity, LeaveTypeEntity } from '../common/entities';
import { EmployeesModule } from '../employees/employees.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LeavesController } from './leaves.controller';
import { LeavesService } from './leaves.service';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveRequestEntity, EmployeeEntity, LeaveTypeEntity]), EmployeesModule, NotificationsModule],
  controllers: [LeavesController],
  providers: [LeavesService],
})
export class LeavesModule {}
