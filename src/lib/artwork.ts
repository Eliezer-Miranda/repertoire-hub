// Busca capas de álbuns e fotos de artistas via iTunes Search API (gratuita, sem chave, CORS habilitado).
// Após baixar a imagem, salva como base64 (data URL) no localStorage para funcionar offline e evitar refetch.

const CACHE_KEY = "musiclib-artwork-cache-v2";
const NEGATIVE_TTL = 1000 * 60 * 60 * 24; // 24h para "não encontrado"
const MAX_CACHE_BYTES = 4_500_000; // ~4.5MB de orçamento para o cache de imagens

type CacheEntry = {
  /** data URL (base64) da imagem baixada, ou null se não encontrado */
  data: string | null;
  /** URL original do iTunes (para referência) */
  src?: string;
  ts: number;
  bytes?: number;
};
type Cache = Record<string, CacheEntry>;

function loadCache(): Cache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCache(cache: Cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Estourou a quota — remove os mais antigos até caber
    const entries = Object.entries(cache).sort((a, b) => a[1].ts - b[1].ts);
    while (entries.length > 0) {
      const [k] = entries.shift()!;
      delete cache[k];
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        return;
      } catch {
        // continua removendo
      }
    }
  }
}

function totalBytes(cache: Cache): number {
  return Object.values(cache).reduce((acc, e) => acc + (e.bytes || 0), 0);
}

function evictIfNeeded(cache: Cache, incoming: number) {
  let bytes = totalBytes(cache);
  if (bytes + incoming <= MAX_CACHE_BYTES) return;
  const entries = Object.entries(cache).sort((a, b) => a[1].ts - b[1].ts);
  while (bytes + incoming > MAX_CACHE_BYTES && entries.length) {
    const [k, v] = entries.shift()!;
    delete cache[k];
    bytes -= v.bytes || 0;
  }
}

function getCached(key: string): CacheEntry | undefined {
  const cache = loadCache();
  const hit = cache[key];
  if (!hit) return undefined;
  if (hit.data === null && Date.now() - hit.ts > NEGATIVE_TTL) return undefined;
  return hit;
}

function setCached(key: string, entry: CacheEntry) {
  const cache = loadCache();
  if (entry.bytes) evictIfNeeded(cache, entry.bytes);
  cache[key] = entry;
  saveCache(cache);
}

// Aumenta a resolução padrão (100x100) do iTunes para 600x600
function upscale(url: string) {
  return url.replace(/\/\d+x\d+bb\.(jpg|png)/, "/600x600bb.$1");
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function downloadAsDataUrl(url: string): Promise<{ data: string; bytes: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const data = await blobToDataUrl(blob);
    return { data, bytes: blob.size };
  } catch {
    return null;
  }
}

async function itunesSearch(term: string, entity: "album" | "musicArtist"): Promise<string | null> {
  const params = new URLSearchParams({ term, entity, limit: "1", media: "music" });
  try {
    const res = await fetch(`https://itunes.apple.com/search?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    const art = data?.results?.[0]?.artworkUrl100 as string | undefined;
    return art ? upscale(art) : null;
  } catch {
    return null;
  }
}

async function fetchAndPersist(key: string, term: string): Promise<string | null> {
  const src = await itunesSearch(term, "album");
  if (!src) {
    setCached(key, { data: null, ts: Date.now() });
    return null;
  }
  const dl = await downloadAsDataUrl(src);
  if (!dl) {
    // Falha em baixar mas temos URL — guarda só a URL para fallback
    setCached(key, { data: null, src, ts: Date.now() });
    return src;
  }
  setCached(key, { data: dl.data, src, ts: Date.now(), bytes: dl.bytes });
  return dl.data;
}

export async function fetchAlbumCover(artist: string, album: string): Promise<string | null> {
  const key = `album:${artist.toLowerCase()}::${album.toLowerCase()}`;
  const cached = getCached(key);
  if (cached) return cached.data ?? cached.src ?? null;
  return fetchAndPersist(key, `${artist} ${album}`);
}

export async function fetchArtistPhoto(artist: string): Promise<string | null> {
  const key = `artist:${artist.toLowerCase()}`;
  const cached = getCached(key);
  if (cached) return cached.data ?? cached.src ?? null;
  return fetchAndPersist(key, artist);
}
