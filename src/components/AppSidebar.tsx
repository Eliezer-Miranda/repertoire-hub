import { NavLink } from "react-router-dom";
import { Library, ListMusic, Settings, Music2, Star, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Biblioteca", icon: Library, end: true },
  { to: "/repertorios", label: "Repertórios", icon: ListMusic },
  { to: "/criar", label: "Criar Repertório", icon: Music2 },
  { to: "/favoritos", label: "Favoritos", icon: Star },
  { to: "/performance", label: "Modo Performance", icon: Radio },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function AppSidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
          <Music2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-display font-bold text-base leading-none">MusicLib</div>
          <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">Live Performance</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 scrollbar-thin overflow-y-auto">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <it.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                <span>{it.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-xl p-3 bg-gradient-primary/10 border border-primary/20">
          <div className="text-xs font-semibold text-foreground">Servidor SMB</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">/storage/biblioteca</div>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] text-muted-foreground">Modo demonstração</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
