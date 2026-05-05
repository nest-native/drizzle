import { Injectable, OnModuleInit } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import type { Product } from './products.repository';

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async onModuleInit(): Promise<void> {
    await this.productsRepository.migrate();
  }

  list(): Promise<Product[]> {
    return this.productsRepository.list();
  }

  create(input: { name?: string; price?: number }): Promise<Product> {
    return this.productsRepository.create({
      name: input.name ?? 'Unnamed product',
      price: input.price ?? 0,
    });
  }

  rename(id: number, input: { name?: string }): Promise<Product | undefined> {
    return this.productsRepository.rename(id, input.name ?? 'Renamed product');
  }

  deactivate(id: number): Promise<Product | undefined> {
    return this.productsRepository.deactivate(id);
  }
}
