import { LeaveRequestStatus } from '@liana/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaveRequestEntity } from '../common/entities';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';

@Injectable()
export class LeavesService {
  constructor(
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRepository: Repository<LeaveRequestEntity>,
  ) {}

  async create(dto: CreateLeaveRequestDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);

    const request = this.leaveRepository.create({
      ...dto,
      totalDays,
      status: LeaveRequestStatus.PENDING,
    });

    return this.leaveRepository.save(request);
  }

  list() {
    return this.leaveRepository.find({
      relations: ['employee', 'leaveType'],
      order: { requestedAt: 'DESC' },
    });
  }

  async review(id: string, dto: ReviewLeaveRequestDto, reviewerRole: 'manager' | 'hr') {
    const request = await this.leaveRepository.findOne({ where: { id } });
    if (!request) {
      return null;
    }

    request.status = dto.status;
    if (reviewerRole === 'manager') {
      request.managerComment = dto.comment;
    } else {
      request.hrComment = dto.comment;
    }

    return this.leaveRepository.save(request);
  }
}
