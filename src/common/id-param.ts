import { z } from 'zod';

/** Schema for UUID route params: `@Param('id', { schema: idParamSchema })`. */
export const idParamSchema = z.uuid();
