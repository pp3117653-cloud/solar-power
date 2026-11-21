/**
 * ============================================================================
 * JARVIS — REAL-TIME NASA, ISS, APOLLO, CHANDRAYAAN & VOYAGER TELEMETRY SERVICE
 * ============================================================================
 * Connects to official NASA Open APIs (EPIC, NeoWs, DONKI, NASA Image & Video
 * Library) and live ISS orbital telemetry with graceful offline fallback.
 */

export interface LunarMissionSite {
  mission: string;
  agency: 'NASA' | 'ISRO';
  craftName: string;
  siteName: string;
  landingDate: string;
  crewOrType: string;
  lat: number; // degrees N
  lon: number; // degrees E
  highlight: string;
}

/**
 * Exact NASA NSSDC / LROC Apollo 11–17 coordinates + ISRO Chandrayaan-3 Statio Shiv Shakti
 * Sources:
 * - NASA NSSDC: https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html
 * - USGS Gazetteer / NASA LROC: https://planetarynames.wr.usgs.gov/Feature/16272
 */
export const LUNAR_MISSION_SITES: readonly LunarMissionSite[] = [
  {
    mission: 'Apollo 11',
    agency: 'NASA',
    craftName: 'LM Eagle',
    siteName: 'Mare Tranquillitatis',
    landingDate: '20 Jul 1969',
    crewOrType: 'Armstrong · Aldrin · Collins',
    lat: 0.67416,
    lon: 23.47314,
    highlight: 'First crewed Moon landing & Laser Ranging Retroreflector (LRRR).',
  },
  {
    mission: 'Apollo 12',
    agency: 'NASA',
    craftName: 'LM Intrepid',
    siteName: 'Oceanus Procellarum',
    landingDate: '19 Nov 1969',
    crewOrType: 'Conrad · Bean · Gordon',
    lat: -3.0128,
    lon: -23.4219,
    highlight: 'Pinpoint landing 163 m from Surveyor 3 spacecraft.',
  },
  {
    mission: 'Apollo 14',
    agency: 'NASA',
    craftName: 'LM Antares',
    siteName: 'Fra Mauro Highlands',
    landingDate: '05 Feb 1971',
    crewOrType: 'Shepard · Mitchell · Roosa',
    lat: -3.64589,
    lon: -17.47194,
    highlight: 'Sampled ancient Imbrium Basin ejecta blanket.',
  },
  {
    mission: 'Apollo 15',
    agency: 'NASA',
    craftName: 'LM Falcon',
    siteName: 'Hadley-Apennines',
    landingDate: '30 Jul 1971',
    crewOrType: 'Scott · Irwin · Worden',
    lat: 26.13239,
    lon: 3.6333,
    highlight: 'First Lunar Roving Vehicle (LRV) & Genesis Rock discovery.',
  },
  {
    mission: 'Apollo 16',
    agency: 'NASA',
    craftName: 'LM Orion',
    siteName: 'Descartes Highlands',
    landingDate: '21 Apr 1972',
    crewOrType: 'Young · Duke · Mattingly',
    lat: -8.9734,
    lon: 15.5011,
    highlight: 'Explored ancient lunar highlands & UV astronomical camera.',
  },
  {
    mission: 'Apollo 17',
    agency: 'NASA',
    craftName: 'LM Challenger',
    siteName: 'Taurus-Littrow Valley',
    landingDate: '11 Dec 1972',
    crewOrType: 'Cernan · Schmitt · Evans',
    lat: 20.1911,
    lon: 30.7723,
    highlight: 'Longest Apollo stay (75h) & volcanic orange glass discovery.',
  },
  {
    mission: 'Chandrayaan-3',
    agency: 'ISRO',
    craftName: 'Vikram Lander & Pragyan Rover',
    siteName: 'Statio Shiv Shakti (South Pole)',
    landingDate: '23 Aug 2023',
    crewOrType: 'Robotic Lander + Rover',
    lat: -69.37345,
    lon: 32.31985,
    highlight: 'First soft landing near the lunar south pole; confirmed sulfur & lunar soil thermal profile.',
  },
] as const;

// Backwards-compatible alias
export const APOLLO_LANDING_SITES = LUNAR_MISSION_SITES;

export interface DeepSpaceProbeInfo {
  id: string;
  name: string;
  agency: string;
  launched: string;
  target: string;
  status: string;
  highlight: string;
}

export const DEEP_SPACE_PROBES: readonly DeepSpaceProbeInfo[] = [
  {
    id: 'voyager-1',
    name: 'Voyager 1',
    agency: 'NASA / JPL',
    launched: '05 Sep 1977',
    target: 'Jupiter, Saturn & Interstellar Space',
    status: 'Active · >24B km from Earth',
    highlight: 'Farthest human-made spacecraft; captured the Pale Blue Dot portrait.',
  },
  {
    id: 'voyager-2',
    name: 'Voyager 2',
    agency: 'NASA / JPL',
    launched: '20 Aug 1977',
    target: 'Jupiter, Saturn, Uranus & Neptune',
    status: 'Active · Interstellar Space',
    highlight: 'Only spacecraft to visit all four giant outer planets.',
  },
  {
    id: 'chandrayaan-3',
    name: 'Chandrayaan-3',
    agency: 'ISRO',
    launched: '14 Jul 2023',
    target: 'Lunar South Pole (Statio Shiv Shakti)',
    status: 'Mission Completed · Surface Monument',
    highlight: 'Confirmed elemental sulfur via LIBS & executed lunar hop test.',
  },
  {
    id: 'lro',
    name: 'Lunar Reconnaissance Orbiter (LRO)',
    agency: 'NASA',
    launched: '18 Jun 2009',
    target: 'Lunar Polar Orbit',
    status: 'Active · 0.5 m/px LROC Imaging',
    highlight: 'Imaged all 6 Apollo landing sites and ISRO Chandrayaan-3 Vikram lander.',
  },
  {
    id: 'juno',
    name: 'Juno',
    agency: 'NASA / JPL',
    launched: '05 Aug 2011',
    target: 'Jupiter & Galilean Moons',
    status: 'Active · Polar Orbit',
    highlight: 'High-resolution JunoCam polar cyclones, Io, Europa & Ganymede flybys.',
  },
] as const;

export type NasaMediaCategory = 'earth' | 'apollo' | 'chandrayaan' | 'voyager' | 'probes';

export interface NasaMediaItem {
  nasaId: string;
  title: string;
  description: string;
  dateCreated: string;
  mediaType: 'image' | 'video';
  thumbnailUrl: string;
  collectionJsonUrl: string;
  center: string;
}

export interface IssTelemetry {
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmh: number;
  visibility: string;
  timestamp: number;
  live: boolean;
}

export interface NasaEpicTelemetry {
  caption: string;
  date: string;
  imageName: string;
  imageUrl: string;
  lat: number;
  lon: number;
  distanceKm: number;
  live: boolean;
}

export interface NasaNeoSummary {
  countToday: number;
  hazardousCount: number;
  closestName: string;
  closestDistanceKm: number;
  closestVelocityKmh: number;
  live: boolean;
}

export interface NasaSolarWeather {
  latestFlareClass: string;
  peakTime: string;
  activeRegion: string;
  live: boolean;
}

export interface LiveSpaceTelemetry {
  status: 'live' | 'partial' | 'offline';
  lastUpdatedIso: string;
  iss: IssTelemetry;
  epic: NasaEpicTelemetry;
  neo: NasaNeoSummary;
  solar: NasaSolarWeather;
}

/**
 * Builds the official NASA DSCOVR EPIC full-disc natural color Earth image URL.
 * Format: https://epic.gsfc.nasa.gov/archive/natural/YYYY/MM/DD/jpg/<imageName>.jpg
 */
export function buildEpicImageUrl(dateStr: string, imageName: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (!match || !imageName) return '';
  const [, yyyy, mm, dd] = match;
  return `https://epic.gsfc.nasa.gov/archive/natural/${yyyy}/${mm}/${dd}/jpg/${imageName}.jpg`;
}

export function getFallbackSpaceTelemetry(nowMs = Date.now()): LiveSpaceTelemetry {
  const orbitMinutes = 92.68;
  const phase = ((nowMs / 60000) % orbitMinutes) / orbitMinutes;
  const angle = phase * Math.PI * 2;
  const lat = Math.sin(angle) * 51.64;
  const lon = ((((phase * 360 - nowMs / 240000) % 360) + 540) % 360) - 180;

  return {
    status: 'offline',
    lastUpdatedIso: new Date(nowMs).toISOString(),
    iss: {
      latitude: Number(lat.toFixed(2)),
      longitude: Number(lon.toFixed(2)),
      altitudeKm: 420.4,
      velocityKmh: 27580,
      visibility: 'daylight',
      timestamp: Math.floor(nowMs / 1000),
      live: false,
    },
    epic: {
      caption: 'DSCOVR EPIC L1 Lagrange Point (1.5M km sunward)',
      date: new Date(nowMs).toISOString().slice(0, 10),
      imageName: '',
      imageUrl: '',
      lat: 12.4,
      lon: 48.2,
      distanceKm: 1498200,
      live: false,
    },
    neo: {
      countToday: 11,
      hazardousCount: 1,
      closestName: '2026 AP7 (Offline ref)',
      closestDistanceKm: 1840000,
      closestVelocityKmh: 38420,
      live: false,
    },
    solar: {
      latestFlareClass: 'C4.2',
      peakTime: 'Nominal solar activity',
      activeRegion: 'AR 3842',
      live: false,
    },
  };
}

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 7000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function formatDateYmd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function fetchLiveIssPosition(): Promise<IssTelemetry | null> {
  const data = await fetchJsonWithTimeout<{
    latitude: number;
    longitude: number;
    altitude: number;
    velocity: number;
    visibility: string;
    timestamp: number;
  }>('https://api.wheretheiss.at/v1/satellites/25544', 5000);

  if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    return null;
  }

  return {
    latitude: Number(data.latitude.toFixed(2)),
    longitude: Number(data.longitude.toFixed(2)),
    altitudeKm: Number((data.altitude ?? 420).toFixed(1)),
    velocityKmh: Math.round(data.velocity ?? 27580),
    visibility: data.visibility || 'daylight',
    timestamp: data.timestamp || Math.floor(Date.now() / 1000),
    live: true,
  };
}

export async function fetchLiveSpaceTelemetry(
  apiKey = 'DEMO_KEY'
): Promise<LiveSpaceTelemetry> {
  const key = (apiKey || 'DEMO_KEY').trim();
  const fallback = getFallbackSpaceTelemetry();
  const today = new Date();
  const todayStr = formatDateYmd(today);
  const weekAgoStr = formatDateYmd(new Date(today.getTime() - 7 * 86400000));

  const [issRes, epicRes, neoRes, donkiRes] = await Promise.all([
    fetchLiveIssPosition(),
    fetchJsonWithTimeout<
      Array<{
        caption?: string;
        date?: string;
        image?: string;
        centroid_coordinates?: { lat: number; lon: number };
        dscovr_j2000_position?: { x: number; y: number; z: number };
      }>
    >('https://epic.gsfc.nasa.gov/api/natural', 7000),
    fetchJsonWithTimeout<{
      element_count?: number;
      near_earth_objects?: Record<
        string,
        Array<{
          name?: string;
          is_potentially_hazardous_asteroid?: boolean;
          close_approach_data?: Array<{
            miss_distance?: { kilometers?: string };
            relative_velocity?: { kilometers_per_hour?: string };
          }>;
        }>
      >;
    }>(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${todayStr}&end_date=${todayStr}&api_key=${encodeURIComponent(key)}`,
      7000
    ),
    fetchJsonWithTimeout<
      Array<{
        classType?: string;
        peakTime?: string;
        activeRegionNum?: number;
      }>
    >(
      `https://api.nasa.gov/DONKI/FLR?startDate=${weekAgoStr}&endDate=${todayStr}&api_key=${encodeURIComponent(key)}`,
      7000
    ),
  ]);

  let liveCount = 0;

  const iss = issRes ?? fallback.iss;
  if (issRes) liveCount++;

  let epic = fallback.epic;
  if (Array.isArray(epicRes) && epicRes.length > 0) {
    const latest = epicRes[epicRes.length - 1];
    const pos = latest.dscovr_j2000_position;
    const dist = pos
      ? Math.round(Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z))
      : fallback.epic.distanceKm;
    const dateVal = latest.date || todayStr;
    const imgName = latest.image || '';
    epic = {
      caption: latest.caption || 'NASA DSCOVR EPIC Natural Color Earth',
      date: dateVal,
      imageName: imgName,
      imageUrl: buildEpicImageUrl(dateVal, imgName),
      lat: Number((latest.centroid_coordinates?.lat ?? 0).toFixed(2)),
      lon: Number((latest.centroid_coordinates?.lon ?? 0).toFixed(2)),
      distanceKm: dist,
      live: true,
    };
    liveCount++;
  }

  let neo = fallback.neo;
  if (neoRes && neoRes.near_earth_objects) {
    const list = Object.values(neoRes.near_earth_objects).flat();
    if (list.length > 0) {
      let hazardous = 0;
      let closestName = list[0].name || 'NEO';
      let closestDist = Number.POSITIVE_INFINITY;
      let closestVel = 0;

      for (const obj of list) {
        if (obj.is_potentially_hazardous_asteroid) hazardous++;
        const approach = obj.close_approach_data?.[0];
        const distKm = Number(approach?.miss_distance?.kilometers ?? Number.POSITIVE_INFINITY);
        if (distKm < closestDist) {
          closestDist = distKm;
          closestName = obj.name || closestName;
          closestVel = Math.round(Number(approach?.relative_velocity?.kilometers_per_hour ?? 0));
        }
      }

      neo = {
        countToday: neoRes.element_count ?? list.length,
        hazardousCount: hazardous,
        closestName,
        closestDistanceKm: Number.isFinite(closestDist)
          ? Math.round(closestDist)
          : fallback.neo.closestDistanceKm,
        closestVelocityKmh: closestVel || fallback.neo.closestVelocityKmh,
        live: true,
      };
      liveCount++;
    }
  }

  let solar = fallback.solar;
  if (Array.isArray(donkiRes) && donkiRes.length > 0) {
    const latest = donkiRes[donkiRes.length - 1];
    solar = {
      latestFlareClass: latest.classType || 'Quiet',
      peakTime: latest.peakTime ? latest.peakTime.replace('T', ' ').replace('Z', ' UTC') : 'Recent',
      activeRegion: latest.activeRegionNum ? `AR ${latest.activeRegionNum}` : 'Solar Disk',
      live: true,
    };
    liveCount++;
  }

  const status: LiveSpaceTelemetry['status'] =
    liveCount >= 3 ? 'live' : liveCount > 0 ? 'partial' : 'offline';

  return {
    status,
    lastUpdatedIso: new Date().toISOString(),
    iss,
    epic,
    neo,
    solar,
  };
}

const NASA_MEDIA_QUERIES: Record<NasaMediaCategory, string> = {
  earth: 'Earth from ISS DSCOVR blue marble',
  apollo: 'Apollo 11 15 17 lunar surface moon landing',
  chandrayaan: 'Chandrayaan Lunar Reconnaissance Orbiter moon south pole',
  voyager: 'Voyager Jupiter Saturn Uranus Neptune pale blue dot',
  probes: 'Cassini Juno Perseverance James Webb planetary',
};

/**
 * Fetches real NASA mission photos and playable MP4 video items directly from
 * NASA's official Image & Video Library API (no API key required, CORS-enabled).
 */
export async function fetchNasaMediaGallery(
  category: NasaMediaCategory,
  limit = 6
): Promise<NasaMediaItem[]> {
  const q = NASA_MEDIA_QUERIES[category] || NASA_MEDIA_QUERIES.earth;
  const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image,video&page_size=${limit}`;
  const res = await fetchJsonWithTimeout<{
    collection?: {
      items?: Array<{
        href?: string;
        data?: Array<{
          nasa_id?: string;
          title?: string;
          description?: string;
          date_created?: string;
          media_type?: 'image' | 'video';
          center?: string;
        }>;
        links?: Array<{ href?: string; rel?: string }>;
      }>;
    };
  }>(url, 8000);

  const items = res?.collection?.items ?? [];
  const parsed: NasaMediaItem[] = [];
  for (const item of items) {
    const meta = item.data?.[0];
    const thumb = item.links?.find((l) => l.rel === 'preview')?.href || item.links?.[0]?.href || '';
    if (!meta || !thumb) continue;
    parsed.push({
      nasaId: meta.nasa_id || String(parsed.length),
      title: meta.title || 'NASA Mission Media',
      description: (meta.description || '').slice(0, 220),
      dateCreated: (meta.date_created || '').slice(0, 10),
      mediaType: meta.media_type === 'video' ? 'video' : 'image',
      thumbnailUrl: thumb,
      collectionJsonUrl: item.href || '',
      center: meta.center || 'NASA',
    });
    if (parsed.length >= limit) break;
  }
  return parsed;
}

/**
 * Resolves a playable HTTPS MP4 video URL from a NASA asset collection.json manifest.
 */
export async function resolveNasaVideoUrl(collectionJsonUrl: string): Promise<string | null> {
  if (!collectionJsonUrl) return null;
  const assets = await fetchJsonWithTimeout<string[]>(collectionJsonUrl, 7000);
  if (!Array.isArray(assets)) return null;
  const mp4s = assets.filter((u) => typeof u === 'string' && /\.mp4(\?|$)/i.test(u));
  const preferred =
    mp4s.find((u) => /~medium\.mp4/i.test(u)) ||
    mp4s.find((u) => /~small\.mp4/i.test(u)) ||
    mp4s[0];
  return preferred ? preferred.replace(/^http:\/\//i, 'https://') : null;
}

export interface LiveEarthquakeEvent {
  id: string;
  magnitude: number;
  place: string;
  lat: number;
  lon: number;
  timeMs: number;
}

export interface LiveNaturalEvent {
  id: string;
  title: string;
  category: string;
  lat: number;
  lon: number;
}

/**
 * Fetches live M2.5+ global earthquakes from the USGS real-time GeoJSON feed (past 24h).
 */
export async function fetchLiveUsgsEarthquakes(limit = 35): Promise<LiveEarthquakeEvent[]> {
  const geo = await fetchJsonWithTimeout<{
    features?: Array<{
      id?: string;
      properties?: { mag?: number; place?: string; time?: number };
      geometry?: { coordinates?: [number, number, number] };
    }>;
  }>('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', 7000);

  return (geo?.features ?? [])
    .slice(0, limit)
    .filter((f) => Array.isArray(f.geometry?.coordinates))
    .map((f, i) => ({
      id: f.id || `eq-${i}`,
      magnitude: Number(f.properties?.mag ?? 2.5),
      place: f.properties?.place || 'Seismic Event',
      lon: f.geometry!.coordinates![0],
      lat: f.geometry!.coordinates![1],
      timeMs: Number(f.properties?.time ?? Date.now()),
    }));
}

/**
 * Fetches live active wildfires, volcanoes & tropical storms from NASA EONET v3.
 */
export async function fetchLiveNasaEonetEvents(limit = 24): Promise<LiveNaturalEvent[]> {
  const data = await fetchJsonWithTimeout<{
    events?: Array<{
      id?: string;
      title?: string;
      categories?: Array<{ title?: string }>;
      geometry?: Array<{ coordinates?: [number, number] }>;
    }>;
  }>(`https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=${limit}`, 7000);

  const out: LiveNaturalEvent[] = [];
  for (const ev of data?.events ?? []) {
    const geom = ev.geometry?.[ev.geometry.length - 1];
    if (!geom || !Array.isArray(geom.coordinates) || typeof geom.coordinates[0] !== 'number') continue;
    out.push({
      id: ev.id || String(out.length),
      title: ev.title || 'NASA EONET Event',
      category: ev.categories?.[0]?.title || 'Natural Event',
      lon: geom.coordinates[0],
      lat: geom.coordinates[1],
    });
  }
  return out;
}
