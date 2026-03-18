import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
}
