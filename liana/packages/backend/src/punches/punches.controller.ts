import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@liana/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePunchDto } from './dto/create-punch.dto';
import { PunchesService } from './punches.service';

@Controller('punches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PunchesController {
  constructor(private readonly punchesService: PunchesService) {}

  @Post()
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  create(@Body() dto: CreatePunchDto) {
    return this.punchesService.create(dto);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  list(@Query('employeeId') employeeId?: string) {
    return this.punchesService.list(employeeId);
  }
}
