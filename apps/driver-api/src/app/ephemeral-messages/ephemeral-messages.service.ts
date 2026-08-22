import { Injectable } from '@nestjs/common';
import { EphemeralMessageDTO } from './dtos/ephemeral-message.dto';
import { DriverRedisService } from '@ridy/database';

@Injectable()
export class EphemeralMessagesService {
  constructor(private driverRedisService: DriverRedisService) {}

  async getEphemeralMessage(driverId: number): Promise<EphemeralMessageDTO[]> {
    const messages = await this.driverRedisService.getEphemeralMessages(
      driverId.toString(),
      false,
    );
    return Promise.all(
      messages.map(async (message) => {
        const result: EphemeralMessageDTO = {
          messageId: message.messageId,
          orderId: message.orderId,
          type: message.type,
          riderFullName: message?.riderFullName ?? null,
          riderProfileUrl: message?.riderProfileUrl ?? null,
          createdAt: message.createdAt,
          expiresAt: message.expiresAt,
          serviceName: message?.serviceName ?? null,
          serviceImageUrl: message?.serviceImageUrl ?? null,
        };
        return result;
      }),
    );
  }

  markEphemeralMessagesAsRead(driverId: number, messageId: string) {
    this.driverRedisService.deleteEphemeralMessageForDriver(
      driverId.toString(),
      messageId,
    );
  }
}
