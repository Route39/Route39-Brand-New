import { Repository } from 'typeorm';
import { DriverEntity } from '../entities/taxi/driver.entity';

const CITY_PREFIX_MAP: Record<string, string> = {
  Bangalore: 'BLR',
  Tiruppur: 'TUP',
  Coimbatore: 'CBE',
  Chennai: 'CHN',
};

export function getCityPrefix(city?: string | null): string | undefined {
  if (!city) return undefined;
  return CITY_PREFIX_MAP[city];
}

export async function generateDriverCode(
  driverRepository: Repository<DriverEntity>,
  city: string,
): Promise<string | undefined> {
  const prefix = getCityPrefix(city);
  if (!prefix) return undefined;

  const lastDriver = await driverRepository
    .createQueryBuilder('driver')
    .where('driver.driverCode LIKE :pattern', { pattern: `${prefix}%` })
    .orderBy('driver.driverCode', 'DESC')
    .getOne();

  let nextNumber = 1;
  if (lastDriver?.driverCode) {
    const numPart = lastDriver.driverCode.slice(prefix.length);
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed)) nextNumber = parsed + 1;
  }

  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}
