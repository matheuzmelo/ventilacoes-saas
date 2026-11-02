import { z } from 'zod';

const optionalString = z
  .string()
  .optional()
  .transform((value) => (value === '' ? undefined : value));

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  WEB_URL: z.string().min(1).default('http://localhost:3000'),
  APP_BASE_DOMAIN: z.string().min(1).default('lvh.me'),

  DATABASE_URL: z.string().min(1),
  MIGRATE_DATABASE_URL: z.string().min(1).optional(),
  SHADOW_DATABASE_URL: z.string().min(1).optional(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_LEADS_PER_HOUR: z.coerce.number().int().positive().default(5),

  ENCRYPTION_KEY: z.string().min(32),

  RESEND_API_KEY: optionalString,
  MAIL_FROM: z
    .string()
    .min(1)
    .default('Ventilações <nao-responda@lvh.me>'),
  MAIL_REPLY_TO: optionalString,

  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().int().positive().default(9000),
  MINIO_USE_SSL: booleanString,
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET: z.string().default('ventilacoes'),

  MERCADO_PAGO_CLIENT_ID: optionalString,
  MERCADO_PAGO_CLIENT_SECRET: optionalString,
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuração de ambiente inválida:\n${issues}`);
  }

  return parsed.data;
}
