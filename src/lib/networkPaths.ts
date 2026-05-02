/**
 * Constrói caminhos de rede (UNC) para o Reaper/Lua localizar os arquivos.
 * Server padrão: \\192.168.2.177\storage
 *
 * Os arquivos da biblioteca já vêm com filePath no formato
 *   /storage/biblioteca/<Artista>/<Album>/<Titulo>.mp3
 * Convertemos para UNC: \\192.168.2.177\storage\biblioteca\...
 */

export const STORAGE_HOST = "192.168.2.177";
export const STORAGE_SHARE = "storage";

const UNC_ROOT = `\\\\${STORAGE_HOST}\\${STORAGE_SHARE}`;

/** Converte um caminho POSIX `/storage/...` em UNC `\\192.168.2.177\storage\...`. */
export function toUnc(posixPath: string): string {
  if (!posixPath) return posixPath;
  // Remove prefixo "/storage" se existir
  const trimmed = posixPath.replace(/^\/+/, "");
  const parts = trimmed.split("/");
  if (parts[0] === STORAGE_SHARE) parts.shift();
  return [UNC_ROOT, ...parts].join("\\");
}

/** Caminho do pad por tom dentro do compartilhamento. */
export function padUnc(key: string): string {
  return `${UNC_ROOT}\\pads\\${key}.wav`;
}

/** Caminho destino do click gerado, dentro do mesmo diretório da música. */
export function clickUncForSong(songPosixPath: string, suffix = "_click.wav"): string {
  const unc = toUnc(songPosixPath);
  // troca o nome do arquivo por <stem>_click.wav dentro de subpasta /click
  const lastSlash = unc.lastIndexOf("\\");
  const dir = unc.slice(0, lastSlash);
  const file = unc.slice(lastSlash + 1).replace(/\.[^.]+$/, "");
  return `${dir}\\click\\${file}${suffix}`;
}
