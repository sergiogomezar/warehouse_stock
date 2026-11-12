import { ConflictException } from '@nestjs/common';

/** Postgres SQLSTATE codes handled here. */
export const PG_UNIQUE_VIOLATION = '23505';
export const PG_FOREIGN_KEY_VIOLATION = '23503';

function pgCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  // TypeORM's QueryFailedError copies the driver error fields onto itself,
  // and also keeps the original as `driverError`.
  const candidate = error as { code?: unknown; driverError?: { code?: unknown } };
  const code = candidate.code ?? candidate.driverError?.code;
  return typeof code === 'string' ? code : undefined;
}

/**
 * Maps Postgres unique and foreign key violations to 409, to cover races
 * between a service's explicit check and its write. Other errors pass
 * through unchanged.
 */
export function mapDatabaseError(error: unknown, message?: string): unknown {
  switch (pgCode(error)) {
    case PG_UNIQUE_VIOLATION:
      return new ConflictException(message ?? 'Resource already exists');
    case PG_FOREIGN_KEY_VIOLATION:
      return new ConflictException(
        message ?? 'Resource is referenced by or references another resource',
      );
    default:
      return error;
  }
}

/** Runs `operation` and rethrows its error through `mapDatabaseError`. */
export async function withDatabaseErrors<T>(
  operation: () => Promise<T>,
  message?: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw mapDatabaseError(error, message);
  }
}
