import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import { Logger } from '@nestjs/common';

export async function loadSecrets(): Promise<void> {
  const logger = new Logger('SecretsLoader');

  if (process.env.USE_AWS_SECRETS_MANAGER !== 'true') {
    logger.log('AWS Secrets Manager disabled, using environment variables');
    return;
  }

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
      : undefined, // Falls back to IAM role
  });

  const secretName = process.env.AWS_SECRET_NAME;
  if (!secretName) {
    logger.warn('AWS_SECRET_NAME not set, skipping secrets loading');
    return;
  }

  logger.log(`Loading secrets from: ${secretName}`);
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);
  const secrets = JSON.parse(response.SecretString!);

  // Inject all secret keys directly into process.env (only if not already set)
  for (const [key, value] of Object.entries(secrets)) {
    if (!process.env[key]) {
      process.env[key] = String(value);
    }
  }

  logger.log(`Loaded ${Object.keys(secrets).length} secrets`);
}
