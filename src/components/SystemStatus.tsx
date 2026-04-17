import { useEffect, useState } from "react";
import { Cpu, MemoryStick, HardDrive, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

type Stat = {
  label: string;
  value: number; // 0-100 for cpu/mem/disk; for net we show as % of 100Mbps
  icon: typeof Cpu;
  detail: string;
};

function useMockSystemStats() {
  const [cpu, setCpu] = useState(28);
  const [mem, setMem] = useState(54);
  const [disk] = useState(67);
  const [netDown, setNetDown] = useState(12); // Mbps
  const [netUp, setNetUp] = useState(3);

  useEffect(() => {
    const id = setInterval(() => {
      setCpu((v) => Math.max(5, Math.min(95, v + (Math.random() - 0.5) * 18)));
      setMem((v) => Math.max(20, Math.min(92, v + (Math.random() - 0.5) * 6)));
      setNetDown(() => Math.max(0.2, Math.random() * 80));
      setNetUp(() => Math.max(0.1, Math.random() * 20));
    }, 1500);
    return () => clearInterval(id);
  }, []);

  const stats: Stat[] = [
    { label: "CPU", value: cpu, icon: Cpu, detail: `${cpu.toFixed(0)}%` },
    { label: "RAM", value: mem, icon: MemoryStick, detail: `${mem.toFixed(0)}%` },
    { label: "Disco", value: disk, icon: HardDrive, detail: `${disk}%` },
    {
      label: "Rede",
      value: Math.min(100, (netDown / 100) * 100),
      icon: Wifi,
      detail: `↓${netDown.toFixed(1)} ↑${netUp.toFixed(1)} Mbps`,
    },
  ];
  return stats;
}

function barColor(v: number) {
  if (v < 50) return "bg-success";
  if (v < 80) return "bg-accent";
  return "bg-destructive";
}

export function SystemStatus() {
  const stats = useMockSystemStats();

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <div className="hidden sm:flex items-center gap-1.5 pr-3 border-r border-border">
        <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
        <span className="text-[11px] text-muted-foreground font-mono">SMB online</span>
      </div>
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border/60 min-w-0"
          title={`${s.label}: ${s.detail}`}
        >
          <s.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div className="hidden md:flex flex-col min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </span>
              <span className="text-[11px] font-mono text-foreground truncate">{s.detail}</span>
            </div>
            <div className="h-1 w-24 lg:w-28 bg-border/60 rounded-full overflow-hidden mt-0.5">
              <div
                className={cn("h-full rounded-full transition-all duration-700", barColor(s.value))}
                style={{ width: `${Math.min(100, Math.max(2, s.value))}%` }}
              />
            </div>
          </div>
          <span className="md:hidden text-[11px] font-mono text-foreground">{s.detail}</span>
        </div>
      ))}
    </div>
  );
}
