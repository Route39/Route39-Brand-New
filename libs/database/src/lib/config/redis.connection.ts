import { Logger } from '@nestjs/common';

const logger = new Logger('RedisConnection');

export const getRedisUrl = (): string => {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;
  const redisPass = process.env.REDIS_PASS || process.env.REDIS_PASSWORD;

  logger.log(
    `Redis config: REDIS_URL=${redisUrl ? '[SET]' : '[NOT SET]'}, REDIS_HOST=${redisHost || '[NOT SET]'}, REDIS_PORT=${redisPort || '[NOT SET]'}`,
  );

  // Prefer REDIS_URL if set
  if (redisUrl) {
    logger.log(`Using REDIS_URL`);
    return redisUrl;
  }

  // Fall back to constructing URL from individual vars
  const host = redisHost || 'localhost';
  const port = redisPort || '6379';
  const url = redisPass
    ? `redis://:${redisPass}@${host}:${port}`
    : `redis://${host}:${port}`;

  logger.log(`Constructed Redis URL from individual vars: ${host}:${port}`);
  return url;
};

export const redisConnection = () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASS || process.env.REDIS_PASSWORD || undefined,
});

/**
 * Returns Redis connection config for BullMQ (host/port/password object).
 * Parses REDIS_URL if set, otherwise falls back to individual env vars.
 */
export const getRedisConnectionConfig = (): {
  host: string;
  port: number;
  password?: string;
} => {
  const redisUrl = process.env.REDIS_URL;

  // If REDIS_URL is set, parse it
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      const config = {
        host: url.hostname || 'localhost',
        port: parseInt(url.port) || 6379,
        password: url.password || undefined,
      };
      logger.log(
        `BullMQ using parsed REDIS_URL: ${config.host}:${config.port}`,
      );
      return config;
    } catch (e) {
      logger.warn(`Failed to parse REDIS_URL, falling back to individual vars`);
    }
  }

  // Fall back to individual vars
  const config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password:
      process.env.REDIS_PASS || process.env.REDIS_PASSWORD || undefined,
  };
  logger.log(
    `BullMQ using individual vars: ${config.host}:${config.port}`,
  );
  return config;
};
