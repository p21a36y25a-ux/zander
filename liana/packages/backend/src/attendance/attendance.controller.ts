import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@liana/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AttendanceService } from './attendance.service';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('me')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  listMine(@Req() req: { user: { id: string } }) {
    return this.attendanceService.listForUser(req.user.id);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  list(@Query('employeeId') employeeId?: string) {
    return this.attendanceService.list(employeeId);
  }

  @Get('export/csv')
  @Roles(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  async exportCsv(@Res() res: Response, @Query('employeeId') employeeId?: string) {
    const csv = await this.attendanceService.exportCsv(employeeId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
    res.send(csv);
  }
}
