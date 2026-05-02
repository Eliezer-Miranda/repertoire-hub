import { useLibrary } from "@/store/useLibrary";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Calendar, User2, Music2, Trash2, Download, Activity, Loader2, FileAudio } from "lucide-react";
import { Repertoire } from "@/types/music";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { AlbumThumb } from "@/components/AlbumThumb";
import { renderClickWav, downloadBlob, sanitizeFilename } from "@/lib/clickWav";
import { toast } from "sonner";

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
  const [rendering, setRendering] = useState<string | null>(null);
  const [renderingAll, setRenderingAll] = useState(false);

  const generateClickFor = async (songId: string) => {
    if (!selected) return;
    const item = selected.items.find((i) => i.songId === songId);
    const song = songs.find((s) => s.id === songId);
    if (!item || !song) return;
    const bpm = item.clickBpm ?? song.bpm ?? 90;
    const ts = item.timeSignature ?? "4/4";
    setRendering(songId);
    try {
      const blob = await renderClickWav({
        bpm,
        timeSignature: ts,
        durationSec: song.duration,
      });
      const fname = `${sanitizeFilename(song.artist)}-${sanitizeFilename(song.title)}_click_${bpm}bpm_${ts.replace("/", "-")}.wav`;
      downloadBlob(blob, fname);
      toast.success("Trilha de click gerada", {
        description: `${fname} (${bpm} BPM · ${ts} · ${Math.round(song.duration)}s)`,
      });
    } catch (e) {
      toast.error("Falha ao gerar WAV", { description: String(e) });
    } finally {
      setRendering(null);
    }
  };

  const generateAllClicks = async () => {
    if (!selected) return;
    setRenderingAll(true);
    let count = 0;
    try {
      for (const item of [...selected.items].sort((a, b) => a.order - b.order)) {
        const song = songs.find((s) => s.id === item.songId);
        if (!song) continue;
        if (item.clickEnabled === false) continue;
        const bpm = item.clickBpm ?? song.bpm ?? 90;
        const ts = item.timeSignature ?? "4/4";
        const blob = await renderClickWav({
          bpm,
          timeSignature: ts,
          durationSec: song.duration,
        });
        const fname = `${String(item.order + 1).padStart(2, "0")}_${sanitizeFilename(song.artist)}-${sanitizeFilename(song.title)}_click.wav`;
        downloadBlob(blob, fname);
        count += 1;
        // pequena pausa para o navegador processar os downloads
        await new Promise((r) => setTimeout(r, 250));
      }
      toast.success(`${count} trilha(s) de click geradas`);
    } catch (e) {
      toast.error("Falha ao gerar trilhas", { description: String(e) });
    } finally {
      setRenderingAll(false);
    }
  };

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
                <div className="flex flex-wrap gap-2 shrink-0 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={generateAllClicks}
                    disabled={renderingAll}
                  >
                    {renderingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileAudio className="h-4 w-4" />}
                    Gerar clicks (.wav)
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
                <div className="text-muted-foreground mb-1">Manifesto JSON gerado para Reaper/Lua:</div>
                <div className="text-primary">{`\\\\192.168.2.177\\storage\\…  →  ${selected.name.replace(/\s+/g, "_")}.json`}</div>
              </div>
            </header>

            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              {selected.items
                .sort((a, b) => a.order - b.order)
                .map((it, i) => {
                  const s = songs.find((x) => x.id === it.songId);
                  if (!s) return null;
                  const clickBpm = it.clickBpm ?? s.bpm ?? 90;
                  const ts = it.timeSignature ?? "4/4";
                  const clickOn = it.clickEnabled !== false;
                  const isRendering = rendering === it.songId;
                  return (
                    <div key={it.songId} className="flex items-center gap-4 p-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <div className="w-8 text-center font-mono text-sm text-muted-foreground">{i + 1}</div>
                      <AlbumThumb
                        artist={s.artist}
                        album={s.album}
                        fallback={s.cover}
                        className="h-12 w-12 rounded-md shadow-card"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{s.title}</div>
                        <div className="text-sm text-muted-foreground truncate">{s.artist} · {s.album}</div>
                      </div>
                      <div className="hidden md:flex items-center gap-3 text-xs font-mono">
                        {s.key && <span className="px-2 py-1 rounded bg-primary/10 text-primary font-semibold">{s.key}</span>}
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-1 rounded font-semibold",
                            clickOn ? "bg-accent/40 text-foreground" : "bg-muted/40 text-muted-foreground line-through"
                          )}
                          title={clickOn ? "Click ativado" : "Click desativado"}
                        >
                          <Activity className="h-3 w-3" />
                          {clickBpm} BPM · {ts}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Baixar trilha de click (.wav)"
                        onClick={() => generateClickFor(it.songId)}
                        disabled={isRendering}
                      >
                        {isRendering ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileAudio className="h-4 w-4" />
                        )}
                      </Button>
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
