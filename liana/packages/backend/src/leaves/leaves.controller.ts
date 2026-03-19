import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@liana/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { UploadSignedLeaveDocumentDto } from './dto/upload-signed-leave-document.dto';
import { LeavesService } from './leaves.service';
import { EmployeesService } from '../employees/employees.service';

@Controller('leaves')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeavesController {
  constructor(
    private readonly leavesService: LeavesService,
    private readonly employeesService: EmployeesService,
  ) {}

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

  @Get('requests/me')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  async listMine(@Req() req: { user: { id: string } }) {
    const employee = await this.employeesService.findByUserId(req.user.id);
    if (!employee) {
      return [];
    }

    return this.leavesService.listMine(employee.id);
  }

  @Get('types')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  listTypes() {
    return this.leavesService.listTypes();
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

  @Post('requests/:id/signed-document')
  @Roles(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  uploadSignedDocument(
    @Param('id') id: string,
    @Body() dto: UploadSignedLeaveDocumentDto,
    @Req() req: { user: { id: string; role: UserRole } },
  ) {
    return this.leavesService.uploadSignedDocument(id, dto, req.user.id, req.user.role);
  }

  @Get('requests/:id/signed-document')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  getSignedDocument(
    @Param('id') id: string,
    @Req() req: { user: { id: string; role: UserRole } },
  ) {
    return this.leavesService.getSignedDocument(id, req.user.id, req.user.role);
  }
}
