import { z } from 'zod';
import { turnoverSchema } from '../common/turnover.js';

export const createProductSchema = z.object({
  sku: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(200),
  unit: z.string().trim().min(1).max(20),
  turnover: turnoverSchema,
});
export type CreateProductDto = z.infer<typeof createProductSchema>;

export const updateProductSchema = createProductSchema.partial();
export type UpdateProductDto = z.infer<typeof updateProductSchema>;

export const listProductsQuerySchema = z.object({
  turnover: turnoverSchema.optional(),
});
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
