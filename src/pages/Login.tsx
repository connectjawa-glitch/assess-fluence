import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BrainLogo } from "@/components/BrainLogo";
import { ArrowRight, Mail, Lock, Sparkles, Shield, KeyRound } from "lucide-react";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const trial = searchParams.get("trial") === "1";
  const prefillEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState(trial ? "trial" : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (prefillEmail) setEmail(prefillEmail); }, [prefillEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (login(email, password)) {
        const user = JSON.parse(localStorage.getItem("mm_user") || "{}");
        const dest =
          user.role === "admin" ? "/admin" :
          user.role === "company" ? "/company" :
          user.role === "institution" ? "/institution" :
          "/dashboard";
        navigate(dest);
      } else {
        setError("Invalid credentials. Try a demo email or register.");
        setLoading(false);
      }
    }, 250);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-secondary/10 animate-[pulse_5s_ease-in-out_infinite_1s]" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-accent/10 animate-[pulse_6s_ease-in-out_infinite_2s]" />
      </div>

      <Card className="w-full max-w-4xl shadow-elevated animate-scale-in relative z-10 border-primary/10 overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left brand panel */}
          <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-primary/15 via-background to-secondary/15 border-r">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <BrainLogo size={56} animated />
                <div>
                  <p className="font-display font-bold text-lg leading-tight">Perfy</p>
                  <p className="text-xs text-muted-foreground">From Effort to Impact</p>
                </div>
              </div>
              <h2 className="text-2xl font-display font-bold leading-tight mb-3">
                Discover the science behind <span className="text-gradient">your mind</span>.
              </h2>
              <p className="text-sm text-muted-foreground">
                Sign in to access your personality &amp; intelligence reports, dashboards, and growth roadmap.
              </p>
            </div>
            <ul className="space-y-3 text-sm mt-8">
              <li className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>20+ page deep interpretation report with charts</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>Confidential. Encrypted. Yours.</span>
              </li>
            </ul>
          </div>

          {/* Right form panel */}
          <div>
            <CardHeader className="text-center pb-2 md:hidden">
              <div className="flex justify-center mb-4">
                <BrainLogo size={90} animated />
              </div>
            </CardHeader>
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl md:text-3xl font-display text-gradient">Welcome Back</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">Sign in to continue your journey</p>
              {trial && (
                <div className="mt-3 rounded-lg border-2 border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 flex items-center gap-2 animate-fade-in">
                  <KeyRound className="w-3.5 h-3.5" /> <span><strong>Trial access detected.</strong> Sign in with any password — your account is auto-created and your report is unlocked.</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider">Email</Label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-11 pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider">Password</Label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Any password"
                      required
                      className="h-11 pl-9"
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-destructive text-sm bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2 animate-fade-in">
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 gradient-primary text-primary-foreground text-base font-display gap-2 hover:opacity-90"
                >
                  {loading ? "Signing in..." : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                </Button>
              </form>
              <div className="mt-5 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <button onClick={() => navigate("/register")} className="text-primary hover:underline font-semibold">
                    Create one
                  </button>
                </p>
              </div>
              <div className="mt-4 p-3.5 rounded-xl bg-muted/60 text-xs text-muted-foreground border">
                <p className="font-semibold mb-1.5 text-foreground">Demo Accounts:</p>
                <p>Admin: admin@admin.com</p>
                <p>Users: john@example.com, sarah@example.com</p>
                <p>Company Portal: hr@tech001.com, hr@gfl002.com, hr@hf003.com</p>
                <p>Institution Portal: admin@sch001.com, admin@col002.com, admin@trn003.com</p>
                <p className="mt-1.5 italic opacity-70">Use any password</p>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
}
