import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elevated animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display text-gradient">Sign In</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">Mind Mapping & Assessment Portal</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Any password" required />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full gradient-primary text-primary-foreground">Sign In</Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button onClick={() => navigate("/register")} className="text-primary hover:underline font-medium">Register</button>
            </p>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted text-xs text-muted-foreground">
            <p className="font-medium mb-1">Demo Accounts:</p>
            <p>Admin: admin@admin.com</p>
            <p>Users: john@example.com, sarah@example.com</p>
            <p className="mt-1 italic">Use any password</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
