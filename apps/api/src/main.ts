import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins().has(origin) || origin.endsWith('.up.railway.app')) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.setGlobalPrefix('api');

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swagger = new DocumentBuilder()
    .setTitle('STATWIN API')
    .setDescription(
      'Piattaforma di analisi statistica sportiva. Le probabilità sono stime, non certezze. Non promette vincite.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`STATWIN API http://0.0.0.0:${port}/api/v1`);
  console.log(`Swagger     http://0.0.0.0:${port}/docs`);
}

function allowedOrigins(): Set<string> {
  const extras = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const railwayPublic = process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : undefined;

  return new Set(
    [
      process.env.FRONTEND_URL ?? 'http://localhost:3000',
      process.env.ADMIN_URL ?? 'http://localhost:3002',
      railwayPublic,
      ...extras,
    ].filter((value): value is string => Boolean(value)),
  );
}

bootstrap();
