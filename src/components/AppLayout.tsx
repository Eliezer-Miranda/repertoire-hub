import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { PlayerBar } from "./PlayerBar";
import { ThemeToggle } from "./theme-toggle";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/40 backdrop-blur-xl flex items-center px-6 gap-4 shrink-0">
          <div className="relative flex-1 max-w-xl">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar músicas, artistas, álbuns…"
              className="pl-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>

        <PlayerBar />
      </div>
    </div>
  );
}
