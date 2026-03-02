import dotenv from 'dotenv'
import path from 'path'

const nodeEnv = process.env.NODE_ENV ?? 'development'

dotenv.config({
  path: path.join(process.cwd(), '.env'),
  // In production (e.g., Vercel), platform env vars should win.
  override: nodeEnv !== 'production',
})

const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 5000),
  DATABASE_URL: process.env.DATABASE_URL ?? '',
  FRONTEND_URL: process.env.FRONTEND_URL ?? '',
  ENABLE_TEST_ROLE_SWITCH:
    process.env.ENABLE_TEST_ROLE_SWITCH === 'true' ||
    (process.env.NODE_ENV ?? 'development') !== 'production',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? '',
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER ?? 'saas-file-management',
  REQUEST_BODY_LIMIT: process.env.REQUEST_BODY_LIMIT ?? '25mb',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '1d',
  JWT_LOGIN_SECRET: process.env.JWT_LOGIN_SECRET ?? 'change-me-login-secret',
  JWT_LOGIN_EXPIRES_IN: process.env.JWT_LOGIN_EXPIRES_IN ?? '15m',
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS ?? 10),
  DEFAULT_ADMIN_NAME: process.env.DEFAULT_ADMIN_NAME ?? 'Rakibul Islam',
  DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL ?? 'fl.rakibul@gmail.com',
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD ?? '12345678',
}

export default env
