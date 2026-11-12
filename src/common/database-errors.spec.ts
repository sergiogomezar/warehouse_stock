import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import {
  mapDatabaseError,
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
  withDatabaseErrors,
} from './database-errors.js';

function queryError(code: string): QueryFailedError {
  return new QueryFailedError('INSERT ...', [], Object.assign(new Error('db'), { code }));
}

describe('mapDatabaseError', () => {
  it('maps 23505 (unique violation) to ConflictException', () => {
    const mapped = mapDatabaseError(queryError(PG_UNIQUE_VIOLATION), 'dup');
    expect(mapped).toBeInstanceOf(ConflictException);
    expect((mapped as ConflictException).message).toBe('dup');
  });

  it('maps 23503 (foreign key violation) to ConflictException', () => {
    const mapped = mapDatabaseError(queryError(PG_FOREIGN_KEY_VIOLATION));
    expect(mapped).toBeInstanceOf(ConflictException);
  });

  it('passes other database errors through', () => {
    const error = queryError('23514');
    expect(mapDatabaseError(error)).toBe(error);
  });

  it('passes non-database errors through', () => {
    const error = new Error('boom');
    expect(mapDatabaseError(error)).toBe(error);
    expect(mapDatabaseError('text')).toBe('text');
  });
});

describe('withDatabaseErrors', () => {
  it('returns the operation result', async () => {
    await expect(withDatabaseErrors(async () => 42)).resolves.toBe(42);
  });

  it('rethrows a mapped error', async () => {
    await expect(
      withDatabaseErrors(async () => {
        throw queryError(PG_UNIQUE_VIOLATION);
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
