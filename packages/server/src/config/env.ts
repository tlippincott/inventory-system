import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  HOST: z.string().default('0.0.0.0'),

  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.string().default('5432'),
  DATABASE_NAME: z.string().default('invoice_system'),
  DATABASE_USER: z.string().default('invoice_user'),
  DATABASE_PASSWORD: z.string().default('invoice_password'),
  DATABASE_URL: z.string().optional(),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  UPLOAD_DIR: z.string().default('./uploads'),
  PDF_DIR: z.string().default('./pdfs'),
});

const envVars = envSchema.parse(process.env);

export const env = {
  nodeEnv: envVars.NODE_ENV,
  port: parseInt(envVars.PORT, 10),
  host: envVars.HOST,

  database: {
    host: envVars.DATABASE_HOST,
    port: parseInt(envVars.DATABASE_PORT, 10),
    name: envVars.DATABASE_NAME,
    user: envVars.DATABASE_USER,
    password: envVars.DATABASE_PASSWORD,
    url: envVars.DATABASE_URL ||
         `postgresql://${envVars.DATABASE_USER}:${envVars.DATABASE_PASSWORD}@${envVars.DATABASE_HOST}:${envVars.DATABASE_PORT}/${envVars.DATABASE_NAME}`,
  },

  cors: {
    origin: envVars.CORS_ORIGIN,
  },

  storage: {
    uploadDir: envVars.UPLOAD_DIR,
    pdfDir: envVars.PDF_DIR,
  },

  isDevelopment: envVars.NODE_ENV === 'development',
  isProduction: envVars.NODE_ENV === 'production',
  isTest: envVars.NODE_ENV === 'test',
};
