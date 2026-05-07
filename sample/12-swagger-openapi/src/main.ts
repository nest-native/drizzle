import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { createOpenApiDocument } from './openapi';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const document = createOpenApiDocument(app);

  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
}

void bootstrap();
