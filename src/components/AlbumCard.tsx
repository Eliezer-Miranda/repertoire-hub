import { Album } from "@/types/music";
import { useAlbumCover } from "@/hooks/useArtwork";
import { Disc3 } from "lucide-react";

export function AlbumCard({ album }: { album: Album }) {
  const cover = useAlbumCover(album.artist, album.name);
  return (
    <div className="rounded-2xl bg-card border border-border/50 p-3 card-hover">
      <div
        className="relative aspect-square rounded-xl mb-3 shadow-card overflow-hidden"
        style={{ background: album.cover }}
      >
        {cover ? (
          <img
            src={cover}
            alt={`Capa do álbum ${album.name} de ${album.artist}`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover animate-fade-in"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Disc3 className="h-12 w-12 text-white/30" />
          </div>
        )}
      </div>
      <div className="px-1">
        <div className="font-semibold text-sm truncate">{album.name}</div>
        <div className="text-xs text-muted-foreground truncate">{album.artist}</div>
        <div className="text-[11px] text-muted-foreground mt-1">
          {album.songCount} faixas · {album.year}
        </div>
      </div>
    </div>
  );
}
