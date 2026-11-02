import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PERMISSIONS, type AuthUser } from '@vs/shared';
import { CurrentUser } from '../common/current-user.decorator';
import { RequirePermissions } from '../common/permissions.decorator';
import { OutboxService } from './outbox.service';

@Controller('v1/messages')
export class OutboxController {
  constructor(private readonly outbox: OutboxService) {}

  @Get('logs')
  @RequirePermissions(PERMISSIONS.MESSAGES_READ)
  list(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: string,
  ) {
    const parsed = Number(limit ?? 100);
    return this.outbox.listLogs(
      user.tenantId,
      Number.isFinite(parsed) ? parsed : 100,
    );
  }

  @Post(':id/retry')
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async retry(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.outbox.retry(user.tenantId, id);
    return { queued: true };
  }
}
