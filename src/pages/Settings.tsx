import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Server, FolderOutput, Cpu, Code2, Music, Upload, Trash2, CheckCircle2 } from "lucide-react";
import { ALL_KEYS, deletePad, listPads, savePad, type MusicalKey } from "@/lib/padsStore";
import { toast } from "sonner";

export default function Settings() {
  const [pads, setPads] = useState<Record<string, { name: string; size: number }>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const refresh = async () => setPads(await listPads());
  useEffect(() => {
    refresh();
  }, []);

  const onPick = (key: MusicalKey) => inputRefs.current[key]?.click();

  const onFile = async (key: MusicalKey, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("audio/") && !/\.(wav|mp3|ogg|flac|m4a)$/i.test(file.name)) {
      toast.error("Selecione um arquivo de áudio.");
      return;
    }
    try {
      await savePad(key, file);
      await refresh();
      toast.success(`Pad ${key} salvo`);
    } catch (e) {
      toast.error("Falha ao salvar pad", { description: String(e) });
    }
  };

  const onDelete = async (key: MusicalKey) => {
    await deletePad(key);
    await refresh();
    toast.success(`Pad ${key} removido`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6 animate-fade-in">
      <header>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ajustes do agente local e integração com o Reaper.
        </p>
      </header>

      <Card className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Music className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold">Pads por tom</h2>
            <p className="text-xs text-muted-foreground">
              Envie um arquivo de pad para cada tonalidade. Esses arquivos serão copiados para a pasta{" "}
              <code className="text-primary font-mono">click/</code> de cada música ao salvar o repertório.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2">
          {ALL_KEYS.map((k) => {
            const has = !!pads[k];
            return (
              <div
                key={k}
                className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-muted/20"
              >
                <div className="w-10 h-10 rounded-md bg-card flex items-center justify-center font-mono font-bold text-sm shrink-0">
                  {k}
                </div>
                <div className="flex-1 min-w-0">
                  {has ? (
                    <>
                      <div className="flex items-center gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                        <span className="truncate font-medium">{pads[k].name}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {(pads[k].size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground italic">Sem arquivo</div>
                  )}
                </div>
                <input
                  ref={(el) => (inputRefs.current[k] = el)}
                  type="file"
                  accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a"
                  className="hidden"
                  onChange={(e) => onFile(k, e.target.files?.[0] ?? null)}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onPick(k)}>
                  <Upload className="h-3.5 w-3.5" />
                </Button>
                {has && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(k)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Servidor SMB</h2>
            <p className="text-xs text-muted-foreground">Caminhos da biblioteca e da pasta de execução.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label>Biblioteca</Label>
            <Input defaultValue="/storage/biblioteca" className="font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label>Pasta de execução (Reaper)</Label>
            <Input defaultValue="/storage/vs" className="font-mono text-sm" />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Cpu className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Análise automática</h2>
            <p className="text-xs text-muted-foreground">Detecção de BPM e tom (executada pelo agente local).</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <Label>Engine</Label>
            <Input defaultValue="librosa" className="font-mono text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label>Workers</Label>
            <Input type="number" defaultValue={4} />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FolderOutput className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Padrão de nomeação</h2>
            <p className="text-xs text-muted-foreground">Como os arquivos serão organizados ao copiar.</p>
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3 font-mono text-xs">
          {"{Artista} - {Música} - {Tom} - {BPM}.{ext}"}
        </div>
      </Card>

      <Card className="p-6 space-y-3 border-primary/30 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Code2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Agente local Ubuntu</h2>
            <p className="text-xs text-muted-foreground">
              Para conectar a biblioteca real, rode um pequeno serviço no servidor que exponha esta API REST.
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-background p-3 font-mono text-[11px] text-muted-foreground space-y-1 mt-2">
          <div><span className="text-success">GET</span>  /api/library          → indexação</div>
          <div><span className="text-success">GET</span>  /api/songs/:id/audio  → stream</div>
          <div><span className="text-accent">POST</span> /api/repertoires      → cria + copia</div>
          <div><span className="text-success">GET</span>  /api/analyze/:id      → BPM + tom</div>
        </div>
        <Button variant="outline" className="w-full mt-2">Testar conexão (em breve)</Button>
      </Card>
    </div>
  );
}
