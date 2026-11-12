import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { createProduct } from './support/fixtures.js';
import { createTestApp, truncateTables } from './support/test-app.js';

describe('Products (e2e)', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await truncateTables(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('create a product', () => {
    it('creates a product (201)', async () => {
      const res = await http()
        .post('/products')
        .send({
          sku: 'CHEM-0001',
          name: 'Sodium hydroxide 25kg',
          unit: 'BAG',
          turnover: 'HIGH',
        })
        .expect(201);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        sku: 'CHEM-0001',
        name: 'Sodium hydroxide 25kg',
        unit: 'BAG',
        turnover: 'HIGH',
      });
    });

    it('rejects a duplicate SKU (409)', async () => {
      await createProduct(app, { sku: 'CHEM-0001' });
      await http()
        .post('/products')
        .send({ sku: 'CHEM-0001', name: 'Other', unit: 'KG', turnover: 'LOW' })
        .expect(409);
      const list = await http().get('/products').expect(200);
      expect(list.body).toHaveLength(1);
    });

    it('rejects an invalid turnover naming the field (400)', async () => {
      const res = await http()
        .post('/products')
        .send({ sku: 'CHEM-0001', name: 'X', unit: 'KG', turnover: 'VERY_HIGH' })
        .expect(400);
      expect(res.body.message.join(' ')).toContain('turnover');
    });
  });

  describe('list and read products', () => {
    it('filters by turnover', async () => {
      await createProduct(app, { sku: 'H', turnover: 'HIGH' });
      await createProduct(app, { sku: 'M', turnover: 'MEDIUM' });
      await createProduct(app, { sku: 'L', turnover: 'LOW' });
      const res = await http().get('/products?turnover=LOW').expect(200);
      expect(res.body.map((p: { sku: string }) => p.sku)).toEqual(['L']);
    });

    it('reads one product', async () => {
      const product = await createProduct(app);
      const res = await http().get(`/products/${product.id}`).expect(200);
      expect(res.body.sku).toBe(product.sku);
    });

    it('returns 404 for an unknown id', async () => {
      await http().get(`/products/${randomUUID()}`).expect(404);
    });

    it('returns 400 for a malformed id', async () => {
      await http().get('/products/not-a-uuid').expect(400);
    });
  });

  describe('update a product', () => {
    it('renames a product (200)', async () => {
      const product = await createProduct(app);
      const res = await http()
        .patch(`/products/${product.id}`)
        .send({ name: 'Caustic soda' })
        .expect(200);
      expect(res.body.name).toBe('Caustic soda');
    });

    it('changes turnover of a product without stock (200)', async () => {
      const product = await createProduct(app, { turnover: 'HIGH' });
      const res = await http()
        .patch(`/products/${product.id}`)
        .send({ turnover: 'MEDIUM' })
        .expect(200);
      expect(res.body.turnover).toBe('MEDIUM');
    });

    it('rejects a SKU taken by another product (409)', async () => {
      await createProduct(app, { sku: 'CHEM-0001' });
      const other = await createProduct(app, { sku: 'CHEM-0002' });
      await http()
        .patch(`/products/${other.id}`)
        .send({ sku: 'CHEM-0001' })
        .expect(409);
    });

    it('returns 404 for an unknown id', async () => {
      await http().patch(`/products/${randomUUID()}`).send({ name: 'X' }).expect(404);
    });
  });

  describe('delete a product', () => {
    it('deletes an unused product (204)', async () => {
      const product = await createProduct(app);
      await http().delete(`/products/${product.id}`).expect(204);
      await http().get(`/products/${product.id}`).expect(404);
    });

    it('returns 404 for an unknown id', async () => {
      await http().delete(`/products/${randomUUID()}`).expect(404);
    });
  });
});
