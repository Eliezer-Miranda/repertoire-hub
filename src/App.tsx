import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Library from "./pages/Library";
import Repertoires from "./pages/Repertoires";
import CreateRepertoire from "./pages/CreateRepertoire";
import Favorites from "./pages/Favorites";
import Performance from "./pages/Performance";
import SettingsPage from "./pages/Settings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Rotas (login desativado) */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<Library />} />
                <Route path="/repertorios" element={<Repertoires />} />
                <Route path="/criar" element={<CreateRepertoire />} />
                <Route path="/favoritos" element={<Favorites />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/configuracoes" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
