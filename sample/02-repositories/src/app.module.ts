import { Module } from '@nestjs/common';
import { DrizzleModule } from 'nest-drizzle-native';
import { createDatabase, type AppDatabase } from './database';
import { ProductsModule } from './products/products.module';
import { schema } from './schema';

@Module({
  imports: [
    DrizzleModule.forRoot<AppDatabase>({
      schema,
      connection: createDatabase(),
      shutdown: database => database.$client.close(),
    }),
    ProductsModule,
  ],
})
export class AppModule {}
