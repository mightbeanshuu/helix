import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  API_PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().default('0.0.0.0'),
  API_CORS_ORIGIN: z.string().default('http://localhost:5173'),
  API_BODY_LIMIT_MB: z.coerce.number().positive().default(5),
  API_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(120),

  STORAGE_DRIVER: z.enum(['memory', 'neo4j']).default('memory'),
  NEO4J_URI: z.string().default('bolt://localhost:7687'),
  NEO4J_USER: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string().default('helixhelix'),
  NEO4J_DATABASE: z.string().default('neo4j'),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  QUEUE_PREFIX: z.string().default('helix'),

  ANTHROPIC_API_KEY: z.string().default(''),
  HELIX_LLM_MODEL: z.string().default('claude-opus-4-7'),
  HELIX_LLM_FAST_MODEL: z.string().default('claude-haiku-4-5-20251001'),
  HELIX_LLM_BUDGET_USD: z.coerce.number().nonnegative().default(5),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
