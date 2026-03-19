import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@liana/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('me')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  me(@Req() req: { user: { id: string } }) {
    return this.employeesService.findByUserId(req.user.id);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  list() {
    return this.employeesService.list();
  }

  @Get(':id')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  findById(@Param('id') id: string) {
    return this.employeesService.findById(id);
  }

  @Post()
  @Roles(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  create(@Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.employeesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SYSTEM_ADMIN)
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
