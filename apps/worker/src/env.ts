import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  QUEUE_PREFIX: z.string().default('helix'),
  QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(4),

  STORAGE_DRIVER: z.enum(['memory', 'neo4j']).default('memory'),
  NEO4J_URI: z.string().default('bolt://localhost:7687'),
  NEO4J_USER: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string().default('helixhelix'),
  NEO4J_DATABASE: z.string().default('neo4j'),

  ANTHROPIC_API_KEY: z.string().default(''),
  HELIX_LLM_MODEL: z.string().default('claude-opus-4-7'),
  HELIX_LLM_FAST_MODEL: z.string().default('claude-haiku-4-5-20251001'),
  HELIX_LLM_BUDGET_USD: z.coerce.number().nonnegative().default(5),

  VOYAGE_API_KEY: z.string().default(''),
  HELIX_EMBED_MODEL: z.string().default('voyage-code-3'),

  GITHUB_TOKEN: z.string().default(''),

  HELIX_MAX_REPO_MB: z.coerce.number().int().positive().default(512),
  HELIX_MAX_FILES: z.coerce.number().int().positive().default(50_000),
  HELIX_CLONE_DIR: z.string().default('./.helix/clones'),
  HELIX_STORAGE_DIR: z.string().default('./.helix/storage'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid worker env', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}
