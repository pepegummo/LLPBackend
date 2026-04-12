import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // HTTP security headers
  app.use(helmet());

  // CORS — locked to the frontend origin
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Strip unknown fields, transform payloads, and reject bad data globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strip properties not in DTO
      forbidNonWhitelisted: false,
      transform: true,       // auto-convert primitives (string → number etc.)
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`LLP Backend running on http://localhost:${port}`);
}

bootstrap();
