import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PunchEventPayload } from '@liana/shared';
import { Repository } from 'typeorm';
import { AttendanceService } from '../attendance/attendance.service';
import { EmployeeEntity, PunchEntity, PunchType } from '../common/entities';
import { CreatePunchDto } from './dto/create-punch.dto';
import { PunchEventsGateway } from './punch-events.gateway';

@Injectable()
export class PunchesService {
  constructor(
    @InjectRepository(PunchEntity)
    private readonly punchesRepository: Repository<PunchEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepository: Repository<EmployeeEntity>,
    private readonly attendanceService: AttendanceService,
    private readonly gateway: PunchEventsGateway,
  ) {}

  private getTodayBounds() {
    const iso = new Date().toISOString().slice(0, 10)
    return {
      start: new Date(`${iso}T00:00:00.000Z`),
      end: new Date(`${iso}T23:59:59.999Z`),
    }
  }

  private async getLatestPunchForToday(employeeId: string) {
    const { start, end } = this.getTodayBounds()

    return this.punchesRepository
      .createQueryBuilder('punch')
      .where('punch.employeeId = :employeeId', { employeeId })
      .andWhere('punch.punchedAt BETWEEN :start AND :end', { start, end })
      .orderBy('punch.punchedAt', 'DESC')
      .getOne()
  }

  async getTodayWorkState(employeeId: string) {
    const latest = await this.getLatestPunchForToday(employeeId)
    if (!latest) {
      return 'ready_to_start' as const
    }

    if (latest.type === PunchType.CHECK_IN || latest.type === PunchType.BREAK_END) {
      return 'working' as const
    }

    if (latest.type === PunchType.BREAK_START) {
      return 'on_break' as const
    }

    return 'finished' as const
  }

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
      type: saved.type as PunchEventPayload['type'],
      punchedAt: saved.punchedAt.toISOString(),
      photoUrl: saved.photoUrl ?? null,
    };
    this.gateway.emitPunchEvent(payload);

    return saved;
  }

  async createPublicAction(payload: { employeeId: string; action: PunchType; photoBase64?: string }) {
    const state = await this.getTodayWorkState(payload.employeeId)
    const allowedActions: Record<string, PunchType[]> = {
      ready_to_start: [PunchType.CHECK_IN],
      working: [PunchType.BREAK_START, PunchType.CHECK_OUT],
      on_break: [PunchType.BREAK_END],
      finished: [PunchType.CHECK_IN],
    }

    if (!allowedActions[state].includes(payload.action)) {
      throw new BadRequestException('Veprimi nuk lejohet ne kete status te punes.')
    }

    if (payload.action === PunchType.CHECK_IN && !payload.photoBase64) {
      throw new BadRequestException('Foto eshte e detyrueshme per fillimin e punes.')
    }

    return this.create({
      employeeId: payload.employeeId,
      type: payload.action,
      photoBase64: payload.photoBase64,
    })
  }

  list(employeeId?: string) {
    if (employeeId) {
      return this.punchesRepository.find({ where: { employeeId }, order: { punchedAt: 'DESC' } });
    }

    return this.punchesRepository.find({ order: { punchedAt: 'DESC' }, take: 3000 });
  }

  async history(employeeId: string) {
    const punches = await this.punchesRepository.find({
      where: { employeeId },
      relations: ['employee'],
      order: { punchedAt: 'DESC' },
      take: 500,
    });

    return punches.map((entry) => ({
      id: entry.id,
      employeeId: entry.employeeId,
      type: entry.type,
      punchedAt: entry.punchedAt,
      source: entry.source,
      photoUrl: entry.photoUrl ?? null,
      photoDataUrl: entry.photoBlob ? `data:image/jpeg;base64,${entry.photoBlob.toString('base64')}` : null,
      employee: entry.employee
        ? {
            id: entry.employee.id,
            firstName: entry.employee.firstName,
            lastName: entry.employee.lastName,
            employeeNumber: entry.employee.employeeNumber,
          }
        : null,
    }));
  }

  async updatePhoto(id: string, photoBase64?: string) {
    const punch = await this.punchesRepository.findOne({ where: { id } });
    if (!punch) {
      throw new NotFoundException('Klikimi nuk u gjet.');
    }

    if (!photoBase64) {
      throw new BadRequestException('Foto mungon.');
    }

    punch.photoBlob = Buffer.from(photoBase64, 'base64');
    punch.photoUrl = undefined;
    return this.punchesRepository.save(punch);
  }

  async removePhoto(id: string) {
    const punch = await this.punchesRepository.findOne({ where: { id } });
    if (!punch) {
      throw new NotFoundException('Klikimi nuk u gjet.');
    }

    punch.photoBlob = undefined;
    punch.photoUrl = undefined;
    return this.punchesRepository.save(punch);
  }

  async listPublicEmployeesByBranch(branchName: string) {
    const employees = await this.employeesRepository.find({
      where: { active: true, branchName },
      order: { firstName: 'ASC' },
    })

    return Promise.all(
      employees.map(async (employee) => ({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        branchName: employee.branchName,
        workState: await this.getTodayWorkState(employee.id),
      })),
    )
  }
}
