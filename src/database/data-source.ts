import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from './data-source-options.js';

// Entry point for the TypeORM migration CLI only. The CLI runs outside
// Nest DI, so it reads process.env directly (and .env when present).
if (!process.env.DATABASE_URL && existsSync('.env')) {
  process.loadEnvFile('.env');
}
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set (see .env.example)');
}

export default new DataSource(dataSourceOptions(url));
