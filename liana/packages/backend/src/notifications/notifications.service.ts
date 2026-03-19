import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '@liana/shared';
import { Repository } from 'typeorm';
import { NotificationLogEntity } from '../common/entities';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationLogEntity)
    private readonly logsRepository: Repository<NotificationLogEntity>,
  ) {}

  async sendEmail(recipient: string, subject: string, body: string) {
    this.logger.log(`Email queued to ${recipient}: ${subject}`);

    const log = this.logsRepository.create({
      channel: 'email',
      recipient,
      subject,
      body,
      status: 'queued',
    });

    await this.logsRepository.save(log);
    return log;
  }

  async createInApp(recipient: string, subject: string, body: string, actionPath?: string) {
    const log = this.logsRepository.create({
      channel: 'in_app',
      recipient,
      subject,
      body,
      actionPath,
      status: 'unread',
    });

    await this.logsRepository.save(log);
    return log;
  }

  createRoleNotification(role: UserRole, subject: string, body: string, actionPath?: string) {
    return this.createInApp(`role:${role}`, subject, body, actionPath);
  }

  async listForUser(userId: string, role: UserRole) {
    return this.logsRepository
      .createQueryBuilder('notification')
      .where('notification.channel = :channel', { channel: 'in_app' })
      .andWhere('notification.recipient IN (:...recipients)', {
        recipients: [userId, `role:${role}`],
      })
      .orderBy('notification.createdAt', 'DESC')
      .take(100)
      .getMany();
  }

  async markAsRead(id: string, userId: string, role: UserRole) {
    const entry = await this.logsRepository
      .createQueryBuilder('notification')
      .where('notification.id = :id', { id })
      .andWhere('notification.channel = :channel', { channel: 'in_app' })
      .andWhere('notification.recipient IN (:...recipients)', {
        recipients: [userId, `role:${role}`],
      })
      .getOne();

    if (!entry) {
      return null;
    }

    entry.status = 'read';
    return this.logsRepository.save(entry);
  }
}
