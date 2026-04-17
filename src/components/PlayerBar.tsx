import { useLibrary } from "@/store/useLibrary";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useEffect, useState } from "react";

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function PlayerBar() {
  const { songs, currentSongId, isPlaying, togglePlay, playSong } = useLibrary();
  const song = songs.find((s) => s.id === currentSongId);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
  }, [currentSongId]);

  useEffect(() => {
    if (!isPlaying || !song) return;
    const id = setInterval(() => {
      setProgress((p) => (p >= song.duration ? 0 : p + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [isPlaying, song]);

  if (!song) return null;

  const idx = songs.findIndex((s) => s.id === currentSongId);
  const prev = () => idx > 0 && playSong(songs[idx - 1].id);
  const next = () => idx < songs.length - 1 && playSong(songs[idx + 1].id);

  return (
    <div className="h-20 border-t border-border bg-card/95 backdrop-blur-xl px-4 flex items-center gap-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0 w-72">
        <div
          className="h-12 w-12 rounded-md shrink-0 shadow-card"
          style={{ background: song.cover }}
        />
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{song.title}</div>
          <div className="text-xs text-muted-foreground truncate">{song.artist}</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prev}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-transform"
            onClick={togglePlay}
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 w-full max-w-md text-[11px] font-mono text-muted-foreground">
          <span>{fmt(progress)}</span>
          <Slider
            value={[progress]}
            max={song.duration}
            step={1}
            onValueChange={(v) => setProgress(v[0])}
            className="flex-1"
          />
          <span>{fmt(song.duration)}</span>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-2 w-40">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <Slider defaultValue={[80]} max={100} step={1} />
      </div>
    </div>
  );
}
