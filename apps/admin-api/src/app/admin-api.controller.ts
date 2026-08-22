import {
  Body,
  Controller,
  Get,
  Header,
  Logger,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { readFile, rm } from 'fs/promises';
import { credential, projectManagement } from 'firebase-admin';

import { RestJwtAuthGuard } from './auth/rest-jwt-auth.guard';
import { initializeApp } from 'firebase-admin/app';
import { existsSync } from 'fs';
import { Repository } from 'typeorm';
import {
  CallMaskingService,
  MediaEntity,
  TwilioVoiceWebhookParams,
  UploadImageInterceptor,
} from '@ridy/database';
import { SupportWebhookService } from './support-webhook/support-webhook.service';
import { ChatwootWebhookPayload } from './support-webhook/dto/chatwoot-webhook.dto';
import { InjectRepository } from '@nestjs/typeorm';
import urlJoin from 'proper-url-join';
import { version } from '../../../../package.json';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    @InjectRepository(MediaEntity)
    private mediaRepository: Repository<MediaEntity>,
    private callMaskingService: CallMaskingService,
    private supportWebhookService: SupportWebhookService,
  ) {}

  @Get()
  async defaultPath(@Res() res: Response) {
    res.send(`✅ Admin API microservice running.\nVersion: ${version}`);
  }

  @Get('/debug-sentry')
  getError() {
    throw new Error('My first Sentry error!');
  }

  @Post('upload')
  @UseGuards(RestJwtAuthGuard)
  @UploadImageInterceptor('file')
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let id = '0';
    if (file) {
      const insert = await this.mediaRepository.insert({
        address: file.filename,
      });
      id = insert.raw.insertId.toString();
      const response = {
        __typename: 'Media',
        id: id,
        address: urlJoin(process.env.CDN_URL, file.filename),
      };
      res.send(response);
    } else {
      res.status(400).send('No file uploaded');
    }
  }

  @Get('reconfig')
  async reconfig(@Req() req: Request, @Res() res: Response) {
    const configAddress = `${process.cwd()}/config/config.${
      process.env.NODE_ENV ?? 'production'
    }.json`;
    await rm(configAddress);
    res.send('✅ Config file deleted. Restarting...');
    process.exit(1);
  }

  @Get('apps')
  async apps(@Res() res: Response) {
    const configAddress = `${process.cwd()}/config/config.${
      process.env.NODE_ENV ?? 'production'
    }.json`;
    if (existsSync(configAddress)) {
      const file = await readFile(configAddress, { encoding: 'utf-8' });
      const config = JSON.parse(file as string);
      initializeApp({
        credential: credential.cert(
          `${process.cwd()}/config/${config.firebaseProjectPrivateKey}`,
        ),
      });
      const apps = await projectManagement().listAppMetadata();
      const finalListOfApps = [];
      for (const app of apps) {
        if (app.platform === 'ANDROID') {
          const config = JSON.parse(
            await projectManagement().androidApp(app.appId).getConfig(),
          );
          finalListOfApps.push({
            packageName: config.client
              .filter((c: any) => c.client_info.mobilesdk_app_id == app.appId)
              .map(
                (c: any) => c.client_info.android_client_info.package_name,
              )[0],
          });
        }
      }
      res.send(finalListOfApps);
      return finalListOfApps;
    }
    res.status(404).send('Config file not found');
    return 'Config file not found';
  }

  @Post('twilio/voice')
  async handleTwilioVoiceWebhook(
    @Req() req: Request,
    @Body() body: TwilioVoiceWebhookParams,
    @Res() res: Response,
  ) {
    // Validate Twilio signature (security)

    const twilioSignature = req.headers['x-twilio-signature'] as string;
    this.logger.log('Received Twilio voice webhook');
    this.logger.debug(`Webhook headers: ${JSON.stringify(req.headers)}`);
    this.logger.debug(`Webhook body: ${JSON.stringify(body)}`);
    this.logger.debug(`Twilio Signature: ${twilioSignature}`);
    // Use x-forwarded-proto for correct protocol behind reverse proxy (Cloudflare/nginx)
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const url = `${protocol}://${req.get('host')}/admin-api${req.originalUrl}`;
    this.logger.debug(`Webhook URL: ${url}`);

    const isValid = await this.callMaskingService.validateWebhookSignature(
      twilioSignature || '',
      url,
      body as unknown as Record<string, string>,
    );

    if (!isValid) {
      this.logger.warn('Invalid Twilio signature received');
      res.status(403).send('Invalid signature');
      return;
    }

    // Route the call
    const result = await this.callMaskingService.routeCall(body.From);

    // Log for debugging
    this.logger.log(
      `Call routing: ${body.From} -> ${result.success ? 'SUCCESS' : result.error}`,
    );

    // Return TwiML response
    res.type('text/xml');
    res.send(result.twiml);
  }

  @Post('webhook/support_message_sent')
  async handleSupportMessageWebhook(
    @Body() body: ChatwootWebhookPayload,
    @Res() res: Response,
  ) {
    this.logger.log('Received support message webhook');
    this.logger.debug(`Webhook body: ${JSON.stringify(body)}`);

    const result = await this.supportWebhookService.handleSupportMessageSent(body);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  }

  @Get('.well-known/apple-app-site-association')
  @Header('Content-Type', 'application/json')
  getAppleAppSiteAssociation(): object {
    const teamId = process.env.APPLE_TEAM_ID;
    const riderBundleId =
      process.env.RIDER_BUNDLE_ID || 'com.bettersuite.bettertaxi.rider';
    const driverBundleId =
      process.env.DRIVER_BUNDLE_ID || 'com.bettersuite.bettertaxi.driver';

    const riderAppId = `${teamId}.${riderBundleId}`;
    const driverAppId = `${teamId}.${driverBundleId}`;

    return {
      applinks: {
        apps: [],
        details: [
          {
            appID: riderAppId,
            paths: ['*'],
          },
          {
            appID: driverAppId,
            paths: ['*'],
          },
        ],
      },
      webcredentials: {
        apps: [riderAppId, driverAppId],
      },
    };
  }

  @Get('.well-known/assetlinks.json')
  @Header('Content-Type', 'application/json')
  getAssetLinks(): object[] {
    const riderPackageName =
      process.env.RIDER_APPLICATION_ID || 'com.bettersuite.taxi.rider';
    const driverPackageName =
      process.env.DRIVER_APPLICATION_ID || 'com.bettersuite.taxi.driver';
    const riderSha256Fingerprint = process.env.RIDER_ANDROID_SHA256_FINGERPRINT;
    const driverSha256Fingerprint =
      process.env.DRIVER_ANDROID_SHA256_FINGERPRINT;

    const assets = [];

    if (riderSha256Fingerprint) {
      assets.push({
        relation: [
          'delegate_permission/common.handle_all_urls',
          'delegate_permission/common.get_login_creds',
        ],
        target: {
          namespace: 'android_app',
          package_name: riderPackageName,
          sha256_cert_fingerprints: [riderSha256Fingerprint],
        },
      });
    }

    if (driverSha256Fingerprint) {
      assets.push({
        relation: [
          'delegate_permission/common.handle_all_urls',
          'delegate_permission/common.get_login_creds',
        ],
        target: {
          namespace: 'android_app',
          package_name: driverPackageName,
          sha256_cert_fingerprints: [driverSha256Fingerprint],
        },
      });
    }

    return assets;
  }
}
