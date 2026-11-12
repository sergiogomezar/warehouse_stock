import {
  createProductSchema,
  listProductsQuerySchema,
  updateProductSchema,
} from './product.schemas.js';

const valid = {
  sku: 'CHEM-0001',
  name: 'Sodium hydroxide 25kg',
  unit: 'BAG',
  turnover: 'HIGH',
};

function failingPaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => issue.path.join('.')) ?? [];
}

describe('createProductSchema', () => {
  it('accepts a valid product and trims strings', () => {
    expect(createProductSchema.parse({ ...valid, name: '  Acid  ' })).toEqual({
      ...valid,
      name: 'Acid',
    });
  });

  it.each([
    ['sku', { sku: '' }],
    ['sku', { sku: 'x'.repeat(51) }],
    ['name', { name: '   ' }],
    ['name', { name: 42 }],
    ['unit', { unit: '' }],
    ['turnover', { turnover: 'VERY_HIGH' }],
  ])('rejects invalid %s', (field, patch) => {
    const result = createProductSchema.safeParse({ ...valid, ...patch });
    expect(result.success).toBe(false);
    expect(failingPaths(result)).toEqual([field]);
  });

  it.each(['sku', 'name', 'unit', 'turnover'])('requires %s', (field) => {
    const input: Record<string, unknown> = { ...valid };
    delete input[field];
    expect(failingPaths(createProductSchema.safeParse(input))).toEqual([field]);
  });
});

describe('updateProductSchema', () => {
  it('accepts a partial update', () => {
    expect(updateProductSchema.parse({ name: 'New' })).toEqual({ name: 'New' });
  });

  it('rejects an invalid turnover', () => {
    expect(failingPaths(updateProductSchema.safeParse({ turnover: 'FAST' }))).toEqual([
      'turnover',
    ]);
  });
});

describe('listProductsQuerySchema', () => {
  it('accepts no filter and a turnover filter', () => {
    expect(listProductsQuerySchema.parse({})).toEqual({});
    expect(listProductsQuerySchema.parse({ turnover: 'LOW' })).toEqual({ turnover: 'LOW' });
  });

  it('rejects an unknown turnover', () => {
    expect(failingPaths(listProductsQuerySchema.safeParse({ turnover: 'x' }))).toEqual([
      'turnover',
    ]);
  });
});
