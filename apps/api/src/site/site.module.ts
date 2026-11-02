import { Module } from '@nestjs/common';
import { CmsModule } from '../cms/cms.module';
import { TenantModule } from '../tenant/tenant.module';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';

@Module({
  imports: [TenantModule, CmsModule],
  controllers: [SiteController],
  providers: [SiteService],
})
export class SiteModule {}
