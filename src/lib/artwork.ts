// Busca capas de álbuns e fotos de artistas via iTunes Search API (gratuita, sem chave, CORS habilitado).
// Resultados ficam em cache no localStorage para evitar chamadas repetidas.

const CACHE_KEY = "musiclib-artwork-cache-v1";
const NEGATIVE_TTL = 1000 * 60 * 60 * 24; // 24h para "não encontrado"

type CacheEntry = { url: string | null; ts: number };
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
    // ignore quota errors
  }
}

function getCached(key: string): string | null | undefined {
  const cache = loadCache();
  const hit = cache[key];
  if (!hit) return undefined;
  if (hit.url === null && Date.now() - hit.ts > NEGATIVE_TTL) return undefined;
  return hit.url;
}

function setCached(key: string, url: string | null) {
  const cache = loadCache();
  cache[key] = { url, ts: Date.now() };
  saveCache(cache);
}

// Aumenta a resolução padrão (100x100) do iTunes para 600x600
function upscale(url: string) {
  return url.replace(/\/\d+x\d+bb\.(jpg|png)/, "/600x600bb.$1");
}

async function itunesSearch(term: string, entity: "album" | "musicArtist"): Promise<string | null> {
  const params = new URLSearchParams({
    term,
    entity,
    limit: "1",
    media: "music",
  });
  try {
    const res = await fetch(`https://itunes.apple.com/search?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    const item = data?.results?.[0];
    const art = item?.artworkUrl100 as string | undefined;
    return art ? upscale(art) : null;
  } catch {
    return null;
  }
}

export async function fetchAlbumCover(artist: string, album: string): Promise<string | null> {
  const key = `album:${artist.toLowerCase()}::${album.toLowerCase()}`;
  const cached = getCached(key);
  if (cached !== undefined) return cached;
  const url = await itunesSearch(`${artist} ${album}`, "album");
  setCached(key, url);
  return url;
}

export async function fetchArtistPhoto(artist: string): Promise<string | null> {
  const key = `artist:${artist.toLowerCase()}`;
  const cached = getCached(key);
  if (cached !== undefined) return cached;
  // Para artistas, a busca de "musicArtist" geralmente não retorna artwork — usamos o álbum mais relevante como proxy.
  const url = await itunesSearch(artist, "album");
  setCached(key, url);
  return url;
}
