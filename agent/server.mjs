#!/usr/bin/env node
/**
 * MusicLib Agent — API local (porta 5700)
 *
 * Roda no Ubuntu onde o storage está montado.
 *   node agent/server.mjs
 *
 * Variáveis de ambiente:
 *   API_PORT   (default 5700)
 *   MAP_FILE   (default /mnt/vs-dados/biblioteca-map.json)
 *   MEDIA_ROOT (default /mnt/vs-dados)   -> raiz para streaming de áudio
 *   PADS_DIR   (default /mnt/vs-dados/pads)
 *   VS_DIR     (default /mnt/vs-dados/vs)  -> pasta de execução do Reaper (S:\VS no Windows)
 *
 * Endpoints:
 *   GET  /api/health
 *   GET  /api/map        -> conteúdo bruto do biblioteca-map.json
 *   GET  /api/songs      -> lista normalizada [{id,title,artist,album,filePath,format,...}]
 *   GET  /api/pads       -> pads disponíveis por tom
 *   GET  /api/stream?path=/caminho/arquivo.mp3  -> stream de áudio (Range)
 *   POST /api/repertorios {minister,date,manifest}
 *        -> grava <VS_DIR>/<Ministro_AAAA-MM-DD>/repertorio.json
 */
import http from "node:http";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const PORT = Number(process.env.API_PORT || 5700);
const MAP_FILE = process.env.MAP_FILE || "/mnt/vs-dados/biblioteca-map.json";
const MEDIA_ROOT = process.env.MEDIA_ROOT || "/mnt/vs-dados";
const PADS_DIR = process.env.PADS_DIR || "/mnt/vs-dados/pads";
const VS_DIR = process.env.VS_DIR || `${MEDIA_ROOT}/vs`;
const REPERTOIRE_FILE = "repertorio.json";
const MAX_BODY = 5 * 1024 * 1024;

const AUDIO_EXT = /\.[a-z0-9]{1,6}$/i;
const MIME = {
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".flac": "audio/flac",
  ".ogg": "audio/ogg", ".opus": "audio/opus", ".m4a": "audio/mp4", ".aac": "audio/aac",
};

const norm = (p) => String(p).replace(/\\/g, "/").replace(/\/{2,}/g, "/");
const stem = (f) => f.replace(/\.[^.]+$/, "").replace(/^\d+\s*[-._)]\s*/, "").trim();
const safeName = (s) =>
  String(s ?? "").normalize("NFC").replace(/[^\p{L}\p{N}\-_. ]+/gu, "_").replace(/\s+/g, "_").replace(/^\.+/, "").trim();

/** Nome da pasta do repertório: `<Ministro>_<AAAA-MM-DD>`. */
function repertoireFolderName(minister, date) {
  const min = safeName(minister);
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(String(date ?? ""));
  const d = new Date(date);
  const day = iso ? iso[0] : Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  if (!min || !day) throw new Error("ministro e data são obrigatórios");
  return `${min}_${day}`;
}

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error("corpo da requisição muito grande");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

/** Grava o manifesto em <VS_DIR>/<Ministro_Data>/repertorio.json e devolve os caminhos. */
async function saveRepertoire({ minister, date, manifest }) {
  if (!manifest || typeof manifest !== "object") throw new Error("manifest é obrigatório");
  const folder = repertoireFolderName(minister ?? manifest.repertoire?.minister, date ?? manifest.repertoire?.date);
  const dir = path.resolve(VS_DIR, folder);
  if (!dir.startsWith(path.resolve(VS_DIR) + path.sep)) throw new Error("pasta inválida");
  await fsp.mkdir(dir, { recursive: true });
  const file = path.join(dir, REPERTOIRE_FILE);
  await fsp.writeFile(file, JSON.stringify(manifest, null, 2), "utf8");
  return { folder, dir, file };
}

/** Achata qualquer formato de mapa (array de strings, objetos, árvore aninhada). */
function collect(node, prefix, out, depth = 0) {
  if (depth > 12 || node == null) return;
  if (typeof node === "string") {
    const p = norm(node);
    const full = p.startsWith("/") ? p : norm(`${prefix}/${p}`);
    if (AUDIO_EXT.test(full)) out.push({ path: full });
    return;
  }
  if (Array.isArray(node)) return node.forEach((n) => collect(n, prefix, out, depth + 1));
  if (typeof node === "object") {
    const pathLike = node.path ?? node.file ?? node.filePath ?? node.fullPath;
    if (typeof pathLike === "string") {
      const p = norm(pathLike);
      out.push({ ...node, path: p.startsWith("/") ? p : norm(`${prefix}/${p}`) });
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      if (["children", "files", "items", "tracks", "songs"].includes(k)) collect(v, prefix, out, depth + 1);
      else collect(v, norm(`${prefix}/${k}`), out, depth + 1);
    }
  }
}

function toSongs(map) {
  const raw = [];
  collect(map, norm(map?.root || MEDIA_ROOT), raw);
  const seen = new Set();
  const songs = [];
  raw.forEach((e, i) => {
    if (!e.path || seen.has(e.path)) return;
    seen.add(e.path);
    const parts = e.path.split("/").filter(Boolean);
    const file = parts.at(-1);
    const ext = (path.extname(file) || "").slice(1).toLowerCase();
    songs.push({
      id: e.id ?? `bm-${i}`,
      title: e.title ?? e.name ?? stem(file),
      artist: e.artist ?? parts.at(-3) ?? "Desconhecido",
      album: e.album ?? parts.at(-2) ?? "Desconhecido",
      duration: e.duration ?? 210,
      bpm: e.bpm ?? null,
      key: e.key ?? null,
      filePath: e.path,
      format: ["mp3", "wav", "flac"].includes(ext) ? ext : "mp3",
      ext,
      tags: e.tags ?? [],
    });
  });
  return songs;
}

async function readMap() {
  const txt = await fsp.readFile(MAP_FILE, "utf8");
  return JSON.parse(txt);
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

function json(res, status, body) {
  cors(res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

async function streamAudio(req, res, filePath) {
  const abs = norm(path.resolve(filePath));
  if (!abs.startsWith(norm(path.resolve(MEDIA_ROOT)))) return json(res, 403, { error: "fora do MEDIA_ROOT" });
  let stat;
  try { stat = await fsp.stat(abs); } catch { return json(res, 404, { error: "arquivo não encontrado" }); }
  const type = MIME[path.extname(abs).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;
  cors(res);
  if (range) {
    const [s, e] = range.replace(/bytes=/, "").split("-");
    const start = Number(s);
    const end = e ? Number(e) : stat.size - 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type": type,
    });
    return fs.createReadStream(abs, { start, end }).pipe(res);
  }
  res.writeHead(200, { "Content-Length": stat.size, "Content-Type": type, "Accept-Ranges": "bytes" });
  fs.createReadStream(abs).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === "OPTIONS") { cors(res); res.writeHead(204); return res.end(); }

  try {
    switch (url.pathname) {
      case "/api/health":
        return json(res, 200, { ok: true, port: PORT, mapFile: MAP_FILE, mediaRoot: MEDIA_ROOT, vsDir: VS_DIR });

      case "/api/map":
        return json(res, 200, await readMap());

      case "/api/songs": {
        const songs = toSongs(await readMap());
        return json(res, 200, { count: songs.length, root: MEDIA_ROOT, songs });
      }

      case "/api/pads": {
        let files = [];
        try { files = await fsp.readdir(PADS_DIR); } catch { /* pasta ausente */ }
        return json(res, 200, {
          dir: PADS_DIR,
          pads: files.filter((f) => /\.(wav|mp3|ogg|flac)$/i.test(f)).map((f) => ({
            key: stem(f), file: f, path: norm(`${PADS_DIR}/${f}`),
          })),
        });
      }

      case "/api/stream": {
        const p = url.searchParams.get("path");
        if (!p) return json(res, 400, { error: "parâmetro path obrigatório" });
        return streamAudio(req, res, p);
      }

      case "/api/repertorios": {
        if (req.method !== "POST") return json(res, 405, { error: "use POST" });
        let body;
        try { body = await readJsonBody(req); } catch (e) { return json(res, 400, { error: String(e?.message || e) }); }
        try {
          const saved = await saveRepertoire(body);
          console.log(`[musiclib-agent] repertório gravado: ${saved.file}`);
          return json(res, 201, { ok: true, ...saved });
        } catch (e) {
          const msg = String(e?.message || e);
          return json(res, /obrigat|inválid/.test(msg) ? 400 : 500, { error: msg });
        }
      }

      default:
        return json(res, 404, { error: "rota não encontrada" });
    }
  } catch (err) {
    return json(res, 500, { error: String(err?.message || err) });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[musiclib-agent] API em http://0.0.0.0:${PORT}`);
  console.log(`[musiclib-agent] mapa: ${MAP_FILE}`);
  console.log(`[musiclib-agent] repertórios: ${VS_DIR}/<Ministro_Data>/${REPERTOIRE_FILE}`);
});
