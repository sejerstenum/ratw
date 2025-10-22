import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MYSQL_HOST: z.string().min(1).default('127.0.0.1'),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_USER: z.string().min(1).default('root'),
  MYSQL_PASSWORD: z.string().default(''),
  MYSQL_DATABASE: z.string().min(1).default('ratw'),
  SEGMENTS_TABLE: z.string().min(1).default('segment_snapshots'),
  SEGMENTS_DATASET: z.string().min(1).default('default'),
  CORS_ORIGIN: z.string().optional(),
});

const env = envSchema.parse(process.env);

export const config = {
  port: env.PORT,
  mysql: {
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
  },
  segmentsTable: env.SEGMENTS_TABLE,
  datasetKey: env.SEGMENTS_DATASET,
  corsOrigins: env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : null,
};
