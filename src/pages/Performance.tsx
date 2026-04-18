import { useEffect, useState } from "react";
import { useLibrary } from "@/store/useLibrary";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Pause, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { AlbumThumb } from "@/components/AlbumThumb";
import { useMetronome } from "@/hooks/useMetronome";
import { cn } from "@/lib/utils";

export default function Performance() {
  const { repertoires, songs, isPlaying, togglePlay, playSong } = useLibrary();
  const rep = repertoires[0];
  const [idx, setIdx] = useState(0);
  const { start, stop, isRunning, currentBeat, beatsPerBar } = useMetronome();

  const items = rep ? [...rep.items].sort((a, b) => a.order - b.order) : [];
  const currentItem = items[idx];
  const current = songs.find((s) => s.id === currentItem?.songId);
  const next = songs.find((s) => s.id === items[idx + 1]?.songId);

  // Para o click ao trocar de faixa
  useEffect(() => {
    stop();
  }, [idx, stop]);

  if (!rep) {
    return (
      <div className="p-12 text-center">
        <p className="text-muted-foreground mb-4">Crie um repertório primeiro.</p>
        <Button asChild><Link to="/criar">Criar agora</Link></Button>
      </div>
    );
  }

  if (!current) return null;

  const goNext = () => {
    if (idx < items.length - 1) {
      setIdx(idx + 1);
      playSong(items[idx + 1].songId);
    }
  };
  const goPrev = () => {
    if (idx > 0) {
      setIdx(idx - 1);
      playSong(items[idx - 1].songId);
    }
  };

  const clickBpm = currentItem?.clickBpm ?? current.bpm ?? 90;
  const timeSig = currentItem?.timeSignature ?? "4/4";
  const clickAvailable = currentItem?.clickEnabled !== false;

  const toggleClick = () => {
    if (isRunning) stop();
    else start(clickBpm, timeSig);
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
        Modo Performance · {idx + 1} / {items.length}
      </div>

      <AlbumThumb
        artist={current.artist}
        album={current.album}
        fallback={current.cover}
        className="h-64 w-64 rounded-3xl shadow-elevated mb-8"
      />

      <h1 className="font-display text-6xl lg:text-7xl font-bold mb-3">{current.title}</h1>
      <p className="text-2xl text-muted-foreground mb-6">{current.artist}</p>

      <div className="flex items-center gap-6 mb-8">
        {current.key && (
          <div className="text-center">
            <div className="text-5xl font-display font-bold text-primary">{current.key}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Tom</div>
          </div>
        )}
        {current.bpm && (
          <div className="text-center">
            <div className="text-5xl font-display font-bold text-accent">{current.bpm}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">BPM</div>
          </div>
        )}
        {clickAvailable && (
          <div className="text-center">
            <div className="text-5xl font-display font-bold">{clickBpm}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
              Click {timeSig}
            </div>
          </div>
        )}
      </div>

      {/* Click controls */}
      {clickAvailable && (
        <div className="flex items-center gap-3 mb-8 px-4 py-3 rounded-2xl bg-card border border-border/50">
          <Button
            size="sm"
            variant={isRunning ? "default" : "outline"}
            onClick={toggleClick}
            className={cn("gap-2", isRunning && "bg-primary text-primary-foreground shadow-glow")}
          >
            <Activity className="h-4 w-4" />
            {isRunning ? "Parar click" : "Iniciar click"}
          </Button>
          <div className="flex items-center gap-1.5 pl-2 border-l border-border">
            {Array.from({ length: beatsPerBar }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-3 w-3 rounded-full transition-all duration-75",
                  isRunning && currentBeat === i
                    ? i === 0
                      ? "bg-accent scale-150 shadow-glow"
                      : "bg-primary scale-125"
                    : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button size="lg" variant="outline" onClick={goPrev} disabled={idx === 0}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          size="lg"
          className="bg-gradient-primary shadow-glow h-14 w-14 rounded-full p-0"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-1" />}
        </Button>
        <Button size="lg" variant="outline" onClick={goNext} disabled={idx >= items.length - 1}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {next && (
        <div className="mt-12 text-sm text-muted-foreground">
          Próxima: <span className="text-foreground font-medium">{next.title}</span> · {next.artist}
        </div>
      )}
    </div>
  );
}
