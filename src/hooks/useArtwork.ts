import { useEffect, useState } from "react";
import { fetchAlbumCover, fetchArtistPhoto } from "@/lib/artwork";

export function useAlbumCover(artist: string, album: string, fallback?: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetchAlbumCover(artist, album).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [artist, album]);
  return url || fallback || null;
}

export function useArtistPhoto(artist: string, fallback?: string) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetchArtistPhoto(artist).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [artist]);
  return url || fallback || null;
}
