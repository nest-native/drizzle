import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { ClsModule } from 'nestjs-cls';
import { DrizzleModule, getDrizzleClientToken } from '@nest-native/drizzle';
import { AuthModule } from './auth/auth.module';
import { createDatabase, type AppDatabase } from './database';
import { ProjectsModule } from './projects/projects.module';
import { schema } from './schema';
import { StartupSeeder } from './startup-seeder';

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
    AuthModule,
    ProjectsModule,
  ],
  providers: [
    StartupSeeder,
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
          whitelist: true,
          forbidNonWhitelisted: true,
        }),
    },
  ],
})
export class AppModule {}
