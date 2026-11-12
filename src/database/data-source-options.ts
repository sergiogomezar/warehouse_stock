import type { DataSourceOptions } from 'typeorm';
import type { PostgresDataSourceOptions } from 'typeorm/driver/postgres/PostgresDataSourceOptions.js';
import { entities } from './entities.js';
import { migrations } from './migrations/index.js';

/** Connection options shared by the app, the migration CLI and the e2e setup. */
export function basePostgresOptions(url: string) {
  return {
    type: 'postgres',
    url,
    // gen_random_uuid() is built into Postgres 13+, no extension needed.
    uuidExtension: 'pgcrypto',
    // The schema is managed by migrations only.
    synchronize: false,
  } satisfies PostgresDataSourceOptions;
}

/**
 * Options for data sources created outside Nest (migration CLI, e2e setup).
 * The app connects through `TypeOrmModule.forRootAsync` in AppModule.
 */
export function dataSourceOptions(url: string): DataSourceOptions {
  return { ...basePostgresOptions(url), entities, migrations };
}
