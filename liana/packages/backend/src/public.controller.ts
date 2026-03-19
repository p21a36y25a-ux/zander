import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeEntity, PunchType } from './common/entities';
import { PunchesService } from './punches/punches.service';

@Controller('public')
export class PublicController {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepository: Repository<EmployeeEntity>,
    private readonly punchesService: PunchesService,
  ) {}

  @Get('employees')
  listEmployees() {
    return this.employeesRepository.find({
      where: { active: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      order: { firstName: 'ASC' },
    });
  }

  @Get('branches/:branchName/employees')
  listBranchEmployees(@Param('branchName') branchName: string) {
    return this.punchesService.listPublicEmployeesByBranch(branchName);
  }

  @Post('check-in')
  checkIn(
    @Body()
    payload: {
      employeeId: string;
      photoBase64?: string;
    },
  ) {
    return this.punchesService.createPublicAction({
      employeeId: payload.employeeId,
      action: PunchType.CHECK_IN,
      photoBase64: payload.photoBase64,
    });
  }

  @Post('work-action')
  workAction(
    @Body()
    payload: {
      employeeId: string;
      action: PunchType;
      photoBase64?: string;
    },
  ) {
    return this.punchesService.createPublicAction(payload);
  }
}
