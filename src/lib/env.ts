import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  SESSION_SECRET: z
    .string()
    .min(12, 'SESSION_SECRET must be at least 12 characters'),
  SESSION_COOKIE_NAME: z.string().min(1, 'SESSION_COOKIE_NAME is required'),
  LOCAL_ADMIN_EMAIL: z.email('LOCAL_ADMIN_EMAIL must be a valid email address'),
  LOCAL_ADMIN_PASSWORD: z
    .string()
    .min(12, 'LOCAL_ADMIN_PASSWORD must be at least 12 characters'),
  APP_BASE_URL: z.string().url('APP_BASE_URL must be a valid URL'),
});

export type AppEnv = z.infer<typeof envSchema>;

export function parseEnv(input: Record<string, string | undefined>): AppEnv {
  return envSchema.parse(input);
}

export function getEnv(
  input: Record<string, string | undefined> = process.env,
): AppEnv {
  return parseEnv(input);
}
