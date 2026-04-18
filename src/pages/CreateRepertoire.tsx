import { useMemo, useState } from "react";
import { useLibrary } from "@/store/useLibrary";
import { SongCard } from "@/components/SongCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { GripVertical, X, Save, Music2, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Song, RepertoireItem } from "@/types/music";
import { AlbumThumb } from "@/components/AlbumThumb";
import { Switch } from "@/components/ui/switch";

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
  const [name, setName] = useState("");
  const [minister, setMinister] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [service, setService] = useState<"manha" | "noite" | "especial" | "ensaio">("manha");

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
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = selectedIds.indexOf(active.id as string);
    const newIdx = selectedIds.indexOf(over.id as string);
    setSelectedIds(arrayMove(selectedIds, oldIdx, newIdx));
  };

  const onSave = () => {
    if (!name.trim()) {
      toast.error("Informe um nome para o repertório.");
      return;
    }
    if (selectedIds.length === 0) {
      toast.error("Selecione ao menos uma música.");
      return;
    }
    const id = addRepertoire({
      name,
      minister,
      date: new Date(date).toISOString(),
      service,
      items: selectedIds.map((sid, order) => ({ songId: sid, order })),
    });
    toast.success(`Repertório "${name}" criado!`, {
      description: `${selectedIds.length} faixas serão copiadas para /storage/vs/${name}/`,
    });
    navigate(`/repertorios?id=${id}`);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-full">
      <section className="flex-1 p-6 lg:p-8 space-y-5 border-r border-border min-w-0">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Criar repertório</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Selecione faixas da biblioteca. Os arquivos serão copiados para <code className="text-primary font-mono text-xs">/storage/vs/</code> mantendo a estrutura para o Reaper.
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
                    <SortableRow key={s.id} song={s} onRemove={() => toggleSelect(s.id)} />
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
        >
          <Save className="h-4 w-4" />
          Salvar repertório
        </Button>
      </aside>
    </div>
  );
}
