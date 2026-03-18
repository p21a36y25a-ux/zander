import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@liana/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { PayrollService } from './payroll.service';

@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('periods/:id/process')
  @Roles(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  process(@Param('id') id: string) {
    return this.payrollService.processPeriod(id);
  }

  @Post('calculate-preview')
  @Roles(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  preview(@Body() payload: { totalHours: number; hourlyRateEur: number }) {
    return this.payrollService.calculateKosovoPayroll(payload.totalHours, payload.hourlyRateEur);
  }

  @Get('records')
  @Roles(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN, UserRole.MANAGER)
  records(@Query('periodId') periodId?: string) {
    return this.payrollService.listRecords(periodId);
  }
}
