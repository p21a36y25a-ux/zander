import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '@liana/shared';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { EmployeeEntity, UserEntity } from '../common/entities';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepository: Repository<EmployeeEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  private async normalizeLeaveBalance(employee: EmployeeEntity) {
    const currentYear = new Date().getFullYear();
    if (employee.leaveBalanceYear !== currentYear) {
      employee.leaveBalanceYear = currentYear;
      employee.annualLeaveRemaining = employee.annualLeaveEntitlement;
      await this.employeesRepository.save(employee);
    }

    return employee;
  }

  async list() {
    const employees = await this.employeesRepository.find({
      relations: ['department', 'user'],
      order: { firstName: 'ASC' },
    });

    return Promise.all(employees.map((employee) => this.normalizeLeaveBalance(employee)));
  }

  async findById(id: string) {
    const employee = await this.employeesRepository.findOne({
      where: { id },
      relations: ['department', 'user'],
    });

    if (!employee) {
      return null;
    }

    return this.normalizeLeaveBalance(employee);
  }

  async findByUserId(userId: string) {
    const employee = await this.employeesRepository.findOne({
      where: { userId },
      relations: ['department', 'user'],
    });

    if (!employee) {
      return null;
    }

    return this.normalizeLeaveBalance(employee);
  }

  async create(dto: CreateEmployeeDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email,
      passwordHash,
      role: dto.role ?? UserRole.EMPLOYEE,
      isActive: true,
    });
    let savedUser: typeof user & { id: string };
    try {
      savedUser = await this.usersRepository.save(user) as typeof user & { id: string };
    } catch (err: unknown) {
      const mysqlErr = err as { code?: string };
      if (mysqlErr.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Ky email është tashmë i regjistruar.');
      }
      throw err;
    }

    const employee = this.employeesRepository.create({
      employeeNumber: dto.employeeNumber,
      firstName: dto.firstName,
      lastName: dto.lastName,
      hourlyRateEur: dto.hourlyRateEur.toFixed(2),
      hireDate: dto.hireDate,
      departmentId: dto.departmentId,
      userId: savedUser.id,
      active: true,
      birthDate: dto.birthDate,
      country: dto.country,
      personalId: dto.personalId,
      address: dto.address,
      municipality: dto.municipality,
      tel: dto.tel,
      maritalStatus: dto.maritalStatus,
      education: dto.education,
      position: dto.position,
      emergencyContact: dto.emergencyContact,
      familyConnection: dto.familyConnection,
      branchName: dto.branchName ?? 'Prishtina',
      annualLeaveEntitlement: dto.annualLeaveEntitlement ?? 20,
      annualLeaveRemaining: dto.annualLeaveEntitlement ?? 20,
      leaveBalanceYear: new Date().getFullYear(),
    });

    try {
      return await this.employeesRepository.save(employee);
    } catch (err: unknown) {
      await this.usersRepository.delete(savedUser.id).catch(() => undefined);
      const mysqlErr = err as { code?: string };
      if (mysqlErr.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Numri i punonjësit është tashmë i regjistruar.');
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const employee = await this.findById(id);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (dto.firstName !== undefined) employee.firstName = dto.firstName;
    if (dto.lastName !== undefined) employee.lastName = dto.lastName;
    if (dto.employeeNumber !== undefined) employee.employeeNumber = dto.employeeNumber;
    if (dto.hireDate !== undefined) employee.hireDate = dto.hireDate;
    if (dto.hourlyRateEur !== undefined) employee.hourlyRateEur = dto.hourlyRateEur.toFixed(2);
    if (dto.departmentId !== undefined) employee.departmentId = dto.departmentId;
    if (dto.birthDate !== undefined) employee.birthDate = dto.birthDate;
    if (dto.country !== undefined) employee.country = dto.country;
    if (dto.personalId !== undefined) employee.personalId = dto.personalId;
    if (dto.address !== undefined) employee.address = dto.address;
    if (dto.municipality !== undefined) employee.municipality = dto.municipality;
    if (dto.tel !== undefined) employee.tel = dto.tel;
    if (dto.maritalStatus !== undefined) employee.maritalStatus = dto.maritalStatus;
    if (dto.education !== undefined) employee.education = dto.education;
    if (dto.position !== undefined) employee.position = dto.position;
    if (dto.emergencyContact !== undefined) employee.emergencyContact = dto.emergencyContact;
    if (dto.familyConnection !== undefined) employee.familyConnection = dto.familyConnection;
    if (dto.branchName !== undefined) employee.branchName = dto.branchName;
    if (dto.annualLeaveEntitlement !== undefined) employee.annualLeaveEntitlement = dto.annualLeaveEntitlement;
    if (dto.annualLeaveRemaining !== undefined) employee.annualLeaveRemaining = dto.annualLeaveRemaining;
    employee.leaveBalanceYear = new Date().getFullYear();

    if (dto.email !== undefined && employee.user) {
      employee.user.email = dto.email;
      await this.usersRepository.save(employee.user);
    }

    if (dto.role !== undefined && employee.user) {
      employee.user.role = dto.role;
      await this.usersRepository.save(employee.user);
    }

    try {
      return await this.employeesRepository.save(employee);
    } catch (err: unknown) {
      const mysqlErr = err as { code?: string };
      if (mysqlErr.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Numri i punonjësit është tashmë i regjistruar.');
      }
      throw err;
    }
  }

  async remove(id: string) {
    const employee = await this.findById(id);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    await this.employeesRepository.remove(employee);
    return { success: true };
  }
}
