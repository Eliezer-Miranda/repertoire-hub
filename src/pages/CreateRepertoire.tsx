import { useEffect, useMemo, useState } from "react";
import { useLibrary } from "@/store/useLibrary";
import { SongCard } from "@/components/SongCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Save, Music2, Activity, Sliders, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Song, RepertoireItem } from "@/types/music";
import { AlbumThumb } from "@/components/AlbumThumb";
import { Switch } from "@/components/ui/switch";
import { ALL_KEYS, listPads, type MusicalKey } from "@/lib/padsStore";
import { renderClickWav, sanitizeFilename } from "@/lib/clickWav";
import { toUnc, padUnc, clickUncForSong } from "@/lib/networkPaths";

type ClickConfig = { bpm: number; timeSignature: "2/4" | "3/4" | "4/4" | "6/8"; enabled: boolean };

function SortableRow({
  song,
  click,
  onChange,
  onRemove,
}: {
  song: Song;
  click: ClickConfig;
  onChange: (c: ClickConfig) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: song.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl bg-card border border-border/50 hover:border-primary/40 transition-colors overflow-hidden"
    >
      <div className="flex items-center gap-3 p-2.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <AlbumThumb
          artist={song.artist}
          album={song.album}
          fallback={song.cover}
          className="h-10 w-10 rounded-md shadow-card"
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{song.title}</div>
          <div className="text-xs text-muted-foreground truncate">{song.artist}</div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-2.5 pb-2.5 pt-0 flex items-center gap-2 border-t border-border/40 bg-muted/30">
        <div className="flex items-center gap-1.5 pl-1">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Click</span>
        </div>
        <Switch
          checked={click.enabled}
          onCheckedChange={(v) => onChange({ ...click, enabled: v })}
          className="scale-75 -ml-1"
        />
        <Input
          type="number"
          min={40}
          max={240}
          value={click.bpm}
          onChange={(e) => onChange({ ...click, bpm: parseInt(e.target.value) || 0 })}
          disabled={!click.enabled}
          className="h-7 w-16 text-xs font-mono px-2"
        />
        <span className="text-[10px] text-muted-foreground">BPM</span>
        <Select
          value={click.timeSignature}
          onValueChange={(v) => onChange({ ...click, timeSignature: v as ClickConfig["timeSignature"] })}
          disabled={!click.enabled}
        >
          <SelectTrigger className="h-7 w-[70px] text-xs font-mono ml-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2/4">2/4</SelectItem>
            <SelectItem value="3/4">3/4</SelectItem>
            <SelectItem value="4/4">4/4</SelectItem>
            <SelectItem value="6/8">6/8</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function CreateRepertoire() {
  const { songs, addRepertoire } = useLibrary();
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clicks, setClicks] = useState<Record<string, ClickConfig>>({});
  const [name, setName] = useState("");
  const [minister, setMinister] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [service, setService] = useState<"manha" | "noite" | "especial" | "ensaio">("manha");

  // Pad+Click globais aplicados a todas as faixas selecionadas
  const [padKey, setPadKey] = useState<MusicalKey>("C");
  const [globalBpm, setGlobalBpm] = useState(90);
  const [globalSig, setGlobalSig] = useState<"2/4" | "3/4" | "4/4" | "6/8">("4/4");
  const [availablePads, setAvailablePads] = useState<Record<string, { name: string; size: number }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listPads().then(setAvailablePads);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filtered = useMemo(() => {
    const t = q.toLowerCase().trim();
    if (!t) return songs;
    return songs.filter(
      (s) => s.title.toLowerCase().includes(t) || s.artist.toLowerCase().includes(t)
    );
  }, [q, songs]);

  const selectedSongs = selectedIds
    .map((id) => songs.find((s) => s.id === id))
    .filter((s): s is Song => Boolean(s));

  const toggleSelect = (id: string) => {
    setSelectedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    setClicks((cur) => {
      if (cur[id]) return cur;
      const song = songs.find((s) => s.id === id);
      return {
        ...cur,
        [id]: {
          bpm: song?.bpm ?? globalBpm,
          timeSignature: globalSig,
          enabled: true,
        },
      };
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = selectedIds.indexOf(active.id as string);
    const newIdx = selectedIds.indexOf(over.id as string);
    setSelectedIds(arrayMove(selectedIds, oldIdx, newIdx));
  };

  const applyGlobalToAll = () => {
    setClicks((cur) => {
      const next = { ...cur };
      for (const id of selectedIds) {
        next[id] = { bpm: globalBpm, timeSignature: globalSig, enabled: true };
      }
      return next;
    });
    toast.success("Click aplicado a todas as faixas selecionadas");
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const onSave = async () => {
    if (!name.trim()) {
      toast.error("Informe um nome para o repertório.");
      return;
    }
    if (selectedIds.length === 0) {
      toast.error("Selecione ao menos uma música.");
      return;
    }

    const items: RepertoireItem[] = selectedIds.map((sid, order) => {
      const c = clicks[sid];
      return {
        songId: sid,
        order,
        clickBpm: c?.bpm,
        timeSignature: c?.timeSignature,
        clickEnabled: c?.enabled ?? false,
      };
    });

    const id = addRepertoire({
      name,
      minister,
      date: new Date(date).toISOString(),
      service,
      items,
    });

    setSaving(true);

    try {
      const folderPrefix = sanitizeFilename(name);

      // Monta manifesto JSON com caminhos de rede (UNC) para o Reaper/Lua
      const manifestTracks = [];
      let clickCount = 0;

      for (let i = 0; i < selectedSongs.length; i++) {
        const song = selectedSongs[i];
        const cfg = clicks[song.id] ?? { bpm: globalBpm, timeSignature: globalSig, enabled: true };
        const order = String(i + 1).padStart(2, "0");
        const baseName = sanitizeFilename(`${order}_${song.artist}-${song.title}`);

        const songUnc = toUnc(song.filePath);
        const padPath = padUnc(padKey);
        const clickPath = cfg.enabled ? clickUncForSong(song.filePath) : null;

        manifestTracks.push({
          order: i + 1,
          title: song.title,
          artist: song.artist,
          album: song.album,
          duration: song.duration,
          key: song.key ?? null,
          bpm: song.bpm ?? null,
          paths: {
            song: songUnc,
            pad: padPath,
            click: clickPath,
          },
          click: cfg.enabled
            ? { bpm: cfg.bpm, timeSignature: cfg.timeSignature }
            : null,
          padKey,
        });

        // Gera o WAV do click localmente para o usuário enviar ao destino indicado em paths.click
        if (cfg.enabled) {
          const blob = await renderClickWav({
            bpm: cfg.bpm,
            timeSignature: cfg.timeSignature,
            durationSec: song.duration,
          });
          triggerDownload(blob, `${folderPrefix}__${baseName}_click.wav`);
          clickCount++;
        }
      }

      const manifest = {
        version: 1,
        repertoire: {
          id,
          name,
          minister,
          date: new Date(date).toISOString(),
          service,
        },
        padKey,
        tracks: manifestTracks,
        generatedAt: new Date().toISOString(),
      };

      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: "application/json",
      });
      triggerDownload(manifestBlob, `${folderPrefix}.json`);

      toast.success(`Repertório "${name}" criado!`, {
        description: `JSON gerado com ${manifestTracks.length} faixas + ${clickCount} click(s) WAV.`,
      });
    } catch (e) {
      toast.error("Erro ao gerar manifesto", { description: String(e) });
    } finally {
      setSaving(false);
      navigate(`/repertorios?id=${id}`);
    }
  };

  const padAvailable = !!availablePads[padKey];

  return (
    <div className="flex flex-col lg:flex-row min-h-full">
      <section className="flex-1 p-6 lg:p-8 space-y-5 border-r border-border min-w-0">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Criar repertório</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Selecione faixas. Será gerado um <code className="text-primary font-mono text-xs">manifesto.json</code> com os caminhos de rede dos arquivos para o Reaper/Lua localizar — sem copiar áudios.
          </p>
        </div>

        <Input
          placeholder="Buscar faixas para adicionar…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-11 max-w-md"
        />

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filtered.map((s) => (
            <SongCard
              key={s.id}
              song={s}
              selectable
              selected={selectedIds.includes(s.id)}
              onToggleSelect={() => toggleSelect(s.id)}
            />
          ))}
        </div>
      </section>

      <aside className="w-full lg:w-[420px] shrink-0 bg-card/50 backdrop-blur p-6 space-y-5">
        <div>
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Repertório
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Culto Domingo Manhã" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min">Ministro</Label>
              <Input id="min" value={minister} onChange={(e) => setMinister(e.target.value)} placeholder="Nome do ministro" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dt">Data</Label>
                <Input id="dt" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Culto</Label>
                <Select value={service} onValueChange={(v) => setService(v as typeof service)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                    <SelectItem value="especial">Especial</SelectItem>
                    <SelectItem value="ensaio">Ensaio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Painel global Pad + Click */}
        <Card className="p-3 space-y-3 border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider">Pad & Click (faixa global)</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px]">Pad / Tom</Label>
              <Select value={padKey} onValueChange={(v) => setPadKey(v as MusicalKey)}>
                <SelectTrigger className="h-8 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>
                      <span className="font-mono">{k}</span>
                      {availablePads[k] && <span className="text-success ml-2">●</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1 text-[10px]">
                {padAvailable ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    <span className="text-muted-foreground truncate">{availablePads[padKey].name}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 text-warning" />
                    <span className="text-warning">Sem pad para {padKey}</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px]">Compasso</Label>
              <Select value={globalSig} onValueChange={(v) => setGlobalSig(v as typeof globalSig)}>
                <SelectTrigger className="h-8 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2/4">2/4</SelectItem>
                  <SelectItem value="3/4">3/4</SelectItem>
                  <SelectItem value="4/4">4/4</SelectItem>
                  <SelectItem value="6/8">6/8</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="space-y-1 flex-1">
              <Label className="text-[11px]">BPM (click)</Label>
              <Input
                type="number"
                min={40}
                max={240}
                value={globalBpm}
                onChange={(e) => setGlobalBpm(parseInt(e.target.value) || 0)}
                className="h-8 text-xs font-mono"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={applyGlobalToAll}
              disabled={selectedIds.length === 0}
            >
              Aplicar a todas
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground leading-tight">
            Ao salvar é gerado um JSON com os caminhos UNC (<code className="text-primary font-mono">\\192.168.2.177\storage\…</code>) das músicas e do pad selecionado, mais um WAV de click por faixa.
          </p>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Faixas selecionadas
            </div>
            <span className="text-xs font-mono text-primary">{selectedIds.length}</span>
          </div>

          {selectedSongs.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
              <Music2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <div className="text-sm text-muted-foreground">
                Nenhuma faixa selecionada
              </div>
              <div className="text-xs text-muted-foreground/70 mt-1">
                Clique no <span className="text-primary">+</span> nas faixas
              </div>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 max-h-[40vh] overflow-y-auto scrollbar-thin pr-1">
                  {selectedSongs.map((s) => (
                    <SortableRow
                      key={s.id}
                      song={s}
                      click={clicks[s.id] ?? { bpm: s.bpm ?? globalBpm, timeSignature: globalSig, enabled: true }}
                      onChange={(c) => setClicks((cur) => ({ ...cur, [s.id]: c }))}
                      onRemove={() => toggleSelect(s.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <Button
          size="lg"
          className="w-full bg-gradient-primary hover:opacity-90 shadow-glow font-semibold gap-2"
          onClick={onSave}
          disabled={saving}
        >
          <Save className="h-4 w-4" />
          {saving ? "Gerando arquivos…" : "Salvar repertório"}
        </Button>
      </aside>
    </div>
  );
}
