import { Artist } from "@/types/music";
import { useArtistPhoto } from "@/hooks/useArtwork";
import { Mic2 } from "lucide-react";

export function ArtistCard({ artist }: { artist: Artist }) {
  const photo = useArtistPhoto(artist.name);
  return (
    <div className="rounded-2xl bg-card border border-border/50 p-3 card-hover text-center">
      <div
        className="relative aspect-square rounded-full mb-3 shadow-card mx-auto overflow-hidden"
        style={{ background: artist.cover }}
      >
        {photo ? (
          <img
            src={photo}
            alt={`Foto de ${artist.name}`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover animate-fade-in"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Mic2 className="h-10 w-10 text-white/40" />
          </div>
        )}
      </div>
      <div className="font-semibold text-sm truncate">{artist.name}</div>
      <div className="text-[11px] text-muted-foreground mt-1">
        {artist.albumCount} álbuns · {artist.songCount} faixas
      </div>
    </div>
  );
}
