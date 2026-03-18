import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PunchEventPayload } from '@liana/shared';
import { Repository } from 'typeorm';
import { AttendanceService } from '../attendance/attendance.service';
import { PunchEntity } from '../common/entities';
import { CreatePunchDto } from './dto/create-punch.dto';
import { PunchEventsGateway } from './punch-events.gateway';

@Injectable()
export class PunchesService {
  constructor(
    @InjectRepository(PunchEntity)
    private readonly punchesRepository: Repository<PunchEntity>,
    private readonly attendanceService: AttendanceService,
    private readonly gateway: PunchEventsGateway,
  ) {}

  async create(dto: CreatePunchDto) {
    const punch = this.punchesRepository.create({
      employeeId: dto.employeeId,
      type: dto.type,
      punchedAt: new Date(),
      photoUrl: dto.photoUrl,
      latitude: dto.latitude?.toString(),
      longitude: dto.longitude?.toString(),
      photoBlob: dto.photoBase64 ? Buffer.from(dto.photoBase64, 'base64') : undefined,
      source: 'web',
    });

    const saved = await this.punchesRepository.save(punch);
    await this.attendanceService.updateFromPunch(saved.employeeId, saved.punchedAt, saved.type);

    const payload: PunchEventPayload = {
      employeeId: saved.employeeId,
      type: saved.type,
      punchedAt: saved.punchedAt.toISOString(),
      photoUrl: saved.photoUrl ?? null,
    };
    this.gateway.emitPunchEvent(payload);

    return saved;
  }

  list(employeeId?: string) {
    if (employeeId) {
      return this.punchesRepository.find({ where: { employeeId }, order: { punchedAt: 'DESC' } });
    }

    return this.punchesRepository.find({ order: { punchedAt: 'DESC' }, take: 3000 });
  }
}
