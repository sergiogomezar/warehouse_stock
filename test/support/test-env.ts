import { existsSync } from 'node:fs';

/**
 * Returns TEST_DATABASE_URL, loading .env when it is not already set.
 * E2E tests never touch DATABASE_URL's database.
 */
export function testDatabaseUrl(): string {
  if (!process.env.TEST_DATABASE_URL && existsSync('.env')) {
    process.loadEnvFile('.env');
  }
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error('TEST_DATABASE_URL is not set (see .env.example)');
  }
  return url;
}
