import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceModule } from '../attendance/attendance.module';
import { EmployeeEntity, PunchEntity } from '../common/entities';
import { PunchEventsGateway } from './punch-events.gateway';
import { PunchesController } from './punches.controller';
import { PunchesService } from './punches.service';

@Module({
  imports: [TypeOrmModule.forFeature([PunchEntity, EmployeeEntity]), AttendanceModule],
  providers: [PunchesService, PunchEventsGateway],
  controllers: [PunchesController],
  exports: [PunchEventsGateway, PunchesService],
})
export class PunchesModule {}
