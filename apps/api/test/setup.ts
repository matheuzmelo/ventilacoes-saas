import { config } from 'dotenv';

config({ path: ['../../.env', '../../.env.local', '.env'] });

process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??=
  'postgresql://app_rw:app_rw@localhost:5433/ventilacoes';
process.env.MIGRATE_DATABASE_URL ??=
  'postgresql://app_migrator:app_migrator@localhost:5433/ventilacoes';
process.env.JWT_ACCESS_SECRET ??=
  'test-access-secret-000000000000000000000000';
process.env.JWT_REFRESH_SECRET ??=
  'test-refresh-secret-00000000000000000000000';
process.env.ENCRYPTION_KEY ??=
  '0000000000000000000000000000000000000000000000000000000000000000';
process.env.WEB_URL ??= 'http://localhost:3000';
process.env.APP_BASE_DOMAIN ??= 'lvh.me';
