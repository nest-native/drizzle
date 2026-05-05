import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ProductsService } from './products.service';
import type { Product } from './products.repository';

interface CreateProductBody {
  name?: string;
  price?: number;
}

interface RenameProductBody {
  name?: string;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(): Promise<Product[]> {
    return this.productsService.list();
  }

  @Post()
  create(@Body() body: CreateProductBody): Promise<Product> {
    return this.productsService.create(body);
  }

  @Patch(':id')
  rename(
    @Param('id') id: string,
    @Body() body: RenameProductBody,
  ): Promise<Product | undefined> {
    return this.productsService.rename(Number(id), body);
  }

  @Post(':id/deactivate')
  deactivate(@Param('id') id: string): Promise<Product | undefined> {
    return this.productsService.deactivate(Number(id));
  }
}
