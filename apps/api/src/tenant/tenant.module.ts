import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  controllers: [TenantController, PublicController],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
