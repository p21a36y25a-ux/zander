import { Injectable, NotFoundException } from '@nestjs/common';
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

  list() {
    return this.employeesRepository.find({
      relations: ['department', 'user'],
      order: { firstName: 'ASC' },
    });
  }

  findById(id: string) {
    return this.employeesRepository.findOne({
      where: { id },
      relations: ['department', 'user'],
    });
  }

  async create(dto: CreateEmployeeDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email,
      passwordHash,
      role: UserRole.EMPLOYEE,
      isActive: true,
    });
    const savedUser = await this.usersRepository.save(user);

    const employee = this.employeesRepository.create({
      employeeNumber: dto.employeeNumber,
      firstName: dto.firstName,
      lastName: dto.lastName,
      hourlyRateEur: dto.hourlyRateEur.toFixed(2),
      hireDate: dto.hireDate,
      departmentId: dto.departmentId,
      userId: savedUser.id,
      active: true,
    });

    return this.employeesRepository.save(employee);
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

    if (dto.email !== undefined && employee.user) {
      employee.user.email = dto.email;
      await this.usersRepository.save(employee.user);
    }

    return this.employeesRepository.save(employee);
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
