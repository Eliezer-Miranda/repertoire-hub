import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Server, FolderOutput, Cpu, Code2 } from "lucide-react";

export default function Settings() {
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
