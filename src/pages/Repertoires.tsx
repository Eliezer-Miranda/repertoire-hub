import { useLibrary } from "@/store/useLibrary";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Calendar, User2, Music2, Trash2, Download, Radio } from "lucide-react";
import { Repertoire } from "@/types/music";
import { cn } from "@/lib/utils";
import { useState } from "react";

const serviceLabels = {
  manha: "Manhã",
  noite: "Noite",
  especial: "Especial",
  ensaio: "Ensaio",
};

export default function Repertoires() {
  const { repertoires, songs, deleteRepertoire } = useLibrary();
  const [params] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(
    params.get("id") || repertoires[0]?.id || null
  );
  const selected = repertoires.find((r) => r.id === selectedId);

  const exportTxt = (r: Repertoire) => {
    const lines = r.items
      .sort((a, b) => a.order - b.order)
      .map((it, i) => {
        const s = songs.find((x) => x.id === it.songId);
        if (!s) return "";
        return `${i + 1}. ${s.artist} - ${s.title}${s.key ? ` (${s.key})` : ""}${s.bpm ? ` [${s.bpm} BPM]` : ""}`;
      })
      .join("\n");
    const txt = `${r.name}\nMinistro: ${r.minister}\nData: ${new Date(r.date).toLocaleDateString("pt-BR")}\n\n${lines}`;
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full">
      <aside className="w-80 shrink-0 border-r border-border p-4 space-y-3 overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-lg">Repertórios</h2>
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/criar"><Plus className="h-4 w-4" /> Novo</Link>
          </Button>
        </div>
        {repertoires.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Nenhum repertório ainda.
          </div>
        )}
        {repertoires.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedId(r.id)}
            className={cn(
              "w-full text-left p-3 rounded-xl border transition-all",
              selectedId === r.id
                ? "bg-primary/10 border-primary/40 shadow-sm"
                : "bg-card border-border/50 hover:border-primary/30"
            )}
          >
            <div className="font-semibold text-sm truncate">{r.name}</div>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{new Date(r.date).toLocaleDateString("pt-BR")}</span>
              <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] uppercase font-semibold">
                {serviceLabels[r.service]}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
              <Music2 className="h-3 w-3" /> {r.items.length} faixas
            </div>
          </button>
        ))}
      </aside>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {selected ? (
          <div className="p-8 max-w-4xl space-y-6 animate-fade-in">
            <header className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-4xl font-bold">{selected.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5"><User2 className="h-4 w-4" /> {selected.minister || "—"}</span>
                    <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(selected.date).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">{serviceLabels[selected.service]}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <Link to="/performance"><Radio className="h-4 w-4" /> Performance</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => exportTxt(selected)}>
                    <Download className="h-4 w-4" /> Exportar
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => { deleteRepertoire(selected.id); setSelectedId(null); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              <div className="rounded-xl bg-card border border-border/50 p-4 font-mono text-xs">
                <div className="text-muted-foreground mb-1">Caminho de exportação SMB:</div>
                <div className="text-primary">/storage/vs/{selected.name.replace(/\s+/g, "_")}/</div>
              </div>
            </header>

            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              {selected.items
                .sort((a, b) => a.order - b.order)
                .map((it, i) => {
                  const s = songs.find((x) => x.id === it.songId);
                  if (!s) return null;
                  return (
                    <div key={it.songId} className="flex items-center gap-4 p-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <div className="w-8 text-center font-mono text-sm text-muted-foreground">{i + 1}</div>
                      <div className="h-12 w-12 rounded-md shrink-0" style={{ background: s.cover }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{s.title}</div>
                        <div className="text-sm text-muted-foreground truncate">{s.artist} · {s.album}</div>
                      </div>
                      <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
                        {s.key && <span className="px-2 py-1 rounded bg-primary/10 text-primary font-semibold">{s.key}</span>}
                        {s.bpm && <span className="text-muted-foreground">{s.bpm} BPM</span>}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Selecione um repertório à esquerda
          </div>
        )}
      </div>
    </div>
  );
}
