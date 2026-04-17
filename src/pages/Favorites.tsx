import { useLibrary } from "@/store/useLibrary";
import { SongCard } from "@/components/SongCard";
import { Star } from "lucide-react";

export default function Favorites() {
  const { songs, favorites } = useLibrary();
  const favSongs = songs.filter((s) => favorites.has(s.id));

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <header>
        <h1 className="font-display text-4xl font-bold tracking-tight inline-flex items-center gap-3">
          <Star className="h-9 w-9 fill-yellow-400 text-yellow-400" />
          Favoritos
        </h1>
        <p className="text-muted-foreground mt-2">{favSongs.length} faixas marcadas</p>
      </header>

      {favSongs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Marque faixas com a estrela para vê-las aqui.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
          {favSongs.map((s) => <SongCard key={s.id} song={s} />)}
        </div>
      )}
    </div>
  );
}
