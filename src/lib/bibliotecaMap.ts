import { Song } from "@/types/music";

/**
 * Leitura da biblioteca a partir do arquivo `biblioteca-map.json`
 * gerado no servidor em /mnt/vs-dados/biblioteca-map.json.
 *
 * O arquivo é servido para o app (por exemplo copiado para `public/biblioteca-map.json`
 * ou exposto pelo agente local). Também é possível importar manualmente pelo
 * seletor de arquivo em Configurações.
 *
 * Formatos aceitos:
 *  1) ["/storage/biblioteca/Artista/Album/Faixa.mp3", ...]
 *  2) { files: [ { path, title?, artist?, album?, duration?, bpm?, key? }, ... ] }
 *  3) { tree: { "Artista": { "Album": ["Faixa.mp3", ...] } } }
 *  4) qualquer objeto/array aninhado contendo strings de caminho
 */

export const BIBLIOTECA_MAP_URL = "/biblioteca-map.json";
export const BIBLIOTECA_SOURCE_HINT = "/mnt/vs-dados/biblioteca-map.json";

const AUDIO_HINT = /\.[a-z0-9]{1,6}$/i;

type RawEntry = {
  path?: string;
  file?: string;
  filePath?: string;
  fullPath?: string;
  title?: string;
  name?: string;
  artist?: string;
  album?: string;
  duration?: number;
  bpm?: number;
  key?: string;
  tags?: string[];
};

const covers = [
  "linear-gradient(135deg, hsl(270 85% 60%), hsl(330 85% 60%))",
  "linear-gradient(135deg, hsl(200 85% 55%), hsl(175 75% 45%))",
  "linear-gradient(135deg, hsl(20 90% 60%), hsl(350 85% 55%))",
  "linear-gradient(135deg, hsl(45 95% 55%), hsl(15 90% 55%))",
  "linear-gradient(135deg, hsl(290 80% 55%), hsl(220 85% 55%))",
  "linear-gradient(135deg, hsl(140 70% 45%), hsl(180 70% 45%))",
];

function normalize(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/{2,}/g, "/");
}

function stem(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/^\d+\s*[-._)]\s*/, "").trim();
}

function extOf(p: string): string {
  const m = p.match(/\.([a-z0-9]{1,6})$/i);
  return m ? m[1].toLowerCase() : "";
}

/** Coleta recursivamente qualquer string que pareça um caminho de arquivo. */
function collect(node: unknown, prefix: string, out: RawEntry[], depth = 0) {
  if (depth > 12 || node == null) return;

  if (typeof node === "string") {
    const p = normalize(node);
    const full = p.startsWith("/") || /^[a-z]:/i.test(p) ? p : normalize(`${prefix}/${p}`);
    if (AUDIO_HINT.test(full)) out.push({ path: full });
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((n) => collect(n, prefix, out, depth + 1));
    return;
  }

  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    const pathLike = obj.path ?? obj.file ?? obj.filePath ?? obj.fullPath;
    if (typeof pathLike === "string") {
      const p = normalize(pathLike);
      out.push({
        ...(obj as RawEntry),
        path: p.startsWith("/") || /^[a-z]:/i.test(p) ? p : normalize(`${prefix}/${p}`),
      });
      return;
    }
    for (const [k, v] of Object.entries(obj)) {
      if (k === "children" || k === "files" || k === "items" || k === "tracks" || k === "songs") {
        collect(v, prefix, out, depth + 1);
      } else {
        collect(v, normalize(`${prefix}/${k}`), out, depth + 1);
      }
    }
  }
}

export function parseBibliotecaMap(data: unknown, rootHint = "/storage/biblioteca"): Song[] {
  const raw: RawEntry[] = [];
  const root =
    (typeof data === "object" && data !== null && (data as Record<string, unknown>).root) || rootHint;
  collect(data, normalize(String(root)), raw);

  const seen = new Set<string>();
  const songs: Song[] = [];

  raw.forEach((e, i) => {
    const path = e.path!;
    if (!path || seen.has(path)) return;
    seen.add(path);

    const parts = path.split("/").filter(Boolean);
    const file = parts[parts.length - 1] ?? path;
    const album = e.album ?? parts[parts.length - 2] ?? "Desconhecido";
    const artist = e.artist ?? parts[parts.length - 3] ?? "Desconhecido";
    const ext = extOf(file);

    songs.push({
      id: `bm-${i}`,
      title: e.title ?? e.name ?? stem(file),
      artist,
      album,
      duration: e.duration ?? 210,
      bpm: e.bpm,
      key: e.key,
      cover: covers[i % covers.length],
      filePath: path,
      format: (["mp3", "wav", "flac"].includes(ext) ? ext : "mp3") as Song["format"],
      tags: e.tags ?? [],
    });
  });

  return songs;
}

/** Tenta carregar o mapa da biblioteca servido pelo agente/pasta pública. */
export async function fetchBibliotecaMap(url = BIBLIOTECA_MAP_URL): Promise<Song[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") ?? "";
  const text = await res.text();
  if (!ct.includes("json") && text.trim().startsWith("<")) {
    throw new Error("Arquivo biblioteca-map.json não encontrado");
  }
  return parseBibliotecaMap(JSON.parse(text));
}
