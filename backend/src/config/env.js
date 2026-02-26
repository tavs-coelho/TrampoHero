/**
 * Backend environment variable validation.
 * Call validateEnv() at server startup so the process fails fast
 * with a clear message when required variables are missing.
 */

const REQUIRED_VARS = ['JWT_SECRET', 'MONGODB_URI'];

const OPTIONAL_VARS = {
  PORT: '5000',
  NODE_ENV: 'development',
  JWT_EXPIRE: '30d',
  FRONTEND_URL: 'http://localhost:3000',
  ALLOWED_ORIGINS: '',
  GEMINI_API_KEY: '',
  STRIPE_SECRET_KEY: '',
  RATE_LIMIT_MAX: '100',
};

export function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `\n❌  Missing required environment variables:\n   ${missing.join('\n   ')}\n\n` +
        `   Copy backend/.env.example to backend/.env and fill in the values.\n`,
    );
    process.exit(1);
  }

  // Apply defaults for optional vars that are not set
  for (const [key, defaultValue] of Object.entries(OPTIONAL_VARS)) {
    if (!process.env[key] && defaultValue !== '') {
      process.env[key] = defaultValue;
    }
  }

  return {
    PORT: parseInt(process.env.PORT, 10),
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRE: process.env.JWT_EXPIRE,
    FRONTEND_URL: process.env.FRONTEND_URL,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10),
  };
}
