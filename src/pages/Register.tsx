import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "employee">("student");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (register(name, email, password, role)) {
      navigate("/dashboard");
    } else {
      setError("Email already registered.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elevated animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-display text-gradient">Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create password" required />
            </div>
            <div className="space-y-2">
              <Label>I am a</Label>
              <div className="flex gap-3">
                <Button type="button" variant={role === "student" ? "default" : "outline"} className={role === "student" ? "gradient-primary text-primary-foreground flex-1" : "flex-1"} onClick={() => setRole("student")}>Student</Button>
                <Button type="button" variant={role === "employee" ? "default" : "outline"} className={role === "employee" ? "gradient-primary text-primary-foreground flex-1" : "flex-1"} onClick={() => setRole("employee")}>Employee</Button>
              </div>
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full gradient-primary text-primary-foreground">Register</Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button onClick={() => navigate("/login")} className="text-primary hover:underline font-medium">Sign In</button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
