import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type Company } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, GraduationCap, Briefcase, School } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"student" | "employee">("student");
  const [companyCode, setCompanyCode] = useState("");
  const [department, setDepartment] = useState("");
  const [school, setSchool] = useState("");
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const { register, getCompanies } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setCompanies(getCompanies());
  }, [getCompanies]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (role === "employee" && !companyCode) {
      setError("Please select your company.");
      return;
    }

    if (role === "student" && !school) {
      setError("Please enter your school/college name.");
      return;
    }

    const success = register({
      name, email, password, role, phone,
      companyCode: role === "employee" ? companyCode : undefined,
      department: role === "employee" ? department : undefined,
      school: role === "student" ? school : undefined,
    });

    if (success) {
      navigate("/dashboard");
    } else {
      setError("Email already registered or invalid company code.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-elevated animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="text-4xl mb-2">🧠</div>
          <CardTitle className="text-2xl font-display text-gradient">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Mind Mapping & Assessment Portal</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>I am a</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setRole("student"); setCompanyCode(""); }}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    role === "student"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <GraduationCap className={`w-6 h-6 ${role === "student" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <p className={`font-medium text-sm ${role === "student" ? "text-primary" : "text-foreground"}`}>🎓 Student</p>
                    <p className="text-xs text-muted-foreground">Learning assessment</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setRole("employee"); setSchool(""); }}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    role === "employee"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <Briefcase className={`w-6 h-6 ${role === "employee" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <p className={`font-medium text-sm ${role === "employee" ? "text-primary" : "text-foreground"}`}>💼 Employee</p>
                    <p className="text-xs text-muted-foreground">Performance system</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 890" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create password" required />
            </div>

            {role === "student" && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <School className="w-4 h-4 text-primary" />
                  🏫 School / College Details
                </div>
                <div className="space-y-2">
                  <Label>School / College Name <span className="text-destructive">*</span></Label>
                  <Input value={school} onChange={e => setSchool(e.target.value)} placeholder="e.g., Springfield High School, MIT" required />
                  <p className="text-xs text-muted-foreground">Enter your current school or college name</p>
                </div>
              </div>
            )}

            {role === "employee" && (
              <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Building2 className="w-4 h-4 text-primary" />
                  🏢 Company Details
                </div>
                <div className="space-y-2">
                  <Label>Company Code <span className="text-destructive">*</span></Label>
                  <Select value={companyCode} onValueChange={setCompanyCode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.code}>
                          <span className="font-medium">{c.name}</span>
                          <span className="text-muted-foreground ml-2">({c.code})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Ask your HR for the company code</p>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g., Engineering, HR, Sales" />
                </div>
              </div>
            )}

            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full gradient-primary text-primary-foreground h-11 text-sm font-semibold">
              🚀 Create Account
            </Button>
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
