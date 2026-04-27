import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type Company } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, GraduationCap, Briefcase, School } from "lucide-react";
import perfyLogo from "@/assets/perfy-logo.jpeg";

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
    if (role === "employee" && !companyCode) { setError("Please select your company."); return; }
    if (role === "student" && !school) { setError("Please enter your school/college name."); return; }

    const success = register({
      name, email, password, role, phone,
      companyCode: role === "employee" ? companyCode : undefined,
      department: role === "employee" ? department : undefined,
      school: role === "student" ? school : undefined,
    });

    if (success) { navigate("/dashboard"); } else { setError("Email already registered or invalid company code."); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Soft animated background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full bg-primary/10 animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -left-24 w-[500px] h-[500px] rounded-full bg-secondary/10 animate-[pulse_7s_ease-in-out_infinite_1s]" />
      </div>

      <Card className="w-full max-w-lg shadow-elevated animate-fade-in relative z-10 border-primary/10">
        <CardHeader className="text-center pb-2">
          <img src={perfyLogo} alt="Perfy" className="h-14 mx-auto mb-2 rounded-xl bg-foreground/5 p-1.5" />
          <CardTitle className="text-2xl md:text-3xl font-display text-gradient">Create your account</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Perfy — From Effort to Impact</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider">I am a</Label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => { setRole("student"); setCompanyCode(""); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${role === "student" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40"}`}>
                  <GraduationCap className={`w-6 h-6 ${role === "student" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <p className={`font-semibold text-sm ${role === "student" ? "text-primary" : "text-foreground"}`}>🎓 Student</p>
                    <p className="text-xs text-muted-foreground">Learning assessment</p>
                  </div>
                </button>
                <button type="button" onClick={() => { setRole("employee"); setSchool(""); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${role === "employee" ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40"}`}>
                  <Briefcase className={`w-6 h-6 ${role === "employee" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="text-left">
                    <p className={`font-semibold text-sm ${role === "employee" ? "text-primary" : "text-foreground"}`}>💼 Employee</p>
                    <p className="text-xs text-muted-foreground">Performance system</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider">Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required className="h-11" /></div>
              <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider">Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 890" className="h-11" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider">Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="h-11" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-semibold uppercase tracking-wider">Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a strong password" required className="h-11" /></div>

            {role === "student" && (
              <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><School className="w-4 h-4 text-primary" /> School / College Details</div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">School / College Name <span className="text-destructive">*</span></Label>
                  <Input value={school} onChange={e => setSchool(e.target.value)} placeholder="e.g., Springfield High School, MIT" required className="h-11" />
                </div>
              </div>
            )}

            {role === "employee" && (
              <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Building2 className="w-4 h-4 text-primary" /> Company Details</div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Company Code <span className="text-destructive">*</span></Label>
                  <Select value={companyCode} onValueChange={setCompanyCode}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select your company" /></SelectTrigger>
                    <SelectContent>
                      {companies.map(c => (<SelectItem key={c.id} value={c.code}><span className="font-medium">{c.name}</span> <span className="text-muted-foreground ml-2">({c.code})</span></SelectItem>))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Ask your HR for the company code</p>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold">Department</Label><Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g., Engineering, HR, Sales" className="h-11" /></div>
              </div>
            )}

            {error && <p className="text-destructive text-sm text-center bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">{error}</p>}
            <Button type="submit" className="w-full gradient-primary text-primary-foreground h-11 text-sm font-semibold hover:opacity-90">
              🚀 Create Account
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Already have an account? <button onClick={() => navigate("/login")} className="text-primary hover:underline font-semibold">Sign In</button></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}