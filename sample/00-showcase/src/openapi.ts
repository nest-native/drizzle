import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('nest-drizzle-native showcase')
    .setDescription('Full integration sample for NestJS, Drizzle, and Swagger')
    .setVersion('0.1.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
      },
      'showcase-api-key',
    )
    .build();

  return SwaggerModule.createDocument(app, config);
}
