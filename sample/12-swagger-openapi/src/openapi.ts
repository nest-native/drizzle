import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Project API')
    .setDescription('Drizzle-backed NestJS routes documented with OpenAPI')
    .setVersion('1.0.0')
    .build();

  return SwaggerModule.createDocument(app, config);
}
