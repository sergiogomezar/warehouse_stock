import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';

type Turnover = 'HIGH' | 'MEDIUM' | 'LOW';

let counter = 0;
const unique = (prefix: string) => `${prefix}-${++counter}`;

/** Creates a product through the API and returns the response body. */
export async function createProduct(
  app: INestApplication<App>,
  overrides: Partial<{ sku: string; name: string; unit: string; turnover: Turnover }> = {},
) {
  const res = await request(app.getHttpServer())
    .post('/products')
    .send({
      sku: unique('CHEM'),
      name: 'Test product',
      unit: 'KG',
      turnover: 'HIGH',
      ...overrides,
    })
    .expect(201);
  return res.body as { id: string; sku: string; turnover: Turnover };
}
