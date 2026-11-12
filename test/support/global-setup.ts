import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../../src/database/data-source-options.js';
import { testDatabaseUrl } from './test-env.js';

/**
 * Runs once before the e2e suite: rebuilds the test database schema
 * from the migrations, so tests run against the real schema.
 */
export default async function setup(): Promise<void> {
  const dataSource = new DataSource(dataSourceOptions(testDatabaseUrl()));
  await dataSource.initialize();
  try {
    await dataSource.dropDatabase();
    await dataSource.runMigrations();
  } finally {
    await dataSource.destroy();
  }
}
