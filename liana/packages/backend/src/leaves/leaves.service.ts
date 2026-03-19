import { LeaveRequestStatus, LeaveTypeCode } from '@liana/shared';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '@liana/shared';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { EmployeeEntity, LeaveRequestEntity, LeaveTypeEntity } from '../common/entities';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { UploadSignedLeaveDocumentDto } from './dto/upload-signed-leave-document.dto';

@Injectable()
export class LeavesService {
  private readonly signedDocumentsDir = join(process.cwd(), 'storage', 'leave-documents');

  constructor(
    @InjectRepository(LeaveRequestEntity)
    private readonly leaveRepository: Repository<LeaveRequestEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(LeaveTypeEntity)
    private readonly leaveTypeRepository: Repository<LeaveTypeEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async normalizeLeaveBalance(employee: EmployeeEntity) {
    const currentYear = new Date().getFullYear();
    if (employee.leaveBalanceYear !== currentYear) {
      employee.leaveBalanceYear = currentYear;
      employee.annualLeaveRemaining = employee.annualLeaveEntitlement;
      await this.employeeRepository.save(employee);
    }

    return employee;
  }

  private async ensureDefaultLeaveTypes() {
    const existing = await this.leaveTypeRepository.count();
    if (existing > 0) {
      return;
    }

    const defaults = this.leaveTypeRepository.create([
      {
        code: LeaveTypeCode.VACATION,
        name: 'Pushim vjetor',
        paid: true,
      },
      {
        code: LeaveTypeCode.SICK,
        name: 'Pushim mjekesor',
        paid: true,
      },
      {
        code: LeaveTypeCode.PERSONAL,
        name: 'Pushim pa pagese',
        paid: false,
      },
    ]);

    await this.leaveTypeRepository.save(defaults);
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private getSignedDocumentPath(requestId: string) {
    return join(this.signedDocumentsDir, `${requestId}.json`);
  }

  private async hasSignedDocument(requestId: string) {
    try {
      await fs.access(this.getSignedDocumentPath(requestId));
      return true;
    } catch {
      return false;
    }
  }

  private async appendSignedDocumentAvailability<T extends { id: string }>(items: T[]) {
    const enriched = await Promise.all(
      items.map(async (entry) => ({
        ...entry,
        signedDocumentAvailable: await this.hasSignedDocument(entry.id),
      })),
    );

    return enriched;
  }

  private async findRequestWithEmployeeUser(requestId: string) {
    return this.leaveRepository.findOne({
      where: { id: requestId },
      relations: ['employee', 'employee.user', 'leaveType'],
    });
  }

  async create(dto: CreateLeaveRequestDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const totalDays = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);

    const request = this.leaveRepository.create({
      ...dto,
      totalDays,
      status: LeaveRequestStatus.PENDING,
    });

    const saved = await this.leaveRepository.save(request);

    const employee = await this.employeeRepository.findOne({
      where: { id: saved.employeeId },
      relations: ['user'],
    });

    await this.notificationsService.createRoleNotification(
      UserRole.SYSTEM_ADMIN,
      'Kerkese e re per pushim',
      `Nje kerkese e re per pushim nga ${employee?.firstName ?? 'punonjesi'} ${employee?.lastName ?? ''}`.trim(),
      '/dashboard/leaves/requests',
    );

    if (employee?.user?.id) {
      await this.notificationsService.createInApp(
        employee.user.id,
        'Kerkesa per pushim u dergua',
        'Kerkesa juaj per pushim u regjistrua dhe po pret shqyrtim.',
        '/dashboard/leaves',
      );
    }

    return saved;
  }

  async list() {
    const rows = await this.leaveRepository.find({
      relations: ['employee', 'leaveType'],
      order: { requestedAt: 'DESC' },
    });
    return this.appendSignedDocumentAvailability(rows);
  }

  async listMine(employeeId: string) {
    const rows = await this.leaveRepository.find({
      where: { employeeId },
      relations: ['employee', 'leaveType'],
      order: { requestedAt: 'DESC' },
    });
    return this.appendSignedDocumentAvailability(rows);
  }

  async listTypes() {
    await this.ensureDefaultLeaveTypes();
    return this.leaveTypeRepository.find({ order: { name: 'ASC' } });
  }

  async review(id: string, dto: ReviewLeaveRequestDto, reviewerRole: 'manager' | 'hr') {
    const request = await this.leaveRepository.findOne({ where: { id }, relations: ['leaveType', 'employee', 'employee.user'] });
    if (!request) {
      return null;
    }

    const previousStatus = request.status;
    request.status = dto.status;
    if (reviewerRole === 'manager') {
      request.managerComment = dto.comment;
    } else {
      request.hrComment = dto.comment;
    }

    if (previousStatus !== LeaveRequestStatus.APPROVED && dto.status === LeaveRequestStatus.APPROVED) {
      const employee = await this.employeeRepository.findOne({ where: { id: request.employeeId } });
      if (employee) {
        await this.normalizeLeaveBalance(employee);
        employee.annualLeaveRemaining = Math.max(0, employee.annualLeaveRemaining - request.totalDays);
        await this.employeeRepository.save(employee);
      }
    }

    const saved = await this.leaveRepository.save(request);

    const employeeUserId = saved.employee?.user?.id;
    if (employeeUserId) {
      await this.notificationsService.createInApp(
        employeeUserId,
        'Perditesim i kerkeses per pushim',
        dto.status === LeaveRequestStatus.APPROVED
          ? 'Kerkesa juaj per pushim u aprovua.'
          : 'Kerkesa juaj per pushim u refuzua.',
        '/dashboard/leaves',
      );
    }

    return saved;
  }

  async uploadSignedDocument(requestId: string, dto: UploadSignedLeaveDocumentDto, actorUserId: string, actorRole: UserRole) {
    if (actorRole !== UserRole.MANAGER && actorRole !== UserRole.HR_ADMIN && actorRole !== UserRole.SYSTEM_ADMIN) {
      return null;
    }

    const request = await this.findRequestWithEmployeeUser(requestId);
    if (!request) {
      return null;
    }

    await fs.mkdir(this.signedDocumentsDir, { recursive: true });
    const payload = {
      requestId,
      uploadedBy: actorUserId,
      uploadedAt: new Date().toISOString(),
      fileName: this.sanitizeFileName(dto.fileName || `dokumenti-${requestId}.pdf`),
      mimeType: dto.mimeType || 'application/pdf',
      base64Data: dto.base64Data,
      note: dto.note ?? '',
    };

    await fs.writeFile(this.getSignedDocumentPath(requestId), JSON.stringify(payload), 'utf-8');

    const employeeUserId = request.employee?.user?.id;
    if (employeeUserId) {
      await this.notificationsService.createInApp(
        employeeUserId,
        'Dokumenti i pushimit u ngarkua',
        'Administrata ngarkoi dokumentin e nenshkruar per kerkesen tuaj te pushimit.',
        '/dashboard/leaves',
      );
    }

    return { success: true };
  }

  async getSignedDocument(requestId: string, actorUserId: string, actorRole: UserRole) {
    const request = await this.findRequestWithEmployeeUser(requestId);
    if (!request) {
      return null;
    }

    if (actorRole === UserRole.EMPLOYEE) {
      const ownerUserId = request.employee?.user?.id;
      if (!ownerUserId || ownerUserId !== actorUserId) {
        return null;
      }
    }

    const raw = await fs.readFile(this.getSignedDocumentPath(requestId), 'utf-8').catch(() => null);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as {
      fileName: string;
      mimeType: string;
      base64Data: string;
      uploadedAt: string;
      note?: string;
    };

    return {
      fileName: parsed.fileName,
      mimeType: parsed.mimeType,
      base64Data: parsed.base64Data,
      uploadedAt: parsed.uploadedAt,
      note: parsed.note ?? '',
    };
  }
}
