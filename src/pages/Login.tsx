import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import perfyLogo from "@/assets/perfy-logo.jpeg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(email, password)) {
      const user = JSON.parse(localStorage.getItem("mm_user") || "{}");
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } else {
      setError("Invalid credentials. Try a demo email or register.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/5 animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-secondary/5 animate-[pulse_5s_ease-in-out_infinite_1s]" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-primary/3 animate-[pulse_6s_ease-in-out_infinite_2s]" />
      </div>

      <Card className="w-full max-w-md shadow-elevated animate-scale-in relative z-10 border-primary/10">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <img
              src={perfyLogo}
              alt="Perfy"
              className="h-24 w-24 rounded-2xl shadow-lg animate-fade-in object-cover"
            />
          </div>
          <CardTitle className="text-3xl font-display text-gradient animate-fade-in">Sign In</CardTitle>
          <p className="text-muted-foreground text-sm mt-2 animate-fade-in">Perfy — From Effort to Impact</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="h-11" />
            </div>
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: "200ms" }}>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Any password" required className="h-11" />
            </div>
            {error && <p className="text-destructive text-sm animate-fade-in">{error}</p>}
            <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
              <Button type="submit" className="w-full h-11 gradient-primary text-primary-foreground text-base font-display hover-scale">Sign In</Button>
            </div>
          </form>
          <div className="mt-5 text-center animate-fade-in" style={{ animationDelay: "400ms" }}>
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button onClick={() => navigate("/register")} className="text-primary hover:underline font-medium">Register</button>
            </p>
          </div>
          <div className="mt-4 p-4 rounded-xl bg-muted/80 text-xs text-muted-foreground animate-fade-in border" style={{ animationDelay: "500ms" }}>
            <p className="font-semibold mb-1.5 text-foreground">Demo Accounts:</p>
            <p>Admin: admin@admin.com</p>
            <p>Users: john@example.com, sarah@example.com</p>
            <p className="mt-1.5 italic opacity-70">Use any password</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
