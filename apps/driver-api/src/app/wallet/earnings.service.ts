import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TaxiOrderEntity } from '@ridy/database';
import { Repository } from 'typeorm';
import { Datapoint, StatisticsResult, TimeQuery } from './dto/earnings.dto';

@Injectable()
export class EarningsService {
  constructor(
    @InjectRepository(TaxiOrderEntity)
    private requestRepository: Repository<TaxiOrderEntity>,
  ) {}

  async getStats(
    driverId: number,
    timeFrame: TimeQuery,
  ): Promise<StatisticsResult> {
    const q: Array<any> = await this.requestRepository.query(
      'SELECT currency, COUNT(currency) as count from request where driverId = ? group by currency order by count desc LIMIT 1',
      [driverId],
    );
    if (q.length < 1) {
      return {
        currency: 'USD',
        sumOfCurrentPeriod: 0,
        dataset: [],
      };
    }
    const mostUsedCurrency: string = q[0].currency;
    let dataset: Datapoint[];
    const fields =
      'SUM(costBest - providerShare) AS earning, COUNT(id) AS count, SUM(distanceBest) AS distance, SUM(durationBest) AS time';
    switch (timeFrame) {
      case TimeQuery.Daily:
        dataset = await this.requestRepository.query(
          `SELECT ANY_VALUE(DATE_FORMAT(requestTimestamp, '%W')) as name, CONCAT(ANY_VALUE(MONTH(CURRENT_TIMESTAMP)),'/',ANY_VALUE(DAY(CURRENT_TIMESTAMP))) AS current, ${fields} from request WHERE DATEDIFF(NOW(),requestTimestamp) < 7 AND driverId = ? AND currency = ? GROUP BY DATE(requestTimestamp)`,
          [driverId, mostUsedCurrency],
        );
        break;
      case TimeQuery.Weekly:
        dataset = await this.requestRepository.query(
          `SELECT CONCAT(ANY_VALUE(YEAR(requestTimestamp)),',W',ANY_VALUE(WEEK(requestTimestamp))) AS name, CONCAT(ANY_VALUE(YEAR(CURRENT_TIMESTAMP)),',W',ANY_VALUE(WEEK(CURRENT_TIMESTAMP))) AS current, ${fields} FROM request WHERE driverId = ? AND currency = ? GROUP BY YEAR(requestTimestamp), WEEK(requestTimestamp)`,
          [driverId, mostUsedCurrency],
        );
        break;

      case TimeQuery.Monthly:
        dataset = await this.requestRepository.query(
          `SELECT CONCAT(ANY_VALUE(YEAR(requestTimestamp)),'/',ANY_VALUE(MONTH(requestTimestamp))) AS name, CONCAT(ANY_VALUE(YEAR(CURRENT_TIMESTAMP)),'/',ANY_VALUE(MONTH(CURRENT_TIMESTAMP))) AS current, ${fields} FROM request WHERE DATE(requestTimestamp) > DATE(MAKEDATE(year(now()),1)) AND driverId = ? AND currency = ? GROUP BY YEAR(requestTimestamp), MONTH(requestTimestamp)`,
          [driverId, mostUsedCurrency],
        );
        break;
    }
    return {
      currency: mostUsedCurrency,
      sumOfCurrentPeriod: dataset.reduce((sum, item) => sum + item.earning, 0),
      dataset: dataset,
    };
  }

  async getStatsNew(input: {
    driverId: number;
    timeFrame: TimeQuery;
    startDate: Date;
    endDate: Date;
  }): Promise<StatisticsResult> {
    const q: Array<any> = await this.requestRepository.query(
      'SELECT currency, COUNT(currency) as count from request where driverId = ? group by currency order by count desc LIMIT 1',
      [input.driverId],
    );
    if (q.length < 1) {
      return {
        currency: 'USD',
        sumOfCurrentPeriod: 0,
        dataset: [],
      };
    }
    const mostUsedCurrency: string = q[0].currency;

    // Calculate sum of current period
    const sumQuery: Array<any> = await this.requestRepository.query(
      'SELECT SUM(costBest - providerShare) AS totalEarning FROM request WHERE DATE(requestTimestamp) >= DATE(?) AND DATE(requestTimestamp) <= DATE(?) AND driverId = ? AND currency = ?',
      [input.startDate, input.endDate, input.driverId, mostUsedCurrency],
    );
    const sumOfCurrentPeriod = sumQuery[0]?.totalEarning || 0;

    let dataset: Datapoint[];

    switch (input.timeFrame) {
      case TimeQuery.Daily:
        // Group by 3-hour blocks: 6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM (all time slots included)
        dataset = await this.requestRepository.query(
          `SELECT 
            time_slots.name,
            DATE_FORMAT(CURRENT_TIMESTAMP, '%d %b %y') AS current,
            COALESCE(SUM(r.costBest - r.providerShare), 0) AS earning,
            COALESCE(COUNT(r.id), 0) AS count,
            COALESCE(SUM(r.distanceBest), 0) AS distance,
            COALESCE(SUM(r.durationBest), 0) AS time
          FROM (
            SELECT '6 AM' AS name, 1 AS sort_order
            UNION SELECT '9 AM', 2
            UNION SELECT '12 PM', 3
            UNION SELECT '3 PM', 4
            UNION SELECT '6 PM', 5
            UNION SELECT '9 PM', 6
          ) AS time_slots
          LEFT JOIN request r ON (
            CASE 
              WHEN HOUR(r.requestTimestamp) >= 6 AND HOUR(r.requestTimestamp) < 9 THEN '6 AM'
              WHEN HOUR(r.requestTimestamp) >= 9 AND HOUR(r.requestTimestamp) < 12 THEN '9 AM'
              WHEN HOUR(r.requestTimestamp) >= 12 AND HOUR(r.requestTimestamp) < 15 THEN '12 PM'
              WHEN HOUR(r.requestTimestamp) >= 15 AND HOUR(r.requestTimestamp) < 18 THEN '3 PM'
              WHEN HOUR(r.requestTimestamp) >= 18 AND HOUR(r.requestTimestamp) < 21 THEN '6 PM'
              ELSE '9 PM'
            END = time_slots.name
            AND DATE(r.requestTimestamp) >= DATE(?)
            AND DATE(r.requestTimestamp) <= DATE(?)
            AND r.driverId = ?
            AND r.currency = ?
          )
          GROUP BY time_slots.name, time_slots.sort_order
          ORDER BY time_slots.sort_order`,
          [input.startDate, input.endDate, input.driverId, mostUsedCurrency],
        );
        break;

      case TimeQuery.Weekly:
        // Show all days of the week in the date range
        dataset = await this.requestRepository.query(
          `SELECT 
            DATE_FORMAT(all_dates.date, '%a') AS name,
            DATE_FORMAT(CURRENT_TIMESTAMP, '%d %b %y') AS current,
            COALESCE(SUM(r.costBest - r.providerShare), 0) AS earning,
            COALESCE(COUNT(r.id), 0) AS count,
            COALESCE(SUM(r.distanceBest), 0) AS distance,
            COALESCE(SUM(r.durationBest), 0) AS time
          FROM (
            SELECT DATE(?) + INTERVAL (a.a + (10 * b.a)) DAY AS date
            FROM (SELECT 0 AS a UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) AS a
            CROSS JOIN (SELECT 0 AS a UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) AS b
          ) AS all_dates
          LEFT JOIN request r ON (
            DATE(r.requestTimestamp) = all_dates.date
            AND r.driverId = ?
            AND r.currency = ?
          )
          WHERE all_dates.date >= DATE(?) AND all_dates.date <= DATE(?)
          GROUP BY all_dates.date
          ORDER BY all_dates.date`,
          [
            input.startDate,
            input.driverId,
            mostUsedCurrency,
            input.startDate,
            input.endDate,
          ],
        );
        break;

      case TimeQuery.Monthly:
        // Show all weeks in the month
        dataset = await this.requestRepository.query(
          `SELECT 
            CONCAT('Week ', week_numbers.week_num) AS name,
            CONCAT(DATE_FORMAT(DATE(CONCAT(YEAR(CURRENT_TIMESTAMP), '-', MONTH(CURRENT_TIMESTAMP), '-01')), '%d %b %y'), ' - ', DATE_FORMAT(LAST_DAY(CURRENT_TIMESTAMP), '%d %b %y')) AS current,
            COALESCE(SUM(r.costBest - r.providerShare), 0) AS earning,
            COALESCE(COUNT(r.id), 0) AS count,
            COALESCE(SUM(r.distanceBest), 0) AS distance,
            COALESCE(SUM(r.durationBest), 0) AS time
          FROM (
            SELECT 1 AS week_num
            UNION SELECT 2
            UNION SELECT 3
            UNION SELECT 4
            UNION SELECT 5
            UNION SELECT 6
          ) AS week_numbers
          LEFT JOIN request r ON (
            WEEK(DATE(r.requestTimestamp), 3) - WEEK(DATE_FORMAT(DATE(r.requestTimestamp), '%Y-%m-01'), 3) + 1 = week_numbers.week_num
            AND DATE(r.requestTimestamp) >= DATE(?)
            AND DATE(r.requestTimestamp) <= DATE(?)
            AND r.driverId = ?
            AND r.currency = ?
          )
          GROUP BY week_numbers.week_num
          ORDER BY week_numbers.week_num`,
          [input.startDate, input.endDate, input.driverId, mostUsedCurrency],
        );
        break;
    }

    return {
      currency: mostUsedCurrency,
      sumOfCurrentPeriod: sumOfCurrentPeriod,
      dataset: dataset,
    };
  }
}
