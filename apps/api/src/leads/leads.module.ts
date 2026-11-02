import { Module } from '@nestjs/common';
import { CmsModule } from '../cms/cms.module';
import { OutboxModule } from '../outbox/outbox.module';
import { TenantModule } from '../tenant/tenant.module';
import {
  AdminLeadsController,
  PublicLeadsController,
} from './leads.controller';
import { LeadsService } from './leads.service';
import { RateLimitService } from './rate-limit.service';

@Module({
  imports: [TenantModule, CmsModule, OutboxModule],
  controllers: [PublicLeadsController, AdminLeadsController],
  providers: [LeadsService, RateLimitService],
  exports: [LeadsService],
})
export class LeadsModule {}
