import './instrument';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { join } from 'path';
import { AdminAPIModule } from './app/admin-api.module';
import { getConfig } from 'license-verify';
import { initializeApp } from 'firebase-admin/app';
import { credential } from 'firebase-admin';
import { loadSecrets } from '@ridy/database';

async function bootstrap() {
  await loadSecrets();
  const app = await NestFactory.create<NestExpressApplication>(
    AdminAPIModule.register(),
  );

  // Increase body size limit to 20MB
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  if ((process.env.STORAGE_DRIVER ?? 'local').toLowerCase() === 'local') {
    app.useStaticAssets(join(process.env.LOCAL_ROOT ?? '', 'uploads'), {
      prefix: '/uploads/',
    });
  }

  const port = parseInt(process.env.ADMIN_API_PORT || '3000', 10);
  app.enableShutdownHooks();
  app.enableCors();

  const config = await getConfig(process.env.NODE_ENV ?? 'production');
  if (config != null && config.firebaseProjectPrivateKey != null) {
    initializeApp({
      credential: credential.cert(
        `${process.cwd()}/config/${config.firebaseProjectPrivateKey}`,
      ),
    });
  }
  await app.listen(port, () => {
    Logger.log(`Listening at http://localhost:${port}`, 'Admin API');
  });
}

bootstrap();
