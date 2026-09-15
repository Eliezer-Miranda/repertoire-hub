import { STORAGE_HOST, STORAGE_SHARE } from "@/lib/networkPaths";

/**
 * Cliente do agente local (agent/server.mjs).
 * URL configurável via VITE_AGENT_URL; padrão: http://<STORAGE_HOST>:5700.
 */
export const AGENT_URL: string =
  (import.meta.env.VITE_AGENT_URL as string | undefined)?.replace(/\/+$/, "") ||
  `http://${STORAGE_HOST}:5700`;

/** Pasta de execução do Reaper, como vista no Windows (unidade S: = \\host\storage). */
export const VS_DRIVE = "S:";
export const VS_FOLDER = "VS";

export const REPERTOIRE_FILE = "repertorio.json";

/** Nome da pasta do repertório: `<Ministro>_<AAAA-MM-DD>` (mesma regra do agente). */
export function repertoireFolderName(minister: string, date: string): string {
  const min = minister
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\-_. ]+/gu, "_")
    .replace(/\s+/g, "_")
    .replace(/^\.+/, "")
    .trim();
  const day = date.slice(0, 10);
  return `${min}_${day}`;
}

export function repertoireWindowsPath(folder: string): string {
  return `${VS_DRIVE}\\${VS_FOLDER}\\${folder}\\${REPERTOIRE_FILE}`;
}

export function repertoireUncPath(folder: string): string {
  return `\\\\${STORAGE_HOST}\\${STORAGE_SHARE}\\${VS_FOLDER}\\${folder}\\${REPERTOIRE_FILE}`;
}

export type SaveRepertoireResult = {
  ok: true;
  folder: string;
  dir: string;
  file: string;
};

/** Grava o manifesto em <VS_DIR>/<Ministro_Data>/repertorio.json via agente. */
export async function saveRepertoireToAgent(
  minister: string,
  date: string,
  manifest: unknown,
  timeoutMs = 8000
): Promise<SaveRepertoireResult> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${AGENT_URL}/api/repertorios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minister, date, manifest }),
      signal: ctrl.signal,
    });
    const body = (await res.json().catch(() => ({}))) as Partial<SaveRepertoireResult> & { error?: string };
    if (!res.ok || !body.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body as SaveRepertoireResult;
  } finally {
    clearTimeout(t);
  }
}
