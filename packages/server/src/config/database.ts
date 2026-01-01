import { Knex } from 'knex';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { env } from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const dbConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: env.database.host,
    port: env.database.port,
    user: env.database.user,
    password: env.database.password,
    database: env.database.name,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: join(__dirname, '../db/migrations'),
    extension: 'js',
    loadExtensions: ['.js'],
  },
  seeds: {
    directory: join(__dirname, '../db/seeds'),
    extension: 'js',
    loadExtensions: ['.js'],
  },
};
