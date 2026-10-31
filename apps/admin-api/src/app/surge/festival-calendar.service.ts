import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Like, Repository } from 'typeorm';
import { RegionEntity, SurgeSettingEntity, SurgeZoneEntity } from '@ridy/database';

type Fest = { name: string; date: string };
const PREFIX = 'Festival · ';
const SKIP = ["karaka chaturthi", "karva chauth", "chhat", "bhai duj", "govardhan", "holika dahan", "raksha bandhan", "lohri", "vasant panchami", "basant panchami", "guru nanak", "guru gobind", "guru ravidas", "parsi new year", "dayanand", "valmiki", "rath yatra", "vaisakhi", "bihu", "onam", "chhath"];

// Option 1: fixed-date festivals (MM-DD)
const STATIC: { name: string; md: string }[] = [
  { name: 'New Year', md: '01-01' },
  { name: 'Bhogi', md: '01-13' },
  { name: 'Pongal', md: '01-14' },
  { name: 'Mattu Pongal', md: '01-15' },
  { name: 'Kaanum Pongal', md: '01-16' },
  { name: 'Republic Day', md: '01-26' },
  { name: 'Tamil New Year', md: '04-14' },
  { name: 'Independence Day', md: '08-15' },
  { name: 'Christmas', md: '12-25' },
  { name: 'New Year Eve', md: '12-31' },
];

const istDate = (offsetDays = 0) =>
  new Date(Date.now() + 330 * 60000 + offsetDays * 86400000).toISOString().substring(0, 10);

@Injectable()
export class FestivalCalendarService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FestivalCalendarService.name);
  private apiCache: { year: number; list: Fest[] } | null = null;

  constructor(
    @InjectRepository(SurgeZoneEntity) private readonly zoneRepo: Repository<SurgeZoneEntity>,
    @InjectRepository(SurgeSettingEntity) private readonly settingRepo: Repository<SurgeSettingEntity>,
    @InjectRepository(RegionEntity) private readonly regionRepo: Repository<RegionEntity>,
  ) {}

  // Option 2: Google Calendar API (Indian holidays)
  private async fromApi(year: number): Promise<Fest[]> {
    const key = process.env.GOOGLE_CALENDAR_API_KEY;
    if (!key) {
      this.logger.warn('GOOGLE_CALENDAR_API_KEY not set, using static festivals only');
      return [];
    }
    if (this.apiCache?.year === year) return this.apiCache.list;
    try {
      const cal = encodeURIComponent('en.indian#holiday@group.v.calendar.google.com');
      const qs = new URLSearchParams({
        key,
        timeMin: `${year}-01-01T00:00:00Z`,
        timeMax: `${year + 1}-01-01T00:00:00Z`,
        singleEvents: 'true',
        maxResults: '250',
      });
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${cal}/events?${qs}`,
        { signal: AbortSignal.timeout(15000) },
      );
      if (!res.ok) {
        this.logger.warn(`Google Calendar HTTP ${res.status}`);
        return [];
      }
      const data: any = await res.json();
      const list: Fest[] = (data?.items ?? [])
        .filter((e: any) => !String(e.description ?? '').toLowerCase().includes('observance'))
        .filter((e: any) => !SKIP.some((k) => String(e.summary ?? "").toLowerCase().includes(k)))
        .map((e: any) => ({ name: String(e.summary ?? ''), date: String(e.start?.date ?? '').substring(0, 10) }))
        .filter((f: Fest) => f.name && f.date.length === 10);
      this.apiCache = { year, list };
      this.logger.log(`Google Calendar: ${list.length} festivals for ${year}`);
      return list;
    } catch (e) {
      this.logger.warn(`Google Calendar fetch failed: ${(e as Error).message}`);
      return [];
    }
  }

  private async upcoming(days: number): Promise<Fest[]> {
    const from = istDate(0), to = istDate(days);
    const years = [...new Set([from, to].map((d) => Number(d.substring(0, 4))))];
    const all: Fest[] = [];
    for (const y of years) {
      all.push(...STATIC.map((s) => ({ name: s.name, date: `${y}-${s.md}` })));
      all.push(...(await this.fromApi(y)));
    }
    const seen = new Set<string>();
    return all.filter((f) => {
      const k = f.date;
      if (f.date < from || f.date > to || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  onApplicationBootstrap() {
    setTimeout(() => this.sync().catch((e) => this.logger.warn("Startup sync failed: " + e.message)), 10000);
  }

  @Cron('0 5 0 * * *', { timeZone: 'Asia/Kolkata' })
  async sync() {
    const [s] = await this.settingRepo.find({ take: 1 });
    if (!s?.isEnabled || !s?.autoSurgeEnabled) return;
    const old = await this.zoneRepo.find({
      where: { name: Like(`${PREFIX}%`), type: 'Festival', endDate: LessThan(istDate(0)) },
    });
    if (old.length) await this.zoneRepo.remove(old);

    const fests = await this.upcoming(3);
    const regions = await this.regionRepo.find({ where: { enabled: true } });
    for (const f of fests) {
      for (const r of regions) {
        if (!r.location?.[0] || r.location[0].length < 3) continue;
        const name = `${PREFIX}${f.name} · ${r.name}`;
        const exists = await this.zoneRepo.findOne({ where: { name, startDate: f.date } });
        if (exists) continue; // admin edits / Off status preserved
        await this.zoneRepo.save(this.zoneRepo.create({
          name, type: 'Festival', status: 'Auto', autoCreated: false, autoLive: false,
          regionId: r.id, area: [r.location[0]],
          startDate: f.date, endDate: f.date, startTime: '06:00', endTime: '23:59',
          surgePercent: Number(s.defaultSurgePercent ?? 20),
        }));
        this.logger.log(`Created festival zone: ${name} (${f.date})`);
      }
    }
  }
}
