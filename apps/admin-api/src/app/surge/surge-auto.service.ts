import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurgeSettingEntity, SurgeZoneEntity } from '@ridy/database';
import { SurgeZoneService } from './surge-zone.service';

const RAIN_MM = 0.3;

@Injectable()
export class SurgeAutoService {
  private readonly logger = new Logger(SurgeAutoService.name);

  constructor(
    @InjectRepository(SurgeZoneEntity)
    private readonly zoneRepo: Repository<SurgeZoneEntity>,
    @InjectRepository(SurgeSettingEntity)
    private readonly settingRepo: Repository<SurgeSettingEntity>,
    private readonly zoneService: SurgeZoneService,
  ) {}

  private center(zone: SurgeZoneEntity) {
    const ring = zone.area?.[0] ?? [];
    const n = ring.length || 1;
    return {
      lat: ring.reduce((s, p) => s + p.lat, 0) / n,
      lng: ring.reduce((s, p) => s + p.lng, 0) / n,
    };
  }

  private async rainMm(lat: number, lng: number): Promise<number | null> {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&current=precipitation`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) return null;
      const data: any = await res.json();
      return Number(data?.current?.precipitation ?? 0);
    } catch (e) {
      this.logger.warn(`weather fetch failed: ${(e as Error).message}`);
      return null;
    }
  }

  @Cron('0 */10 * * * *')
  async checkRain() {
    const [setting] = await this.settingRepo.find({ take: 1 });
    if (!setting?.isEnabled || !setting?.autoSurgeEnabled) return;
    const zones = await this.zoneRepo.find({ where: { status: 'Auto', type: 'Rain', autoCreated: false } });
    for (const zone of zones) {
      const { lat, lng } = this.center(zone);
      const mm = await this.rainMm(lat, lng);
      if (mm === null) continue;
      const live = mm >= RAIN_MM;
      this.logger.log(`Zone ${zone.id} (${zone.name}) rain=${mm}mm live=${live}`);
      if (live === zone.autoLive) continue;
      this.logger.warn(`SURGE-CHANGE: ${zone.name} -> ${live ? 'ON' : 'OFF'}`);
      zone.autoLive = live;
      zone.autoReason = live ? `Rain ${mm}mm` : null;
      await this.zoneRepo.save(zone);
      if (live) await this.zoneService.notifyDrivers(zone);
    }
  }
  @Cron('0 */2 * * * *')
  async checkPeak() {
    const [setting] = await this.settingRepo.find({ take: 1 });
    if (!setting?.isEnabled || !setting?.autoSurgeEnabled) return;
    const ratio = Number(setting.autoDemandRatio ?? 3);
    const windowMin = Number(setting.autoWindowMinutes ?? 15);
    const zones = await this.zoneRepo.find({ where: { status: 'Auto', type: 'Peak', autoCreated: false } });
    for (const zone of zones) {
      const { requests, drivers } = await this.zoneService.zoneDemand(zone, windowMin);
      const live = requests >= ratio && requests / Math.max(drivers, 1) >= ratio;
      this.logger.log(`Zone ${zone.id} (${zone.name}) peak req=${requests} drv=${drivers} live=${live}`);
      if (live === zone.autoLive) continue;
      this.logger.warn(`SURGE-CHANGE: ${zone.name} -> ${live ? 'ON' : 'OFF'}`);
      zone.autoLive = live;
      zone.autoReason = live ? `Peak ${requests} req / ${drivers} drv` : null;
      await this.zoneRepo.save(zone);
      if (live) await this.zoneService.notifyDrivers(zone);
    }
  }
  @Cron('0 * * * * *')
  async checkFestival() {
    const [setting] = await this.settingRepo.find({ take: 1 });
    if (!setting?.isEnabled || !setting?.autoSurgeEnabled) return;
    const today = new Date(Date.now() + 330 * 60000).toISOString().substring(0, 10);
    const zones = await this.zoneRepo.find({ where: { status: 'Auto', type: 'Festival', autoCreated: false } });
    for (const zone of zones) {
      const inDates =
        (!zone.startDate || today >= zone.startDate) && (!zone.endDate || today <= zone.endDate);
      const live = inDates && this.zoneService.withinWindow(zone);
      if (live === zone.autoLive) continue;
      this.logger.warn(`SURGE-CHANGE: ${zone.name} -> ${live ? 'ON' : 'OFF'}`);
      zone.autoLive = live;
      zone.autoReason = live ? `Festival ${zone.startDate ?? ''}${zone.endDate ? ' to ' + zone.endDate : ''}` : null;
      await this.zoneRepo.save(zone);
      this.logger.log(`Zone ${zone.id} (${zone.name}) festival live=${live}`);
      if (live) await this.zoneService.notifyDrivers(zone);
    }
  }
}
