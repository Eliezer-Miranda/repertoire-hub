/**
 * Gera uma trilha de click (metrônomo) como arquivo WAV (PCM 16-bit, mono).
 * - Renderização offline via OfflineAudioContext (não toca, só gera o buffer).
 * - Downbeat (primeira batida do compasso) tem frequência mais aguda.
 *
 * Uso:
 *   const blob = await renderClickWav({ bpm: 120, timeSignature: "4/4", durationSec: 180 });
 */

export type ClickRenderOptions = {
  bpm: number;
  timeSignature: "2/4" | "3/4" | "4/4" | "6/8" | string;
  durationSec: number;
  sampleRate?: number;
  /** Volume 0..1 dos cliques fracos. Downbeat usa 1.0x deste valor. */
  gain?: number;
  /** Tocar contagem inicial silenciosa? Default false. */
  countInBars?: number;
};

const DOWNBEAT_FREQ = 1500;
const BEAT_FREQ = 900;
const CLICK_DUR = 0.05; // segundos

export async function renderClickBuffer({
  bpm,
  timeSignature,
  durationSec,
  sampleRate = 44100,
  gain = 0.6,
  countInBars = 0,
}: ClickRenderOptions): Promise<AudioBuffer> {
  const beatsPerBar = parseInt(String(timeSignature).split("/")[0], 10) || 4;
  const secPerBeat = 60 / bpm;
  const totalDuration = durationSec + countInBars * beatsPerBar * secPerBeat;

  const OfflineCtx =
    window.OfflineAudioContext ||
    (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;

  const ctx = new OfflineCtx(1, Math.ceil(totalDuration * sampleRate), sampleRate);

  let beatIdx = 0;
  for (let t = 0; t < totalDuration; t += secPerBeat) {
    const isDownbeat = beatIdx % beatsPerBar === 0;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = isDownbeat ? DOWNBEAT_FREQ : BEAT_FREQ;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain * (isDownbeat ? 1 : 0.7), t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + CLICK_DUR);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + CLICK_DUR + 0.01);
    beatIdx += 1;
  }

  return await ctx.startRendering();
}

/** Converte AudioBuffer mono/stereo em Blob WAV (PCM 16-bit). */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numCh * 2;
  const ab = new ArrayBuffer(44 + length);
  const view = new DataView(ab);

  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };

  // RIFF header
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + length, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numCh, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numCh * 2, true);
  view.setUint16(32, numCh * 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, length, true);

  // Interleaved PCM 16-bit
  const channels: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) channels.push(buffer.getChannelData(c));

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numCh; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([ab], { type: "audio/wav" });
}

export async function renderClickWav(opts: ClickRenderOptions): Promise<Blob> {
  const buf = await renderClickBuffer(opts);
  return audioBufferToWavBlob(buf);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function sanitizeFilename(s: string): string {
  return s.replace(/[^\p{L}\p{N}\-_. ]+/gu, "_").replace(/\s+/g, "_");
}
