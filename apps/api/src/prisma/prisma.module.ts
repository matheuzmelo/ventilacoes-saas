import { Global, Module } from '@nestjs/common';
import { TenantPrisma } from '@vs/db';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: TenantPrisma,
      useFactory: (prisma: PrismaService) => new TenantPrisma(prisma.client),
      inject: [PrismaService],
    },
  ],
  exports: [PrismaService, TenantPrisma],
})
export class PrismaModule {}
