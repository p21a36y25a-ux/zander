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
    const email = 'admin@liana.local';
    const existing = await this.usersRepository.findOne({ where: { email } });

    if (!existing) {
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      const admin = this.usersRepository.create({
        email,
        passwordHash,
        role: UserRole.SYSTEM_ADMIN,
        isActive: true,
      });
      await this.usersRepository.save(admin);
    }
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }
}
