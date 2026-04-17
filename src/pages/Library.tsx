import { useMemo, useState } from "react";
import { useLibrary } from "@/store/useLibrary";
import { SongCard } from "@/components/SongCard";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { mockArtists, mockAlbums } from "@/data/mockLibrary";
import { Music2, Disc3, Mic2 } from "lucide-react";

export default function Library() {
  const { songs } = useLibrary();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.artist.toLowerCase().includes(term) ||
        s.album.toLowerCase().includes(term) ||
        s.key?.toLowerCase().includes(term) ||
        String(s.bpm).includes(term)
    );
  }, [q, songs]);

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          {songs.length} faixas indexadas
        </div>
        <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">
          Sua <span className="text-gradient">biblioteca</span> musical
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Navegue pelas faixas, álbuns e artistas do servidor. Pré-escute, marque favoritos e leve para o próximo repertório.
        </p>
      </header>

      <div className="max-w-md">
        <Input
          placeholder="Filtrar por título, artista, BPM ou tom…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-11"
        />
      </div>

      <Tabs defaultValue="songs">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="songs" className="gap-2"><Music2 className="h-4 w-4" /> Músicas</TabsTrigger>
          <TabsTrigger value="albums" className="gap-2"><Disc3 className="h-4 w-4" /> Álbuns</TabsTrigger>
          <TabsTrigger value="artists" className="gap-2"><Mic2 className="h-4 w-4" /> Artistas</TabsTrigger>
        </TabsList>

        <TabsContent value="songs" className="mt-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              Nenhuma faixa encontrada.
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
              {filtered.map((s) => (
                <SongCard key={s.id} song={s} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="albums" className="mt-6">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
            {mockAlbums.map((a) => (
              <div key={a.id} className="rounded-2xl bg-card border border-border/50 p-3 card-hover">
                <div className="aspect-square rounded-xl mb-3 shadow-card" style={{ background: a.cover }} />
                <div className="px-1">
                  <div className="font-semibold text-sm truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.artist}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{a.songCount} faixas · {a.year}</div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="artists" className="mt-6">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
            {mockArtists.map((a) => (
              <div key={a.id} className="rounded-2xl bg-card border border-border/50 p-3 card-hover text-center">
                <div className="aspect-square rounded-full mb-3 shadow-card mx-auto" style={{ background: a.cover }} />
                <div className="font-semibold text-sm truncate">{a.name}</div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {a.albumCount} álbuns · {a.songCount} faixas
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
