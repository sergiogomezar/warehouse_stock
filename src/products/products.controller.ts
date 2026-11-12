import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { idParamSchema } from '../common/id-param.js';
import type { Product } from './product.entity.js';
import {
  type CreateProductDto,
  createProductSchema,
  type ListProductsQuery,
  listProductsQuerySchema,
  type UpdateProductDto,
  updateProductSchema,
} from './product.schemas.js';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(
    @Body({ schema: createProductSchema }) dto: CreateProductDto,
  ): Promise<Product> {
    return this.productsService.create(dto);
  }

  @Get()
  findAll(
    @Query({ schema: listProductsQuerySchema }) query: ListProductsQuery,
  ): Promise<Product[]> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', { schema: idParamSchema }) id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', { schema: idParamSchema }) id: string,
    @Body({ schema: updateProductSchema }) dto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', { schema: idParamSchema }) id: string): Promise<void> {
    return this.productsService.remove(id);
  }
}
