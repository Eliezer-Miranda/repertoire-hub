import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Music2, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";

const emailSchema = z
  .string()
  .trim()
  .email({ message: "E-mail inválido" })
  .max(255, { message: "E-mail muito longo" });

const passwordSchema = z
  .string()
  .min(8, { message: "Senha deve ter ao menos 8 caracteres" })
  .max(72, { message: "Senha muito longa (máx 72)" });

const nameSchema = z
  .string()
  .trim()
  .min(2, { message: "Nome muito curto" })
  .max(60, { message: "Nome muito longo" });

const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Informe a senha" }),
});

const signUpSchema = z.object({
  displayName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

const resetSchema = z.object({ email: emailSchema });

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup" | "reset">("signin");
  const [busy, setBusy] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";

  useEffect(() => {
    if (!authLoading && user) navigate(from, { replace: true });
  }, [user, authLoading, navigate, from]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos"
          : error.message
      );
      return;
    }
    toast.success("Bem-vindo de volta!");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse({ displayName, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { display_name: parsed.data.displayName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "Este e-mail já está cadastrado"
          : error.message
      );
      return;
    }
    toast.success("Conta criada!", {
      description: "Confirme seu e-mail para ativar (ou faça login se a confirmação estiver desativada).",
    });
    setTab("signin");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = resetSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Verifique seu e-mail para redefinir a senha");
    setTab("signin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/10">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Music2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="font-display text-3xl font-bold">VS Music</h1>
          <p className="text-sm text-muted-foreground">
            Entre para acessar repertórios e a biblioteca
          </p>
        </div>

        <Card className="p-6 shadow-card">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4 mt-4">
              {tab === "reset" ? null : (
                <form onSubmit={handleSignIn} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="si-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="si-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        maxLength={255}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="si-pass">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="si-pass"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9"
                        maxLength={72}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={busy} className="w-full bg-gradient-primary shadow-glow">
                    {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Entrar
                  </Button>
                  <button
                    type="button"
                    onClick={() => setTab("reset")}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors w-full text-center"
                  >
                    Esqueci minha senha
                  </button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-4">
              <form onSubmit={handleSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="su-name">Nome de exibição</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="su-name"
                      type="text"
                      autoComplete="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-9"
                      maxLength={60}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="su-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      maxLength={255}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="su-pass">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="su-pass"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                      maxLength={72}
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Mínimo 8 caracteres</p>
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-gradient-primary shadow-glow">
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {tab === "reset" && (
            <form onSubmit={handleReset} className="space-y-3 mt-4">
              <div className="space-y-1.5">
                <Label htmlFor="rs-email">E-mail para recuperação</Label>
                <Input
                  id="rs-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setTab("signin")}>
                  Voltar
                </Button>
                <Button type="submit" disabled={busy} className="flex-1 bg-gradient-primary">
                  {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar link
                </Button>
              </div>
            </form>
          )}
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          Ao continuar, você concorda em manter suas credenciais seguras.
        </p>
      </div>
    </div>
  );
}
