import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@liana/shared';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  listMine(@Req() req: { user: { id: string; role: UserRole } }) {
    return this.notificationsService.listForUser(req.user.id, req.user.role);
  }

  @Patch(':id/read')
  @Roles(UserRole.EMPLOYEE, UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SYSTEM_ADMIN)
  markAsRead(@Param('id') id: string, @Req() req: { user: { id: string; role: UserRole } }) {
    return this.notificationsService.markAsRead(id, req.user.id, req.user.role);
  }
}
