import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { RegionEntity, SurgeSettingEntity, SurgeZoneEntity, TaxiOrderEntity } from '@ridy/database';
import { SurgeZoneService } from './surge-zone.service';

type P = { lat: number; lng: number };
type Cell = { ix: number; iy: number; req: number; drv: number; center: P; ring: P[] };

@Injectable()
export class SurgeGridService {
  private readonly logger = new Logger(SurgeGridService.name);
  private running = false;

  constructor(
    @InjectRepository(SurgeZoneEntity) private readonly zoneRepo: Repository<SurgeZoneEntity>,
    @InjectRepository(SurgeSettingEntity) private readonly settingRepo: Repository<SurgeSettingEntity>,
    @InjectRepository(RegionEntity) private readonly regionRepo: Repository<RegionEntity>,
    private readonly zoneService: SurgeZoneService,
  ) {}

  private inRing(p: P, ring: P[]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i].lng, yi = ring[i].lat, xj = ring[j].lng, yj = ring[j].lat;
      if (yi > p.lat !== yj > p.lat && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  private async rainBatch(points: P[]): Promise<number[]> {
    const out = points.map(() => 0);
    for (let i = 0; i < points.length; i += 100) {
      const chunk = points.slice(i, i + 100);
      try {
        const lat = chunk.map((p) => p.lat.toFixed(3)).join(',');
        const lng = chunk.map((p) => p.lng.toFixed(3)).join(',');
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=precipitation`,
          { signal: AbortSignal.timeout(10000) },
        );
        if (!res.ok) continue;
        const data: any = await res.json();
        const arr = Array.isArray(data) ? data : [data];
        arr.forEach((d: any, j: number) => (out[i + j] = Number(d?.current?.precipitation ?? 0)));
      } catch (e) {
        this.logger.warn(`rain batch failed: ${(e as Error).message}`);
      }
    }
    return out;
  }

  @Cron('0 */5 * * * *')
  async run() {
    if (this.running) return;
    this.running = true;
    try {
      const [s] = await this.settingRepo.find({ take: 1 });
      const existing = await this.zoneRepo.find({ where: { autoCreated: true } });
      if (!s?.isEnabled || !s?.gridEnabled) {
        if (existing.length) await this.zoneRepo.remove(existing);
        return;
      }
      const since = new Date(Date.now() - Number(s.autoWindowMinutes ?? 15) * 60000);
      const orders = await this.zoneRepo.manager.getRepository(TaxiOrderEntity).find({
        where: { createdOn: MoreThanOrEqual(since) },
        select: ['id', 'points'],
      });
      const pickups = orders.map((o) => o.points?.[0]).filter((p): p is P => !!p);
      const regions = await this.regionRepo.find({ where: { enabled: true } });
      const size = Number(s.gridSizeMeters ?? 2000);
      const keep = new Set<number>();

      for (const region of regions) {
        const ring = region.location?.[0];
        if (!ring || ring.length < 3) continue;
        const lats = ring.map((p) => p.lat), lngs = ring.map((p) => p.lng);
        const minLat = Math.min(...lats), maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
        const midLat = (minLat + maxLat) / 2;
        const dLat = size / 111320;
        const dLng = size / (111320 * Math.cos((midLat * Math.PI) / 180));
        const cells = new Map<string, Cell>();
        const cellOf = (p: P): Cell | null => {
          if (!this.inRing(p, ring)) return null;
          const ix = Math.floor((p.lng - minLng) / dLng);
          const iy = Math.floor((p.lat - minLat) / dLat);
          const key = `${ix}-${iy}`;
          let c = cells.get(key);
          if (!c) {
            const a = minLat + iy * dLat, b = minLng + ix * dLng;
            c = {
              ix, iy, req: 0, drv: 0,
              center: { lat: a + dLat / 2, lng: b + dLng / 2 },
              ring: [
                { lat: a, lng: b }, { lat: a, lng: b + dLng }, { lat: a + dLat, lng: b + dLng },
                { lat: a + dLat, lng: b }, { lat: a, lng: b },
              ],
            };
            cells.set(key, c);
          }
          return c;
        };
        for (const p of pickups) { const c = cellOf(p); if (c) c.req++; }
        const online = await this.zoneService.getOnlineDrivers({ lat: midLat, lng: (minLng + maxLng) / 2 });
        for (const d of online) { if (d?.location) { const c = cellOf(d.location); if (c) c.drv++; } }

        const list = [...cells.values()];
        const rain = await this.rainBatch(list.map((c) => c.center));
        this.logger.log(`${region.name}: pickups=${pickups.length} online=${online.length} cells=${list.length} maxRain=${Math.max(0, ...rain)}mm`);
        for (let i = 0; i < list.length; i++) {
          const c = list[i];
          const ratio = c.req / Math.max(c.drv, 1);
          let pct = 0;
          if (c.req >= s.tierLowRatio) {
            if (ratio >= s.tierHighRatio) pct = s.tierHighPercent;
            else if (ratio >= s.tierMidRatio) pct = s.tierMidPercent;
            else if (ratio >= s.tierLowRatio) pct = s.tierLowPercent;
          }
          const raining = rain[i] >= 0.3;
          if (raining) pct += Number(s.rainExtraPercent ?? 0);
          pct = Math.min(pct, Number(s.maxSurgePercent ?? 50));
          if (pct <= 0) continue;

          const name = `${region.name} · Grid ${c.ix}-${c.iy}`;
          const reason = `${raining ? `Rain ${rain[i]}mm · ` : ''}${c.req} req / ${c.drv} drv`;
          let z = existing.find((e) => e.regionId === region.id && e.name === name);
          const isNew = !z;
          if (!z) z = this.zoneRepo.create({ name, autoCreated: true, regionId: region.id, area: [c.ring], status: 'Auto' });
          z.type = raining ? 'Rain' : 'Peak';
          z.surgePercent = pct;
          z.surgeFlat = null;
          z.autoLive = true;
          z.autoReason = reason;
          z = await this.zoneRepo.save(z);
          keep.add(z.id);
          this.logger.log(`${name}: +${pct}% (${reason})`);
          if (isNew) await this.zoneService.notifyDrivers(z);
        }
      }
      const stale = existing.filter((e) => !keep.has(e.id));
      if (stale.length) {
        await this.zoneRepo.remove(stale);
        this.logger.log(`removed ${stale.length} calm grid zone(s)`);
      }
    } catch (e) {
      this.logger.error(`grid run failed: ${(e as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
