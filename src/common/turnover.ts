import { z } from 'zod';

/** Turnover class of a product, and turnover zone of a shelf. */
export enum Turnover {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export const TURNOVER_VALUES = [
  Turnover.HIGH,
  Turnover.MEDIUM,
  Turnover.LOW,
] as const;

export const turnoverSchema = z.enum(Turnover);

/** Name of the Postgres enum type shared by `shelves.zone` and `products.turnover`. */
export const TURNOVER_ENUM_NAME = 'turnover';
