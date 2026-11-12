import type { Provider } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import type { Mock } from 'vitest';

/** Repository methods the services call, each a `vi.fn()`. */
export type MockRepository = Record<
  | 'find'
  | 'findOne'
  | 'findOneBy'
  | 'exists'
  | 'existsBy'
  | 'sum'
  | 'create'
  | 'merge'
  | 'save'
  | 'insert'
  | 'update'
  | 'delete'
  | 'remove'
  | 'createQueryBuilder',
  Mock
>;

export function mockRepository(): MockRepository {
  return {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    exists: vi.fn(),
    existsBy: vi.fn(),
    sum: vi.fn(),
    // Mirrors TypeORM: create() builds a plain entity from the input.
    create: vi.fn((input: object) => ({ ...input })),
    merge: vi.fn((target: object, ...sources: object[]) =>
      Object.assign(target, ...sources),
    ),
    save: vi.fn(async (entity: object) => entity),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    remove: vi.fn(),
    createQueryBuilder: vi.fn(),
  };
}

/**
 * Builds repository mocks for the given entities, plus a DataSource mock whose
 * `transaction(cb)` runs `cb` with a manager returning the same mocks from
 * `getRepository(Entity)`. Code in and out of transactions sees one mock per entity.
 */
export function mockPersistence(entities: Function[]) {
  const repositories = new Map<Function, MockRepository>(
    entities.map((entity) => [entity, mockRepository()]),
  );
  const repo = (entity: Function): MockRepository => {
    const found = repositories.get(entity);
    if (!found) throw new Error(`No mock repository for ${entity.name}`);
    return found;
  };
  const manager = {
    getRepository: vi.fn(repo),
    query: vi.fn(),
  };
  const dataSource = {
    transaction: vi.fn(async (...args: unknown[]) => {
      const run = args.at(-1) as (m: typeof manager) => Promise<unknown>;
      return run(manager);
    }),
    getRepository: vi.fn(repo),
    query: vi.fn(),
  };
  const providers: Provider[] = [
    ...entities.map((entity) => ({
      provide: getRepositoryToken(entity),
      useValue: repo(entity),
    })),
    { provide: getDataSourceToken(), useValue: dataSource },
  ];
  return { repo, manager, dataSource, providers };
}
