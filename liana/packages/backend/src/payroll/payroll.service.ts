import { PayrollBreakdown, PayrollKosovoDefaults } from '@liana/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  AttendanceEntity,
  EmployeeEntity,
  PayrollPeriodEntity,
  PayrollPeriodStatus,
  PayrollRecordEntity,
} from '../common/entities';

@Injectable()
export class PayrollService {
  constructor(
    @InjectRepository(PayrollPeriodEntity)
    private readonly periodRepository: Repository<PayrollPeriodEntity>,
    @InjectRepository(PayrollRecordEntity)
    private readonly recordRepository: Repository<PayrollRecordEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeesRepository: Repository<EmployeeEntity>,
  ) {}

  calculateKosovoPayroll(totalHours: number, hourlyRateEur: number): PayrollBreakdown {
    const regularHours = Math.min(totalHours, PayrollKosovoDefaults.baseMonthlyHours);
    const overtimeHours = Math.max(
      0,
      Math.min(totalHours, PayrollKosovoDefaults.overtimeUpperThreshold) -
        PayrollKosovoDefaults.overtimeThreshold,
    );
    const premiumHours = Math.max(0, totalHours - PayrollKosovoDefaults.overtimeUpperThreshold);

    const regularAmount = regularHours * hourlyRateEur * PayrollKosovoDefaults.baseMultiplier;
    const overtimeAmount = overtimeHours * hourlyRateEur * PayrollKosovoDefaults.overtimeMultiplier;
    const premiumAmount = premiumHours * hourlyRateEur * PayrollKosovoDefaults.premiumMultiplier;

    return {
      regularHours,
      overtimeHours,
      premiumHours,
      regularAmount,
      overtimeAmount,
      premiumAmount,
      grossAmount: regularAmount + overtimeAmount + premiumAmount,
      currency: 'EUR',
    };
  }

  async processPeriod(periodId: string) {
    const period = await this.periodRepository.findOne({ where: { id: periodId } });
    if (!period) {
      return null;
    }

    const employees = await this.employeesRepository.find({ where: { active: true } });
    const createdRecords: PayrollRecordEntity[] = [];

    for (const employee of employees) {
      const attendances = await this.attendanceRepository.find({
        where: {
          employeeId: employee.id,
          date: Between(period.startDate, period.endDate),
        },
      });

      const workedMinutes = attendances.reduce((sum, row) => sum + row.workedMinutes, 0);
      const totalHours = Math.round((workedMinutes / 60) * 100) / 100;
      const hourlyRateEur = Number(employee.hourlyRateEur);

      const breakdown = this.calculateKosovoPayroll(totalHours, hourlyRateEur);

      const record = this.recordRepository.create({
        payrollPeriodId: period.id,
        employeeId: employee.id,
        hourlyRateEur: hourlyRateEur.toFixed(2),
        totalHours: totalHours.toFixed(2),
        regularHours: breakdown.regularHours.toFixed(2),
        overtimeHours: breakdown.overtimeHours.toFixed(2),
        premiumHours: breakdown.premiumHours.toFixed(2),
        grossAmount: breakdown.grossAmount.toFixed(2),
        currency: breakdown.currency,
        calculatedAt: new Date(),
      });

      createdRecords.push(await this.recordRepository.save(record));
    }

    period.status = PayrollPeriodStatus.PROCESSED;
    await this.periodRepository.save(period);

    return {
      period,
      records: createdRecords,
    };
  }

  listRecords(periodId?: string) {
    if (periodId) {
      return this.recordRepository.find({ where: { payrollPeriodId: periodId }, relations: ['employee'] });
    }

    return this.recordRepository.find({ relations: ['employee', 'payrollPeriod'] });
  }
}
