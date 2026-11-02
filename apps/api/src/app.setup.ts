import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { correlationIdMiddleware } from './common/request-context';

export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);
  const httpInstance = app.getHttpAdapter().getInstance() as {
    disable?: (setting: string) => void;
    set?: (setting: string, value: unknown) => void;
  };
  httpInstance.disable?.('x-powered-by');
  httpInstance.set?.('trust proxy', 1);

  app.use(cookieParser());
  app.use(correlationIdMiddleware);

  const webUrls = (config.get<string>('WEB_URL') ?? 'http://localhost:3000')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  app.enableCors({
    origin: isProduction ? webUrls : true,
    credentials: true,
    exposedHeaders: ['x-correlation-id'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
}
