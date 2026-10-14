import * as dns from 'node:dns';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

// Configure public DNS resolvers to prevent querySrv ECONNREFUSED on Windows with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore if custom DNS resolution is restricted
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global API route prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors();

  // Global DTO Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Reward & Referral Engine API')
    .setDescription(
      'Multi-Project Reward & Referral Backend with project-isolated coins, referrals, gift cards, and universal shared coupons.',
    )
    .setVersion('1.0')
    .addTag('Auth', 'Admin authentication & JWT')
    .addTag('Projects', 'Multi-tenant project creation and configuration')
    .addTag('Members & Wallet', 'Project-isolated users, coin balances & transactions')
    .addTag('Referrals', 'Project-scoped referral stats & conversions')
    .addTag('Gift Cards', 'Project-specific gift card catalogs & redemptions')
    .addTag('Universal Coupons', 'Cross-project shared coupon codes')
    .addTag(
      'My Account (End-User / Mobile)',
      'Personal profile, balance, referrals, and reward redemptions for mobile app end-users',
    )
    .addTag(
      'External / Partner Coupons (Feedico & Gostatus)',
      'Synced partner coupons from Gostatus / Feedico with automated daily Cron sync and member coin redemption',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter Admin JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
        description: 'Project API key for client & mobile application integration',
      },
      'api-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerCustomOptions = {
    customSiteTitle: 'Reward & Referral Engine - Swagger API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      docExpansion: 'list',
    },
    jsonDocumentUrl: 'api/docs/json',
    yamlDocumentUrl: 'api/docs/yaml',
  };

  SwaggerModule.setup('api/docs', app, document, swaggerCustomOptions);
  SwaggerModule.setup('docs', app, document, swaggerCustomOptions);

  const configService = app.get(ConfigService);
  const port =
    configService.get<number>('app.port') ??
    (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

  await app.listen(port);
  logger.log(`🚀 Application running on: http://localhost:${port}/api`);
  logger.log(`📚 Swagger documentation at: http://localhost:${port}/api/docs`);
}

bootstrap();
