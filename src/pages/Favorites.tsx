import { useMemo, useState } from "react";
import { useLibrary } from "@/store/useLibrary";
import { SongCard } from "@/components/SongCard";
import { Input } from "@/components/ui/input";
import { Star, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Favorites() {
  const { songs, favorites, toggleFavorite } = useLibrary();
  const [q, setQ] = useState("");

  const favSongs = useMemo(() => songs.filter((s) => favorites.has(s.id)), [songs, favorites]);

  const filteredAll = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(t) ||
        s.artist.toLowerCase().includes(t) ||
        s.album.toLowerCase().includes(t) ||
        s.key?.toLowerCase().includes(t) ||
        String(s.bpm).includes(t)
    );
  }, [q, songs]);

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <Star className="h-3 w-3 fill-primary" />
          Suas escolhas para ministração
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight inline-flex items-center gap-3">
          <Star className="h-9 w-9 fill-yellow-400 text-yellow-400" />
          Favoritos
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Marque com a estrela as músicas que você quer ter à mão para ministrar. Depois,
          monte um repertório a partir delas.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, artista, BPM ou tom…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-11 pl-9"
          />
        </div>
        <Button asChild className="bg-gradient-primary shadow-glow">
          <Link to="/criar">Criar repertório com favoritos</Link>
        </Button>
      </div>

      <Tabs defaultValue="favorites">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="favorites" className="gap-2">
            <Star className="h-4 w-4" /> Meus favoritos ({favSongs.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            Todas ({songs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="favorites" className="mt-6">
          {favSongs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Marque faixas com a estrela na aba <strong>Todas</strong> para vê-las aqui.
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              {favSongs
                .filter((s) => {
                  const t = q.toLowerCase().trim();
                  if (!t) return true;
                  return (
                    s.title.toLowerCase().includes(t) ||
                    s.artist.toLowerCase().includes(t)
                  );
                })
                .map((s) => (
                  <SongCard
                    key={s.id}
                    song={s}
                   
                  />
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          {filteredAll.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Nenhuma faixa encontrada.
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              {filteredAll.map((s) => (
                <SongCard
                  key={s.id}
                  song={s}
                 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
