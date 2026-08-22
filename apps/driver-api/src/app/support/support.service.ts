import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SupportService {
  getChatwootIdentifierHash(identifier: string): string | null {
    const hmacToken = process.env.CHATWOOT_HMAC_TOKEN;
    if (!hmacToken) {
      return null;
    }
    return crypto.createHmac('sha256', hmacToken).update(identifier).digest('hex');
  }
}
