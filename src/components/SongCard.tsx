import { Song } from "@/types/music";
import { Play, Star, Music2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLibrary } from "@/store/useLibrary";
import { cn } from "@/lib/utils";
import { useAlbumCover } from "@/hooks/useArtwork";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

type Props = {
  song: Song;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
};

export function SongCard({ song, selectable, selected, onToggleSelect }: Props) {
  const { playSong, currentSongId, isPlaying, favorites, toggleFavorite } = useLibrary();
  const isCurrent = currentSongId === song.id;
  const isFav = favorites.has(song.id);
  const remoteCover = useAlbumCover(song.artist, song.album);

  return (
    <div className="group relative rounded-2xl bg-card border border-border/50 p-3 card-hover overflow-hidden">
      <div
        className="relative aspect-square rounded-xl overflow-hidden mb-3 shadow-card"
        style={{ background: song.cover }}
      >
        {remoteCover && (
          <img
            src={remoteCover}
            alt={`Capa do álbum ${song.album} de ${song.artist}`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover animate-fade-in"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          <Music2 className={cn("h-12 w-12 text-white/30 group-hover:opacity-0 transition-opacity", remoteCover && "opacity-0")} />
          <Button
            size="icon"
            onClick={() => playSong(song.id)}
            className={cn(
              "absolute h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-glow",
              "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all",
              isCurrent && isPlaying && "opacity-100 translate-y-0"
            )}
          >
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </Button>
        </div>

        {isCurrent && (
          <div className="absolute bottom-2 left-2 flex items-end gap-0.5 h-5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="equalizer-bar w-1 bg-primary rounded-full h-full"
                style={{ animationDelay: `${i * 0.15}s`, animationPlayState: isPlaying ? "running" : "paused" }}
              />
            ))}
          </div>
        )}

        <Button
          size="icon"
          variant="ghost"
          onClick={() => toggleFavorite(song.id)}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 text-white"
        >
          <Star className={cn("h-4 w-4", isFav && "fill-yellow-400 text-yellow-400")} />
        </Button>

        {selectable && (
          <button
            onClick={onToggleSelect}
            className={cn(
              "absolute top-2 left-2 h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all",
              selected
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-black/30 border-white/60 hover:bg-black/50"
            )}
          >
            {selected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 text-white" />}
          </button>
        )}
      </div>

      <div className="px-1">
        <div className="font-semibold text-sm truncate">{song.title}</div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">{song.artist}</div>
        <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-muted-foreground">
          {song.key && (
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
              {song.key}
            </span>
          )}
          {song.bpm && <span>{song.bpm} BPM</span>}
          <span className="ml-auto">{fmt(song.duration)}</span>
        </div>
      </div>
    </div>
  );
}
