import { useAlbumCover } from "@/hooks/useArtwork";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  artist: string;
  album: string;
  fallback?: string;
  className?: string;
  alt?: string;
};

export function AlbumThumb({ artist, album, fallback, className, alt }: Props) {
  const cover = useAlbumCover(artist, album);
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden", className)}
      style={{ background: fallback }}
    >
      {cover ? (
        <img
          src={cover}
          alt={alt || `Capa do álbum ${album}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover animate-fade-in"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Music2 className="h-1/3 w-1/3 text-white/40" />
        </div>
      )}
    </div>
  );
}
