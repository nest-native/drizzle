import { Module } from '@nestjs/common';
import {
  ClsPluginTransactional,
} from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { ClsModule } from 'nestjs-cls';
import { DrizzleModule } from '@nest-native/drizzle';
import { createDatabase, type AppDatabase } from './database';
import { schema } from './schema';
import { TransfersModule } from './transfers/transfers.module';
import { getDrizzleClientToken } from '@nest-native/drizzle';

@Module({
  imports: [
    DrizzleModule.forRoot<AppDatabase>({
      schema,
      connection: createDatabase(),
      shutdown: database => database.$client.close(),
    }),
    ClsModule.forRoot({
      global: true,
      plugins: [
        new ClsPluginTransactional({
          adapter: new TransactionalAdapterDrizzleOrm({
            drizzleInstanceToken: getDrizzleClientToken(),
          }),
          enableTransactionProxy: true,
        }),
      ],
    }),
    TransfersModule,
  ],
})
export class AppModule {}
