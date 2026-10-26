import { config } from 'dotenv';

config();

export const env = {
  PORT: Number(process.env.PORT) || 4200,
  ORIGIN: process.env.ORIGIN,
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',
  MONGO_URI: process.env.MONGO_URI ?? 'mongodb://localhost:27017/tasks_db',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  JWT_EXPIRES_IN_SECONDS: Number(process.env.JWT_EXPIRES_IN_SECONDS) || 3600,
  BCRYPT_SALT_ROUNDS: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
};

export const assertEnv = (): void => {
  if (env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET es obligatorio y debe tener al menos 32 caracteres');
  }
};
