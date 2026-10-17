import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DriverEntity } from '@ridy/database';
import { ProviderTransactionEntity } from '@ridy/database';
import { CustomerEntity } from '@ridy/database';
import {
  Between,
  DataSource,
  FindManyOptions,
  In,
  Like,
  Repository,
} from 'typeorm';
import { ChartTimeframe } from './dto/chart-timeframe.enum.js';
import { IncomeResultItem } from './dto/income-result-item.dto';
import { RegistrationResultItemDto } from './dto/registration-result-item.dto';
import { RequestResultItem } from './dto/request-result-item.dto';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { json2csv } from 'json-2-csv';
import { RiderWalletEntity } from '@ridy/database';
import { DriverWalletEntity } from '@ridy/database';
import { ExportArgsDTO } from './dto/export.dto';
import { FleetWalletEntity } from '@ridy/database';
import { ShopWalletEntity } from '@ridy/database';
import { ProviderDeductTransactionType } from '@ridy/database';
import { TotalDailyPairDTO } from './dto/total-daily-pair.dto';
import { RiderTransactionEntity } from '@ridy/database';
import { DriverTransactionEntity } from '@ridy/database';
import { FleetTransactionEntity } from '@ridy/database';
import { ShopTransactionEntity } from '@ridy/database';
import { ProviderRechargeTransactionType } from '@ridy/database';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(ProviderTransactionEntity)
    private providerTransactionRepository: Repository<ProviderTransactionEntity>,
    @InjectRepository(RiderTransactionEntity)
    private riderTransactionRepository: Repository<RiderTransactionEntity>,
    @InjectRepository(DriverTransactionEntity)
    private driverTransactionRepository: Repository<DriverTransactionEntity>,
    @InjectRepository(FleetTransactionEntity)
    private fleetTransactionRepository: Repository<FleetTransactionEntity>,
    @InjectRepository(ShopTransactionEntity)
    private shopTransactionRepository: Repository<ShopTransactionEntity>,
    @InjectRepository(RiderWalletEntity)
    private riderWalletRepository: Repository<RiderWalletEntity>,
    @InjectRepository(DriverWalletEntity)
    private driverWalletRepository: Repository<DriverWalletEntity>,
    @InjectRepository(FleetWalletEntity)
    private fleetWalletRepository: Repository<FleetWalletEntity>,
    @InjectRepository(ShopWalletEntity)
    private shopWalletRepository: Repository<ShopWalletEntity>,
    @InjectRepository(CustomerEntity)
    private riderRepository: Repository<CustomerEntity>,
    @InjectRepository(DriverEntity)
    private driverRepository: Repository<DriverEntity>,
    private dataSource: DataSource,
  ) {}

  incomeChart(timeframe: ChartTimeframe): Promise<IncomeResultItem[]> {
    const v = this.getQueryVars(timeframe, 'transactionTime');
    return this.providerTransactionRepository.query(
      `SELECT currency, SUM(amount) AS sum, ${v.time} AS time FROM admin_transaction WHERE ${v.query} GROUP BY currency, time ORDER BY time`,
    );
  }

  requestsChart(timeframe: ChartTimeframe): Promise<RequestResultItem[]> {
    const v = this.getQueryVars(timeframe, 'requestTimestamp');
    return this.providerTransactionRepository.query(
      `SELECT COUNT(id) AS count, status, ${v.time} AS time FROM \`request\` WHERE ${v.query} GROUP BY time, status ORDER BY time`,
    );
  }

  driverRegistrations(
    timeframe: ChartTimeframe,
  ): Promise<RegistrationResultItemDto[]> {
    const v = this.getQueryVars(timeframe, 'registrationTimestamp');
    return this.driverRepository.query(
      `SELECT COUNT(id) AS count, ${v.time} AS time FROM driver WHERE ${v.query} GROUP BY time ORDER BY time`,
    );
  }

  riderRegistrations(
    timeframe: ChartTimeframe,
  ): Promise<RegistrationResultItemDto[]> {
    const v = this.getQueryVars(timeframe, 'registrationTimestamp');
    return this.riderRepository.query(
      `SELECT COUNT(id) AS count, ${v.time} AS time FROM rider WHERE ${v.query} GROUP BY time ORDER BY time`,
    );
  }

  // Buckets are computed in IST (UTC+05:30); stored timestamps are UTC.
  private getQueryVars(
    timeframe: ChartTimeframe,
    timeField: string,
  ): { time: string; query: string } {
    const local = `DATE_ADD(${timeField}, INTERVAL 330 MINUTE)`;
    const nowLocal = `DATE_ADD(UTC_TIMESTAMP(), INTERVAL 330 MINUTE)`;
    let bucket: string;
    let query: string;
    switch (timeframe) {
      case ChartTimeframe.Daily:
        bucket = `DATE_FORMAT(${local}, '%Y-%m-%d %H:00:00')`;
        query = `DATE(${local}) = DATE(${nowLocal})`;
        break;
      case ChartTimeframe.Weekly:
        bucket = `DATE_SUB(DATE(${local}), INTERVAL WEEKDAY(${local}) DAY)`;
        query = `${local} >= DATE(${nowLocal}) - INTERVAL 6 MONTH`;
        break;
      case ChartTimeframe.Yearly:
        bucket = `DATE_FORMAT(${local}, '%Y-%m-01')`;
        query = `${local} >= DATE(${nowLocal}) - INTERVAL 12 MONTH`;
        break;
      case ChartTimeframe.Monthly:
      default:
        bucket = `DATE(${local})`;
        query = `${local} >= DATE(${nowLocal}) - INTERVAL 2 MONTH`;
        break;
    }
    const time = `((TIMESTAMPDIFF(SECOND, '1970-01-01 00:00:00', ${bucket}) - 19800) * 1000)`;
    return { time, query };
  }

  async exportTable(input: ExportArgsDTO) {
    const options: FindManyOptions = {};
    if (input.filters) {
      for (const f of input.filters) {
        if (typeof f.value != 'string') continue;
        if (f.value.includes('^')) {
          const a = f.value.split('^');
          f.value = Between(a[0], a[1]) as any;
        } else if (f.value.startsWith('%') && f.value.endsWith('%')) {
          f.value = Like(f.value) as any;
        } else if (f.value.includes('|')) {
          const s = f.value.split('|');
          f.value = In(s) as any;
        }
      }
      options.where = input.filters.map((filter) => {
        const obj = {};
        obj[filter.field] = filter.value;
      });
    }
    if (input.sort) {
      const _sort = {};
      _sort[input.sort.property] = input.sort.direction;
      options.order = _sort;
    }
    if (input.relations != null) {
      options.relations = input.relations;
    }
    const result = (await this.dataSource
      .getRepository(`${input.table}Entity`)
      .find(options)) as any[];
    if (
      input.table == 'DriverWallet' &&
      process.env.DEMO_MODE?.toLowerCase() == 'true'
    ) {
      (result as DriverWalletEntity[]).forEach((x) => {
        const length = x.driver.mobileNumber.length;
        x.driver.mobileNumber = `${x.driver.mobileNumber
          .toString()
          .substring(0, length - 3)}xxxx`;
        x.driver.email = 'Confidential';
      });
    }
    if (
      input.table == 'RiderWallet' &&
      process.env.DEMO_MODE?.toLowerCase() == 'true'
    ) {
      (result as RiderWalletEntity[]).forEach((x) => {
        const length = x.rider.mobileNumber.length;
        x.rider.mobileNumber = `${x.rider.mobileNumber
          .toString()
          .substring(0, length - 3)}xxxx`;
        x.rider.email = 'Confidential';
      });
    }
    if (input.type == 'csv') {
      const str = await json2csv(result);
      const fileName = `${new Date().getTime().toString()}.csv`;
      await writeFile(
        join(
          process.cwd(),
          'uploads',
          `${new Date().getTime().toString()}.csv`,
        ),
        str,
      );
      return {
        url: `uploads/${fileName}`,
      };
    }
    return undefined;
  }

  async totalRevenue(input: { currency: string }): Promise<TotalDailyPairDTO> {
    const total = await this.providerTransactionRepository.sum('amount', {
      currency: input.currency,
      rechargeType: In([ProviderRechargeTransactionType.Commission]),
    });
    const todayRevenue = await this.providerTransactionRepository.sum(
      'amount',
      {
        currency: input.currency,
        rechargeType: In([ProviderRechargeTransactionType.Commission]),
        createdAt: Between(
          new Date(new Date().setHours(0, 0, 0, 0)),
          new Date(new Date().setHours(23, 59, 59, 999)),
        ),
      },
    );
    return {
      total: total ?? 0,
      daily: todayRevenue ?? 0,
    };
  }

  async totaloutstandingUserBalances(input: {
    currency: string;
  }): Promise<TotalDailyPairDTO> {
    const sumRiderWalletoutstandingUserBalances = (
      await this.riderWalletRepository
        .createQueryBuilder()
        .select('SUM(amount)', 'balance')
        .where('currency = :currency', { currency: input.currency })
        .getRawOne()
    )?.balance;

    const sumDriverWalletoutstandingUserBalances = (
      await this.driverWalletRepository
        .createQueryBuilder()
        .select('SUM(amount)', 'balance')
        .where('currency = :currency', { currency: input.currency })
        .getRawOne()
    ).balance;
    const sumFleetWalletoutstandingUserBalances = (
      await this.fleetWalletRepository
        .createQueryBuilder()
        .select('SUM(amount)', 'balance')
        .where('currency = :currency', { currency: input.currency })
        .getRawOne()
    ).balance;
    const sumShopWalletoutstandingUserBalances =
      await this.shopWalletRepository.sum('balance', {
        currency: input.currency,
      });
    const total =
      (sumRiderWalletoutstandingUserBalances ?? 0) +
      (sumDriverWalletoutstandingUserBalances ?? 0) +
      (sumFleetWalletoutstandingUserBalances ?? 0) +
      (sumShopWalletoutstandingUserBalances ?? 0);
    const riderToday = await this.riderTransactionRepository.sum('amount', {
      currency: input.currency,
      createdAt: Between(
        new Date(new Date().setHours(0, 0, 0, 0)),
        new Date(new Date().setHours(23, 59, 59, 999)),
      ),
    });
    const driverToday = await this.driverTransactionRepository.sum('amount', {
      currency: input.currency,
      createdAt: Between(
        new Date(new Date().setHours(0, 0, 0, 0)),
        new Date(new Date().setHours(23, 59, 59, 999)),
      ),
    });
    const fleetToday = await this.fleetTransactionRepository.sum('amount', {
      currency: input.currency,
      transactionTimestamp: Between(
        new Date(new Date().setHours(0, 0, 0, 0)),
        new Date(new Date().setHours(23, 59, 59, 999)),
      ),
    });
    const shopToday = await this.shopTransactionRepository.sum('amount', {
      currency: input.currency,
      createdAt: Between(
        new Date(new Date().setHours(0, 0, 0, 0)),
        new Date(new Date().setHours(23, 59, 59, 999)),
      ),
    });
    const daily =
      (riderToday ?? 0) +
      (driverToday ?? 0) +
      (fleetToday ?? 0) +
      (shopToday ?? 0);
    return {
      total: total ?? 0,
      daily: daily ?? 0,
    };
  }

  async totalExpenses(input: { currency: string }): Promise<TotalDailyPairDTO> {
    const totalExpenses = await this.providerTransactionRepository.sum(
      'amount',
      {
        currency: input.currency,
        deductType: ProviderDeductTransactionType.Expense,
      },
    );
    const todayExpenses = await this.providerTransactionRepository.sum(
      'amount',
      {
        currency: input.currency,
        deductType: ProviderDeductTransactionType.Expense,
        createdAt: Between(
          new Date(new Date().setHours(0, 0, 0, 0)),
          new Date(new Date().setHours(23, 59, 59, 999)),
        ),
      },
    );
    return {
      total: totalExpenses ?? 0,
      daily: todayExpenses ?? 0,
    };
  }
}
