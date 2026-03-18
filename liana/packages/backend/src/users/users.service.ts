import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '@liana/shared';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserEntity } from '../common/entities';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async onModuleInit() {
    await this.ensureSeedUser('admin@liana.local', 'Admin123!', UserRole.SYSTEM_ADMIN);
    await this.ensureSeedUser('hr@liana.local', 'HrAdmin123!', UserRole.HR_ADMIN);
    await this.ensureSeedUser('user@liana.local', 'User12345!', UserRole.EMPLOYEE);
  }

  private async ensureSeedUser(email: string, password: string, role: UserRole) {
    const existing = await this.usersRepository.findOne({ where: { email } });
    if (existing) {
      if (existing.role !== role || !existing.isActive) {
        existing.role = role;
        existing.isActive = true;
        await this.usersRepository.save(existing);
      }
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      passwordHash,
      role,
      isActive: true,
    });
    await this.usersRepository.save(user);
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  list() {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }
}
