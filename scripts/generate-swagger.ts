import * as dns from 'node:dns';
import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore
}

async function generateSwagger() {
  console.log('[SWAGGER GENERATOR] Bootstrapping application to extract OpenAPI specification...');

  const app = await NestFactory.create(AppModule, {
    logger: false,
  });

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
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

  const document = SwaggerModule.createDocument(app, config);

  const outputPath = path.join(process.cwd(), 'swagger.json');
  fs.writeFileSync(outputPath, JSON.stringify(document, null, 2), 'utf8');
  console.log(`[SWAGGER GENERATOR] Successfully exported OpenAPI JSON spec to: ${outputPath}`);

  await app.close();
}

generateSwagger().catch((err) => {
  console.error('[SWAGGER GENERATOR] Error generating Swagger documentation:', err);
  process.exit(1);
});
