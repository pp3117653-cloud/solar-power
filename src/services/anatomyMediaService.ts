/**
 * ============================================================================
 * JARVIS — REAL-TIME HUMAN ANATOMY IMAGES, VIDEOS & LIVE DATA SERVICE
 * ============================================================================
 * Streams real high-resolution public medical/anatomical illustrations,
 * micrographs, and playable WebM/MP4 videos via CORS-enabled Wikimedia Commons
 * MediaWiki API + real-time Wikipedia REST anatomical summaries.
 * Includes OpenStax Anatomy & Physiology 2e physiological telemetry formulas.
 */

export type AnatomyMediaCategory =
  | 'cell'
  | 'body'
  | 'skeleton'
  | 'brain'
  | 'heart'
  | 'lungs'
  | 'digestive'
  | 'videos';

export interface AnatomyMediaItem {
  id: string;
  title: string;
  description: string;
  mediaType: 'image' | 'video';
  thumbnailUrl: string;
  fullUrl: string;
  mime: string;
  sourcePageUrl: string;
}

export interface LiveAnatomySummary {
  title: string;
  extract: string;
  thumbnailUrl?: string;
  pageUrl: string;
  live: boolean;
}

export interface PhysiologicalTelemetry {
  heartRateBpm: number;
  strokeVolumeMl: number;
  cardiacOutputLMin: number;
  ejectionFractionPct: number;
  bloodPressure: string;
  renalBloodFlowMlMin: number;
  gfrMlMin: number;
  dailyUrineMl: number;
}

const CATEGORY_QUERIES: Record<AnatomyMediaCategory, { query: string; isVideo?: boolean }> = {
  cell: { query: 'human eukaryotic cell organelles diagram filetype:bitmap|drawing' },
  body: { query: 'human anatomy internal organs diagram OpenStax|Gray' },
  skeleton: { query: 'human skeleton anterior posterior anatomy diagram' },
  brain: { query: 'human brain lobes anatomy cerebellum brainstem diagram' },
  heart: { query: 'human heart chambers valves anatomy diagram OpenStax' },
  lungs: { query: 'human respiratory system lungs trachea alveoli diagram' },
  digestive: { query: 'human digestive system liver stomach intestines diagram' },
  videos: { query: 'human heart OR brain OR anatomy 3D animation filetype:video', isVideo: true },
};

const WIKI_TOPICS: Record<AnatomyMediaCategory, string> = {
  cell: 'Cell_(biology)',
  body: 'Human_body',
  skeleton: 'Human_skeleton',
  brain: 'Human_brain',
  heart: 'Human_heart',
  lungs: 'Lung',
  digestive: 'Human_digestive_system',
  videos: 'Human_anatomy',
};

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Computes real-time physiological telemetry grounded in OpenStax Anatomy & Physiology 2e:
 * - Mean resting SV = 70 mL, CO = HR * SV (resting ~5.25 L/min at 75 bpm), EF = 58% (Ch. 19.4)
 * - Normal BP < 120/80 mm Hg (Ch. 20.4)
 * - Renal Blood Flow = 1050 mL/min, GFR = 110 mL/min, Urine = 1296 mL/day (Ch. 25.5)
 */
export function computePhysiologicalTelemetry(heartRateBpm: number): PhysiologicalTelemetry {
  const hr = Math.max(40, Math.min(180, Math.round(heartRateBpm || 72)));
  // Stroke volume rises moderately up to ~130 bpm then tapers at very high rates due to shorter filling time (OpenStax 19.4)
  const sv =
    hr <= 120
      ? Math.round(70 + (hr - 72) * 0.25)
      : Math.round(82 - (hr - 120) * 0.35);
  const clampedSv = Math.max(52, Math.min(100, sv));
  const co = Number(((hr * clampedSv) / 1000).toFixed(2));
  return {
    heartRateBpm: hr,
    strokeVolumeMl: clampedSv,
    cardiacOutputLMin: co,
    ejectionFractionPct: 58,
    bloodPressure: hr > 110 ? '128/82 mm Hg' : '118/76 mm Hg',
    renalBloodFlowMlMin: 1050,
    gfrMlMin: 110,
    dailyUrineMl: 1296,
  };
}

/**
 * Fetches real-time human anatomy images or playable videos from Wikimedia Commons (CORS-enabled).
 */
export async function fetchLiveAnatomyMedia(
  category: AnatomyMediaCategory,
  limit = 6
): Promise<AnatomyMediaItem[]> {
  const cfg = CATEGORY_QUERIES[category] ?? CATEGORY_QUERIES.body;
  const endpoint =
    'https://commons.wikimedia.org/w/api.php' +
    `?action=query&generator=search&gsrnamespace=6&gsrlimit=${limit + 4}` +
    `&gsrsearch=${encodeURIComponent(cfg.query)}` +
    '&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=480&format=json&origin=*';

  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
    const items: AnatomyMediaItem[] = [];

    for (const rawPage of pages as Array<Record<string, unknown>>) {
      const infoList = rawPage.imageinfo as Array<Record<string, unknown>> | undefined;
      if (!infoList || !infoList[0]) continue;
      const info = infoList[0];
      const mime = String(info.mime || '');
      const isVid = mime.startsWith('video/');
      const isImg = mime.startsWith('image/');
      if (cfg.isVideo && !isVid) continue;
      if (!cfg.isVideo && !isImg) continue;

      const fullUrl = String(info.url || '');
      const thumbUrl = String(info.thumburl || fullUrl);
      if (!fullUrl) continue;

      const rawTitle = String(rawPage.title || '').replace(/^File:/i, '').replace(/\.[^.]+$/, '').replace(/_/g, ' ');
      const meta = (info.extmetadata as Record<string, { value?: string }> | undefined) || {};
      const desc = stripHtml(meta.ImageDescription?.value || rawTitle).slice(0, 140);

      items.push({
        id: String(rawPage.pageid || rawTitle),
        title: rawTitle,
        description: desc,
        mediaType: isVid ? 'video' : 'image',
        thumbnailUrl: thumbUrl,
        fullUrl,
        mime,
        sourcePageUrl: String(info.descriptionurl || fullUrl),
      });

      if (items.length >= limit) break;
    }

    return items;
  } catch {
    return [];
  }
}

/**
 * Fetches live encyclopedic anatomical summary & thumbnail from Wikipedia REST API.
 */
export async function fetchLiveAnatomySummary(
  category: AnatomyMediaCategory
): Promise<LiveAnatomySummary> {
  const slug = WIKI_TOPICS[category] ?? 'Human_body';
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return {
      title: String(data.title || slug.replace(/_/g, ' ')),
      extract: String(data.extract || ''),
      thumbnailUrl: data.thumbnail?.source ? String(data.thumbnail.source) : undefined,
      pageUrl: String(data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${slug}`),
      live: true,
    };
  } catch {
    return {
      title: slug.replace(/_/g, ' '),
      extract:
        'Connect online to stream live Wikipedia anatomical summaries and high-resolution Wikimedia Commons medical images and videos.',
      pageUrl: `https://en.wikipedia.org/wiki/${slug}`,
      live: false,
    };
  }
}
