import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@liana/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePunchDto } from './dto/create-punch.dto';
import { UpdatePunchPhotoDto } from './dto/update-punch-photo.dto';
import { PunchesService } from './punches.service';

@Controller('punches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PunchesController {
  constructor(private readonly punchesService: PunchesService) {}

  @Get('history')
  @Roles(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  history(@Query('employeeId') employeeId: string) {
    return this.punchesService.history(employeeId);
  }

  @Patch(':id/photo')
  @Roles(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  updatePhoto(@Param('id') id: string, @Body() dto: UpdatePunchPhotoDto) {
    return this.punchesService.updatePhoto(id, dto.photoBase64);
  }

  @Delete(':id/photo')
  @Roles(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  removePhoto(@Param('id') id: string) {
    return this.punchesService.removePhoto(id);
  }

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
