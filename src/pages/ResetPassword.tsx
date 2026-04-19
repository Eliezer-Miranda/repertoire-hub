import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Music2, Lock, Loader2 } from "lucide-react";

const passwordSchema = z
  .string()
  .min(8, { message: "Senha deve ter ao menos 8 caracteres" })
  .max(72, { message: "Senha muito longa" });

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [validSession, setValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    // Supabase coloca o token no hash; precisamos confirmar que há sessão de recovery
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
        setValidSession(true);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setValidSession(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não conferem");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Senha atualizada");
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/10">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-xl bg-gradient-primary items-center justify-center shadow-glow">
            <Music2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold">Nova senha</h1>
        </div>

        <Card className="p-6 shadow-card">
          {validSession === false ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Link inválido ou expirado. Solicite um novo link de recuperação.
              </p>
              <Button onClick={() => navigate("/auth")} className="w-full">
                Voltar para login
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="np">Nova senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="np"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9"
                    maxLength={72}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="cf"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-9"
                    maxLength={72}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={busy} className="w-full bg-gradient-primary shadow-glow">
                {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Atualizar senha
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
