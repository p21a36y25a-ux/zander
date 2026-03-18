import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@liana/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { LeavesService } from './leaves.service';

@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post('requests')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  create(@Body() dto: CreateLeaveRequestDto) {
    return this.leavesService.create(dto);
  }

  @Get('requests')
  @Roles(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  list() {
    return this.leavesService.list();
  }

  @Patch('requests/:id/manager-review')
  @Roles(UserRole.MANAGER, UserRole.SYSTEM_ADMIN)
  managerReview(@Param('id') id: string, @Body() dto: ReviewLeaveRequestDto) {
    return this.leavesService.review(id, dto, 'manager');
  }

  @Patch('requests/:id/hr-review')
  @Roles(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  hrReview(@Param('id') id: string, @Body() dto: ReviewLeaveRequestDto) {
    return this.leavesService.review(id, dto, 'hr');
  }
}
