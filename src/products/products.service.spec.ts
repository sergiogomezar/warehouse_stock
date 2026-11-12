import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';
import { mockPersistence } from '../../test/support/unit-mocks.js';
import { Turnover } from '../common/turnover.js';
import { StockItem } from '../stock/stock-item.entity.js';
import { StockMovement } from '../stock/stock-movement.entity.js';
import { Product } from './product.entity.js';
import { ProductsService } from './products.service.js';

const ID = '0b4f8a3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: ID,
    sku: 'CHEM-0001',
    name: 'Sodium hydroxide 25kg',
    unit: 'BAG',
    turnover: Turnover.HIGH,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('ProductsService', () => {
  let service: ProductsService;
  let db: ReturnType<typeof mockPersistence>;

  beforeEach(async () => {
    db = mockPersistence([Product, StockItem, StockMovement]);
    const moduleRef = await Test.createTestingModule({
      providers: [ProductsService, ...db.providers],
    }).compile();
    service = moduleRef.get(ProductsService);
  });

  const products = () => db.repo(Product);
  const stock = () => db.repo(StockItem);
  const movements = () => db.repo(StockMovement);

  describe('create', () => {
    const dto = {
      sku: 'CHEM-0001',
      name: 'Sodium hydroxide 25kg',
      unit: 'BAG',
      turnover: Turnover.HIGH,
    };

    it('saves a product with a free SKU', async () => {
      products().existsBy.mockResolvedValue(false);
      products().save.mockResolvedValue(product());
      await expect(service.create(dto)).resolves.toEqual(product());
      expect(products().save).toHaveBeenCalledWith(dto);
    });

    it('throws 409 when the SKU exists', async () => {
      products().existsBy.mockResolvedValue(true);
      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(products().save).not.toHaveBeenCalled();
    });

    it('maps a unique violation race to 409', async () => {
      products().existsBy.mockResolvedValue(false);
      products().save.mockRejectedValue(
        new QueryFailedError('INSERT', [], Object.assign(new Error(), { code: '23505' })),
      );
      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findAll', () => {
    it('filters by turnover when given', async () => {
      products().find.mockResolvedValue([]);
      await service.findAll({ turnover: Turnover.LOW });
      expect(products().find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { turnover: Turnover.LOW } }),
      );
    });

    it('lists all without a filter', async () => {
      products().find.mockResolvedValue([]);
      await service.findAll({});
      expect(products().find).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the product', async () => {
      products().findOneBy.mockResolvedValue(product());
      await expect(service.findOne(ID)).resolves.toEqual(product());
    });

    it('throws 404 when missing', async () => {
      products().findOneBy.mockResolvedValue(null);
      await expect(service.findOne(ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('renames a product, locking its row', async () => {
      products().findOne.mockResolvedValue(product());
      await expect(service.update(ID, { name: 'Caustic soda' })).resolves.toMatchObject({
        name: 'Caustic soda',
      });
      expect(products().findOne).toHaveBeenCalledWith({
        where: { id: ID },
        lock: { mode: 'pessimistic_write' },
      });
    });

    it('throws 404 when missing', async () => {
      products().findOne.mockResolvedValue(null);
      await expect(service.update(ID, { name: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws 409 when the new SKU is taken', async () => {
      products().findOne.mockResolvedValue(product());
      products().existsBy.mockResolvedValue(true);
      await expect(service.update(ID, { sku: 'CHEM-0002' })).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(products().save).not.toHaveBeenCalled();
    });

    it('does not check uniqueness when the SKU is unchanged', async () => {
      products().findOne.mockResolvedValue(product());
      await service.update(ID, { sku: 'CHEM-0001' });
      expect(products().existsBy).not.toHaveBeenCalled();
    });

    it('changes turnover of a product without stock', async () => {
      products().findOne.mockResolvedValue(product());
      stock().existsBy.mockResolvedValue(false);
      await expect(
        service.update(ID, { turnover: Turnover.MEDIUM }),
      ).resolves.toMatchObject({ turnover: Turnover.MEDIUM });
    });

    it('throws 409 when changing turnover of a product with stock', async () => {
      products().findOne.mockResolvedValue(product());
      stock().existsBy.mockResolvedValue(true);
      await expect(
        service.update(ID, { turnover: Turnover.MEDIUM }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(stock().existsBy).toHaveBeenCalledWith({ productId: ID });
      expect(products().save).not.toHaveBeenCalled();
    });

    it('allows sending the same turnover while stock exists', async () => {
      products().findOne.mockResolvedValue(product());
      await service.update(ID, { turnover: Turnover.HIGH });
      expect(stock().existsBy).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes a product with no stock and no movements', async () => {
      products().findOne.mockResolvedValue(product());
      stock().existsBy.mockResolvedValue(false);
      movements().existsBy.mockResolvedValue(false);
      await service.remove(ID);
      expect(products().delete).toHaveBeenCalledWith({ id: ID });
    });

    it('throws 404 when missing', async () => {
      products().findOne.mockResolvedValue(null);
      await expect(service.remove(ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws 409 when the product has stock', async () => {
      products().findOne.mockResolvedValue(product());
      stock().existsBy.mockResolvedValue(true);
      movements().existsBy.mockResolvedValue(false);
      await expect(service.remove(ID)).rejects.toBeInstanceOf(ConflictException);
      expect(products().delete).not.toHaveBeenCalled();
    });

    it('throws 409 when the product has movements', async () => {
      products().findOne.mockResolvedValue(product());
      stock().existsBy.mockResolvedValue(false);
      movements().existsBy.mockResolvedValue(true);
      await expect(service.remove(ID)).rejects.toBeInstanceOf(ConflictException);
      expect(products().delete).not.toHaveBeenCalled();
    });
  });
});
