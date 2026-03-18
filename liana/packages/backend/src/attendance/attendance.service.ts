import { AttendanceStatus } from '@liana/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceEntity, PunchType } from '../common/entities';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
  ) {}

  async updateFromPunch(employeeId: string, punchedAt: Date, type: PunchType) {
    const date = punchedAt.toISOString().slice(0, 10);
    let attendance = await this.attendanceRepository.findOne({ where: { employeeId, date } });

    if (!attendance) {
      attendance = this.attendanceRepository.create({
        employeeId,
        date,
        status: AttendanceStatus.ABSENT,
      });
    }

    if (type === PunchType.CHECK_IN) {
      attendance.checkInAt = punchedAt;
      attendance.status = AttendanceStatus.PRESENT;

      const threshold = new Date(`${date}T08:00:00.000Z`);
      const lateMinutes = Math.max(0, Math.floor((punchedAt.getTime() - threshold.getTime()) / 60000));
      attendance.lateMinutes = lateMinutes;
      if (lateMinutes > 0) {
        attendance.status = AttendanceStatus.LATE;
      }
    }

    if (type === PunchType.CHECK_OUT) {
      attendance.checkOutAt = punchedAt;
      if (attendance.checkInAt) {
        const worked = Math.max(0, Math.floor((punchedAt.getTime() - attendance.checkInAt.getTime()) / 60000));
        attendance.workedMinutes = worked;

        const expectedCheckout = new Date(`${date}T16:00:00.000Z`);
        attendance.earlyDepartureMinutes = Math.max(
          0,
          Math.floor((expectedCheckout.getTime() - punchedAt.getTime()) / 60000),
        );
      }
    }

    await this.attendanceRepository.save(attendance);
    return attendance;
  }

  list(employeeId?: string) {
    if (employeeId) {
      return this.attendanceRepository.find({ where: { employeeId }, order: { date: 'DESC' } });
    }

    return this.attendanceRepository.find({ order: { date: 'DESC' }, take: 1500 });
  }

  async exportCsv(employeeId?: string) {
    const rows = await this.list(employeeId);
    const header = [
      'id',
      'employeeId',
      'date',
      'status',
      'workedMinutes',
      'lateMinutes',
      'earlyDepartureMinutes',
      'checkInAt',
      'checkOutAt',
    ];

    const body = rows.map((row) =>
      [
        row.id,
        row.employeeId,
        row.date,
        row.status,
        row.workedMinutes,
        row.lateMinutes,
        row.earlyDepartureMinutes,
        row.checkInAt ? row.checkInAt.toISOString() : '',
        row.checkOutAt ? row.checkOutAt.toISOString() : '',
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(','),
    );

    return [header.join(','), ...body].join('\n');
  }
}
