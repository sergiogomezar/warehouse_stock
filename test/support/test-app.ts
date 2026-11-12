import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module.js';
import { setupApp } from '../../src/setup-app.js';
import { testDatabaseUrl } from './test-env.js';

/**
 * Builds the full app against TEST_DATABASE_URL, with the same global setup
 * as `main.ts`. Process env wins over .env in ConfigModule, so overriding
 * DATABASE_URL here points the app at the test database.
 */
export async function createTestApp(): Promise<INestApplication<App>> {
  process.env.DATABASE_URL = testDatabaseUrl();
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = setupApp(moduleRef.createNestApplication<INestApplication<App>>());
  await app.init();
  return app;
}

/** Empties every entity table, so each test starts from a clean database. */
export async function truncateTables(app: INestApplication): Promise<void> {
  const dataSource = app.get(DataSource);
  const tables = dataSource.entityMetadatas
    .map((metadata) => `"${metadata.tableName}"`)
    .join(', ');
  if (tables) {
    await dataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE`);
  }
}
