import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const ORIGINAL_ENV = process.env;

describe('config/env', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
    process.env.JWT_SECRET = 'test-secret';
    process.env.MONGODB_URI = 'mongodb://localhost/test';
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it('merges FRONTEND_URL into ALLOWED_ORIGINS without duplicates', async () => {
    process.env.FRONTEND_URL = 'https://app.trampohero.com.br';
    process.env.ALLOWED_ORIGINS = 'https://staging.trampohero.com,https://app.trampohero.com.br';

    const { env } = await import('../config/env.js');

    expect(env.ALLOWED_ORIGINS).toEqual([
      'https://staging.trampohero.com',
      'https://app.trampohero.com.br',
    ]);
  });

  it('uses first allowed origin as FRONTEND_URL fallback when FRONTEND_URL is empty', async () => {
    process.env.FRONTEND_URL = '';
    process.env.ALLOWED_ORIGINS = 'https://staging.trampohero.com,https://app.trampohero.com.br';

    const { env } = await import('../config/env.js');

    expect(env.FRONTEND_URL).toBe('https://staging.trampohero.com');
  });
});
