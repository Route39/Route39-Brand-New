import { UseGuards } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxiOrderEntity } from '@ridy/database';
import { DriverEntity } from '@ridy/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DriverDTO } from '../driver/dto/driver.dto';
import { ProviderTransactionDTO } from './dto/provider-transaction.dto';

@Resolver(() => ProviderTransactionDTO)
@UseGuards(JwtAuthGuard)
export class ProviderTransactionDriverResolver {
  constructor(
    @InjectRepository(TaxiOrderEntity)
    private orderRepository: Repository<TaxiOrderEntity>,
  ) {}

  @ResolveField(() => DriverDTO, { nullable: true })
  async driver(
    @Parent() transaction: ProviderTransactionDTO,
  ): Promise<DriverEntity | null> {
    const orderId =
      transaction.taxiOrderId ?? (transaction as any).requestId ?? null;
    if (!orderId) return null;
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { driver: true },
    });
    return order?.driver ?? null;
  }
}