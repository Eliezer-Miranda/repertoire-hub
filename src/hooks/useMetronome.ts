import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Metrônomo via Web Audio API.
 * - Agendamento preciso com lookahead (não depende de setInterval para timing).
 * - Primeiro pulso de cada compasso é mais agudo/forte.
 */
export function useMetronome() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const bpmRef = useRef(90);
  const beatsPerBarRef = useRef(4);

  const [isRunning, setIsRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const scheduleClick = (time: number, isDownbeat: boolean) => {
    const ctx = ctxRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = isDownbeat ? 1500 : 900;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.6, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  };

  const scheduler = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const lookahead = 0.1; // segundos
    while (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
      const beatInBar = beatRef.current % beatsPerBarRef.current;
      scheduleClick(nextNoteTimeRef.current, beatInBar === 0);
      const beatToShow = beatInBar;
      const delay = (nextNoteTimeRef.current - ctx.currentTime) * 1000;
      window.setTimeout(() => setCurrentBeat(beatToShow), Math.max(0, delay));
      nextNoteTimeRef.current += 60 / bpmRef.current;
      beatRef.current += 1;
    }
  }, []);

  const start = useCallback((bpm: number, timeSig: string = "4/4") => {
    bpmRef.current = bpm;
    beatsPerBarRef.current = parseInt(timeSig.split("/")[0], 10) || 4;
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new Ctx();
    }
    const ctx = ctxRef.current!;
    if (ctx.state === "suspended") ctx.resume();
    beatRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    setIsRunning(true);
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(scheduler, 25);
  }, [scheduler]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setCurrentBeat(0);
  }, []);

  const update = useCallback((bpm: number, timeSig: string = "4/4") => {
    bpmRef.current = bpm;
    beatsPerBarRef.current = parseInt(timeSig.split("/")[0], 10) || 4;
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { start, stop, update, isRunning, currentBeat, beatsPerBar: beatsPerBarRef.current };
}
