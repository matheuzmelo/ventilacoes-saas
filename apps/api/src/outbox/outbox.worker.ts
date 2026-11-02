import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { OutboxService } from './outbox.service';

const PROCESS_INTERVAL_MS = 15_000;

@Injectable()
export class OutboxWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxWorker.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly outbox: OutboxService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.outbox.processAllTenants().catch((error: unknown) => {
        this.logger.error(
          'Falha no worker de outbox',
          error instanceof Error ? error.stack : String(error),
        );
      });
    }, PROCESS_INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
