const cache = new Map<string, { at: number; mm: number }>();
const TTL = 15 * 60 * 1000;

export async function googleRainMm(lat: number, lng: number): Promise<number | null> {
  const key = process.env.GOOGLE_WEATHER_API_KEY || process.env.GOOGLE_CALENDAR_API_KEY;
  if (!key) return null;
  const k = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  const hit = cache.get(k);
  if (hit && Date.now() - hit.at < TTL) return hit.mm;
  const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${key}&location.latitude=${lat.toFixed(4)}&location.longitude=${lng.toFixed(4)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Google Weather HTTP ${res.status}`);
  const data: any = await res.json();
  const mm = Number(data?.precipitation?.qpf?.quantity ?? 0);
  cache.set(k, { at: Date.now(), mm });
  return mm;
}
