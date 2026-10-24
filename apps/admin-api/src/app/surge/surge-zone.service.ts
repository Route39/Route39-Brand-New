import { Injectable, Logger, Optional } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, Repository } from 'typeorm';
import { QueryService, UpdateOneOptions } from '@ptc-org/nestjs-query-core';
import { TypeOrmQueryService } from '@ptc-org/nestjs-query-typeorm';
import {
  DriverEntity,
  DriverNotificationService,
  DriverRedisService,
  Point,
  SurgeSettingEntity,
  SurgeZoneEntity,
} from '@ridy/database';

const TYPE_ICONS: Record<string, string> = {
  Peak: '🔥',
  Rain: '🌧️',
  Festival: '🎉',
  Night: '🌙',
  Event: '📍',
};

@Injectable()
@QueryService(SurgeZoneEntity)
export class SurgeZoneService extends TypeOrmQueryService<SurgeZoneEntity> {
  constructor(
    @InjectRepository(SurgeZoneEntity) repo: Repository<SurgeZoneEntity>,
    @Optional() private readonly driverRedis?: DriverRedisService,
    private readonly moduleRef: ModuleRef,
  ) {
    super(repo);
  }

  override async createOne(record: DeepPartial<SurgeZoneEntity>): Promise<SurgeZoneEntity> {
    const created = await super.createOne(record);
    if (created.status === 'Active') {
      void this.notifyDrivers(created);
    }
    return created;
  }

  override async updateOne(
    id: string | number,
    update: DeepPartial<SurgeZoneEntity>,
    opts?: UpdateOneOptions<SurgeZoneEntity>,
  ): Promise<SurgeZoneEntity> {
    const before = await this.repo.findOne({ where: { id: Number(id) } });
    const updated = await super.updateOne(id, update, opts);
    // Notify only when the zone turns ON (Off/Auto -> Active), not on every edit
    if (updated.status === 'Active' && before?.status !== 'Active') {
      void this.notifyDrivers(updated);
    }
    return updated;
  }

  private istHHmm(): string {
    return new Date(Date.now() + 330 * 60000).toISOString().substring(11, 16);
  }

  withinWindow(zone: SurgeZoneEntity): boolean {
    const { startTime, endTime } = zone;
    if (!startTime || !endTime) return true;
    const now = this.istHHmm();
    return startTime <= endTime
      ? now >= startTime && now < endTime
      : now >= startTime || now < endTime;
  }

  private fmtTime(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
  }

  // kept for future "only inside zone" option
  private inRing(p: Point, ring: Point[]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i].lng, yi = ring[i].lat;
      const xj = ring[j].lng, yj = ring[j].lat;
      const crosses =
        yi > p.lat !== yj > p.lat &&
        p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi;
      if (crosses) inside = !inside;
    }
    return inside;
  }

  async getOnlineDrivers(center: Point): Promise<any[]> {
    if (!this.driverRedis) return [];
    return this.driverRedis.getAllOnline(center, 1000);
  }

  async zoneDemand(zone: SurgeZoneEntity, windowMin: number): Promise<{ requests: number; drivers: number }> {
    const ring = zone.area?.[0] ?? [];
    const rows: any[] = await this.repo.query(
      'SELECT COUNT(*) AS c FROM request r JOIN surge_zone z ON z.id = ? WHERE r.requestTimestamp >= NOW() - INTERVAL ? MINUTE AND ST_Within(ST_GeometryN(r.points, 1), z.area)',
      [zone.id, windowMin],
    );
    const requests = Number(rows?.[0]?.c ?? 0);
    let drivers = 0;
    if (this.driverRedis && ring.length >= 3) {
      const center: Point = {
        lat: ring.reduce((t, p) => t + p.lat, 0) / ring.length,
        lng: ring.reduce((t, p) => t + p.lng, 0) / ring.length,
      };
      const online = await this.driverRedis.getAllOnline(center, 1000);
      drivers = online.filter((d) => d.location && this.inRing(d.location, ring)).length;
    }
    return { requests, drivers };
  }

  async notifyDrivers(zone: SurgeZoneEntity): Promise<void> {
    try {
      let driverNotification: DriverNotificationService | undefined;
      try {
        driverNotification = this.moduleRef.get(DriverNotificationService, { strict: false });
      } catch {
        driverNotification = undefined;
      }
      if (!this.driverRedis || !driverNotification) {
        Logger.warn(
          'DriverRedisService / DriverNotificationService not available in admin-api, surge notification skipped',
          'SurgeZoneService',
        );
        return;
      }
      if (!this.withinWindow(zone)) {
        Logger.log(
          `Zone ${zone.id} is Active but outside its time window, notification skipped`,
          'SurgeZoneService',
        );
        return;
      }
      const settings = (
        await this.repo.manager.getRepository(SurgeSettingEntity).find({ order: { id: 'ASC' }, take: 1 })
      )[0];
      if (!settings?.isEnabled || !settings?.notifyDrivers) {
        Logger.log('Surge disabled or driver notify OFF, skipped', 'SurgeZoneService');
        return;
      }
      const ring = zone.area?.[0];
      if (!ring || ring.length < 3) return;

      // zone centre + farthest vertex distance (m) + admin notify radius
      const center: Point = {
        lat: ring.reduce((t, p) => t + p.lat, 0) / ring.length,
        lng: ring.reduce((t, p) => t + p.lng, 0) / ring.length,
      };
      const distM = (p: Point) => {
        const dLat = (p.lat - center.lat) * 111320;
        const dLng = (p.lng - center.lng) * 111320 * Math.cos((center.lat * Math.PI) / 180);
        return Math.sqrt(dLat * dLat + dLng * dLng);
      };
      const zoneRadius = Math.max(...ring.map(distM));
      const searchRadius = Math.round(zoneRadius + Number(settings.notifyRadiusMeters ?? 5000));

      const online = await this.driverRedis.getAllOnline(center, 1000);
      const drivers = online.filter((d) => d.location && distM(d.location) <= searchRadius);
      const tokens = new Set<string>();
      for (const d of drivers) {
        for (const t of d.fcmTokens ?? []) if (t) tokens.add(t);
      }
      // Redis snapshot often has no FCM token; the real one lives in driver.notificationPlayerId
      const ids = drivers
        .map((d: any) => Number(d.id ?? d.driverId))
        .filter((n) => Number.isFinite(n) && n > 0);
      if (ids.length > 0) {
        const rows = await this.repo.manager.getRepository(DriverEntity).find({
          where: { id: In(ids) },
          select: ['id', 'notificationPlayerId'],
        });
        for (const r of rows) if (r.notificationPlayerId) tokens.add(r.notificationPlayerId);
      }
      Logger.log(
        `Zone ${zone.id}: radius=${searchRadius}m online=${online.length} nearby=${drivers.length} tokens=${tokens.size} ids=${drivers.map((d: any) => d.id ?? d.driverId)}`,
        'SurgeZoneService',
      );
      if (tokens.size === 0) {
        Logger.log(`Zone ${zone.id}: no nearby drivers with a push token`, 'SurgeZoneService');
        return;
      }

      const icon = TYPE_ICONS[zone.type] ?? '⚡';
      const hasFlat = zone.surgeFlat != null && Number(zone.surgeFlat) > 0;
      const amount = hasFlat
        ? `+₹${Number(zone.surgeFlat)}`
        : `+${Number(zone.surgePercent ?? 0)}%`;
      const till = zone.endTime ? ` (till ${this.fmtTime(zone.endTime)})` : '';
      const title = `${icon} ${zone.type} surge active`;
      const body = `${zone.name}: ${amount}${till}`;

      const all = [...tokens];
      let sent = 0;
      for (let i = 0; i < all.length; i += 500) {
        sent += (await driverNotification.surge(all.slice(i, i + 500), title, body, {
          zoneId: String(zone.id),
          surgeType: zone.type,
          zoneName: zone.name,
          amount,
        })) ?? 0;
      }
      Logger.log(
        `Zone ${zone.id} (${zone.type}) notified ${sent}/${all.length} device(s)`,
        'SurgeZoneService',
      );
    } catch (e) {
      Logger.error(`surge notify failed: ${e}`, 'SurgeZoneService');
    }
  }
}
