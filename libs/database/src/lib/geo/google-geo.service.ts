import { Inject, Injectable } from '@nestjs/common';
import { SharedConfigurationService } from '../config/shared-configuration.service';
import { PlaceDTO } from '../interfaces';
import { REDIS } from '../redis';
import { RedisClientType } from 'redis';
import { latLngToCell } from 'h3-js';
import { AddressType, Client } from '@googlemaps/google-maps-services-js';

@Injectable()
export class GoogleGeoService {
  constructor(
    private configurationService: SharedConfigurationService,
    @Inject(REDIS) readonly redis: RedisClientType,
  ) {}

  // --- config ---
  private readonly H3_CITY_RES = 6; // coarse "city-ish" resolution
  private readonly TTL_PLACES_SEC = 86400; // 24h for places list
  private readonly TTL_REVERSE_SEC = 86400; // 24h for reverse geocode points
  private readonly GEO_RADIUS_M = 10; // 10 meters proximity hit

  // --- helpers ---
  private cityCell(lat: number, lng: number) {
    return latLngToCell(lat, lng, this.H3_CITY_RES);
  }

  private placesCityKey(
    lang: string | undefined,
    keyword: string,
    cityCell: string,
  ) {
    return `geo:places:${(lang ?? 'any').toLowerCase()}:${keyword.trim().toLowerCase()}:city:${cityCell}:v1`;
  }

  private reverseGeoKey(lang: string | undefined) {
    return `geo:reverse:${(lang ?? 'any').toLowerCase()}:v3`; // GEO index
  }

  private reverseHashKey(memberId: string) {
    return `geo:reverse:hash:${memberId}`; // payload for reverse GEO member
  }

  // stable member id for GEO (approx coordinates)
  private makeMemberId(lat: number, lng: number) {
    // micro-degree rounding ~0.11m — stable and collision-resistant enough here
    const la = Math.round(lat * 1e6);
    const lo = Math.round(lng * 1e6);
    return `${la}:${lo}`;
  }

  async getPlaces(input: {
    keyword: string;
    location?: { lat: number; lng: number };
    language?: string;
  }): Promise<PlaceDTO[]> {
    const pipeline = this.redis.multi();
    pipeline.hIncrBy('geo:stats', 'getPlaces:requests', 1);
    // pipeline.ts.incrBy(`geo:stats:kw:${input.keyword.toLowerCase()}`, 1, {
    //   RETENTION: 2592000, // 30 days
    //   LABELS: { type: 'getPlaces', keyword: input.keyword.toLowerCase() },
    // });
    pipeline.exec().catch(() => null);

    // Build city cache key only if we have a location
    let cityKey: string | null = null;
    if (input.location) {
      const c = this.cityCell(input.location.lat, input.location.lng);
      cityKey = this.placesCityKey(input.language, input.keyword, c) + ':v5';
      const cached = await this.redis.get(cityKey).catch(() => null);
      if (cached) {
        await this.redis.hIncrBy('geo:stats', 'getPlaces:cacheHits', 1);
        return JSON.parse(cached);
      }
    }

    // Call provider using true Autocomplete for perfect prefix matching
    const config = await this.configurationService.getConfiguration();
    const client = new Client({});

    let locationParam: string | undefined = undefined;
    if (input.location) {
      locationParam = `${input.location.lat},${input.location.lng}`;
    }

    const autocompleteResp = await client.placeAutocomplete({
      params: {
        input: input.keyword,
        key: config.backendMapsAPIKey!,
        language: input.language,
        location: locationParam,
        radius: input.location ? 50000 : undefined,
        components: ['country:in'],
      },
    }).catch(() => null);

    const predictions = autocompleteResp?.data?.predictions ?? [];

    const detailPromises = predictions.slice(0, 5).map(p => 
      client.placeDetails({
        params: {
          place_id: p.place_id,
          key: config.backendMapsAPIKey!,
          fields: ['geometry', 'name', 'formatted_address'],
          language: input.language as any
        }
      }).catch(() => null)
    );

    const detailsResponses = await Promise.all(detailPromises);
    
    const results: PlaceDTO[] = [];
    for (let i = 0; i < detailsResponses.length; i++) {
       const dResp = detailsResponses[i];
       const result = dResp?.data?.result;
       if (result?.geometry?.location) {
          results.push({
             point: { 
               lat: result.geometry.location.lat, 
               lng: result.geometry.location.lng 
             },
             title: predictions[i].structured_formatting?.main_text || result.name || '',
             address: predictions[i].structured_formatting?.secondary_text || result.formatted_address || '',
          });
       }
    }
    // Like Google Maps search: if autocomplete gives few results, add Text Search results
    if (results.length < 3) {
      const ts = await client.textSearch({
        params: {
          query: input.keyword,
          key: config.backendMapsAPIKey!,
          language: input.language as any,
          location: locationParam,
          radius: input.location ? 30000 : undefined,
          region: 'in',
        },
      }).catch(() => null);
      for (const r of ts?.data?.results ?? []) {
        const loc = r.geometry?.location;
        if (!loc) continue;
        const dup = results.some((x) => Math.abs(x.point.lat - loc.lat) < 0.0005 && Math.abs(x.point.lng - loc.lng) < 0.0005);
        if (dup) continue;
        results.push({ point: { lat: loc.lat, lng: loc.lng }, title: r.name || '', address: r.formatted_address || '' });
        if (results.length >= 10) break;
      }
    }

    // Popular "Bus Stand": New / Old Bus Stand first (exact Google names), only nearby bus stands
    if (/^bus stand\b/i.test(input.keyword.trim())) {
      const pri: PlaceDTO[] = [];
      for (const pre of ['New', 'Old']) {
        const r = await client.textSearch({
          params: { query: `${pre} ${input.keyword}`, key: config.backendMapsAPIKey!, language: input.language as any, location: locationParam, radius: input.location ? 30000 : undefined, region: 'in' },
        }).catch(() => null);
        const top = r?.data?.results?.[0];
        const loc = top?.geometry?.location;
        if (top && loc) pri.push({ point: { lat: loc.lat, lng: loc.lng }, title: top.name || `${pre} Bus Stand`, address: top.formatted_address || '' });
      }
      const same = (a1: PlaceDTO, b1: PlaceDTO) => Math.abs(a1.point.lat - b1.point.lat) < 0.0005 && Math.abs(a1.point.lng - b1.point.lng) < 0.0005;
      let merged = [...pri, ...results.filter((x) => !pri.some((p) => same(p, x)))];
      merged = merged.filter((x, i) => merged.findIndex((y) => same(x, y)) === i);
      if (input.location) {
        const o = input.location;
        const rad = (d: number) => (d * Math.PI) / 180;
        const km = (q: { lat: number; lng: number }) => {
          const h = Math.sin(rad(q.lat - o.lat) / 2) ** 2 + Math.cos(rad(o.lat)) * Math.cos(rad(q.lat)) * Math.sin(rad(q.lng - o.lng) / 2) ** 2;
          return 12742 * Math.asin(Math.sqrt(h));
        };
        const near = merged.filter((x) => km(x.point) <= 25);
        if (near.length) merged = near;
      }
      results.splice(0, results.length, ...merged);
    }

    // Popular "Railway station": only real train stations, exact Google names, nearby
    if (/^railway station\b/i.test(input.keyword.trim())) {
      const r = await client.textSearch({
        params: { query: input.keyword, type: 'train_station' as any, key: config.backendMapsAPIKey!, language: input.language as any, location: locationParam, radius: input.location ? 30000 : undefined, region: 'in' },
      }).catch(() => null);
      const rad = (d: number) => (d * Math.PI) / 180;
      const km = (q: { lat: number; lng: number }) => {
        if (!input.location) return 0;
        const o = input.location;
        const h = Math.sin(rad(q.lat - o.lat) / 2) ** 2 + Math.cos(rad(o.lat)) * Math.cos(rad(q.lat)) * Math.sin(rad(q.lng - o.lng) / 2) ** 2;
        return 12742 * Math.asin(Math.sqrt(h));
      };
      const stations: PlaceDTO[] = [];
      for (const t of r?.data?.results ?? []) {
        const loc = t.geometry?.location;
        const types = (t.types || []) as string[];
        if (!loc || !(types.includes('train_station') || types.includes('transit_station'))) continue;
        if (km(loc) > 25) continue;
        const nm = t.name || '';
        stations.push({ point: { lat: loc.lat, lng: loc.lng }, title: /station|junction|jn\b|terminus|halt/i.test(nm) ? nm : `${nm} Railway Station`, address: t.formatted_address || '' });
      }
      if (stations.length) results.splice(0, results.length, ...stations);
    }

    // Cache at city scope if we can
    if (cityKey) {
      const ttl = results.length ? this.TTL_PLACES_SEC : 600; // negative cache 10m if empty
      await this.redis
        .setEx(cityKey, ttl, JSON.stringify(results))
        .catch(() => {});
    }

    return results;
  }

  async reverseGeocode(input: {
    lat: number;
    lng: number;
    language?: string;
  }): Promise<PlaceDTO> {
    await this.redis.hIncrBy('geo:stats', 'reverseGeocode:requests', 1);

    const geoKey = this.reverseGeoKey(input.language);

    // 1) Try GEO within 20m
    const hits = await this.redis
      .geoSearch(
        geoKey,
        { latitude: input.lat, longitude: input.lng },
        { radius: this.GEO_RADIUS_M, unit: 'm' },
        { SORT: 'ASC', COUNT: 1 },
      )
      .catch(() => null);

    if (hits && hits.length > 0) {
      const memberId = hits[0].member ?? hits[0]; // node-redis returns object or string depending on options
      const h = await this.redis.hGetAll(this.reverseHashKey(memberId));
      if (h && h.address) {
        await this.redis.hIncrBy('geo:stats', 'reverseGeocode:cacheHits', 1);
        return {
          point: { lat: parseFloat(h.lat), lng: parseFloat(h.lng) },
          title: h.title || '',
          address: h.address,
          city: h.city || undefined,
        };
      }
    }

    // 2) Fallback to provider, then store in GEO for future 20m hits
    const config = await this.configurationService.getConfiguration();
    const client = new Client({});
    const response = await client.reverseGeocode({
      params: {
        latlng: [input.lat, input.lng],
        key: config.backendMapsAPIKey!,
      },
    });
    // discard the places that are plus codes
    response.data.results = response.data.results.filter(
      (r) => !r.types.includes(AddressType['plus_code']),
    );
    const place = response.data.results[0];

    const dto: PlaceDTO = place
      ? {
          point: {
            lat: place.geometry.location!.lat!,
            lng: place.geometry.location!.lng!,
          },
          title: place.address_components.map((c) => c.long_name).join(', '),
          address: place.formatted_address || 'Address not found',
          city:
            Array.from(
              new Set(
                place.address_components
                  .filter((c) =>
                    c.types.some((t) =>
                      [
                        'locality',
                        'administrative_area_level_2',
                        'administrative_area_level_3',
                      ].includes(t as string),
                    ),
                  )
                  .map((c) => c.long_name),
              ),
            ).join('|') || undefined,
        }
      : {
          point: { lat: input.lat, lng: input.lng },
          title: '',
          address: 'Address not found',
        };

    // Store in GEO + hash (even if "Address not found"—it still avoids repeated calls)
    const memberId = this.makeMemberId(dto.point.lat, dto.point.lng);
    await this.redis
      .geoAdd(geoKey, {
        longitude: dto.point.lng,
        latitude: dto.point.lat,
        member: memberId,
      })
      .catch(() => {});
    await this.redis
      .hSet(this.reverseHashKey(memberId), {
        lat: String(dto.point.lat),
        lng: String(dto.point.lng),
        title: dto.title,
        address: dto.address,
        city: dto.city ?? '',
      })
      .catch(() => {});
    await this.redis.expire(geoKey, this.TTL_REVERSE_SEC).catch(() => {});
    await this.redis
      .expire(this.reverseHashKey(memberId), this.TTL_REVERSE_SEC)
      .catch(() => {});

    return dto;
  }
}
