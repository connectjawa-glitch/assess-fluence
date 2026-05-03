import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type Company, type Institution } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, GraduationCap, Briefcase, School, ShieldCheck } from "lucide-react";
import perfyLogo from "@/assets/perfy-logo.jpeg";

type Role = "student" | "employee" | "company" | "institution";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [designation, setDesignation] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");
  const [department, setDepartment] = useState("");
  const [school, setSchool] = useState("");
  const [grade, setGrade] = useState("");
  const [error, setError] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  // Self-serve org creation
  const [orgMode, setOrgMode] = useState<"join" | "create">("create");
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgIndustry, setNewOrgIndustry] = useState("");
  const [newOrgLocation, setNewOrgLocation] = useState("");
  const [newInstType, setNewInstType] = useState<"School" | "College" | "Coaching" | "Training" | "NGO" | "Other">("School");
  const { register, getCompanies, getInstitutions, getInstitutionUsage, getCompanyUsage, findCompanyByCode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setCompanies(getCompanies());
    setInstitutions(getInstitutions().filter(i => i.active));
  }, [getCompanies, getInstitutions]);

  const usage = institutionCode ? getInstitutionUsage(institutionCode) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Company rep
    if (role === "company") {
      if (orgMode === "join") {
        if (!companyCode) { setError("Please enter your company code."); return; }
        if (!findCompanyByCode(companyCode)) { setError("Invalid company code. Please contact the platform admin."); return; }
      } else {
        if (!newOrgName.trim()) { setError("Please enter your company name to register a new account."); return; }
      }
    }
    // Employee always joins
    if (role === "employee") {
      if (!companyCode) { setError("Please enter your company code."); return; }
      const c = findCompanyByCode(companyCode);
      if (!c) { setError("Invalid company code. Please confirm with your HR."); return; }
      const cu = getCompanyUsage(c.code);
      if (cu.purchased > 0 && cu.remaining <= 0) {
        setError("Your company's seat plan is full. Please ask HR to top up seats."); return;
      }
    }
    // Institution rep
    if (role === "institution") {
      if (orgMode === "join") {
        if (!institutionCode) { setError("Please select your institution."); return; }
      } else {
        if (!newOrgName.trim()) { setError("Please enter your institution name to register."); return; }
      }
    }
    if (role === "student" && !school && !institutionCode) {
      setError("Please enter your school/college name or select an institution."); return;
    }
    if (role === "student" && institutionCode && usage && usage.remaining <= 0) {
      setError("This institution has no remaining seats. Please contact your coordinator."); return;
    }

    const success = register({
      name, email, password, role, phone,
      companyCode: role === "employee" ? companyCode : (role === "company" && orgMode === "join") ? companyCode : undefined,
      institutionCode: (role === "institution" && orgMode === "join") ? institutionCode : (role === "student" && institutionCode) ? institutionCode : undefined,
      department: role === "employee" ? department : undefined,
      school: role === "student" ? school : undefined,
      grade: role === "student" ? grade : undefined,
      designation: (role === "company" || role === "institution") ? designation : undefined,
      newOrgName: ((role === "company" || role === "institution") && orgMode === "create") ? newOrgName.trim() : undefined,
      newOrgIndustry: (role === "company" && orgMode === "create") ? newOrgIndustry : undefined,
      newOrgLocation: ((role === "company" || role === "institution") && orgMode === "create") ? newOrgLocation : undefined,
      newInstType: (role === "institution" && orgMode === "create") ? newInstType : undefined,
    });

    if (success) {
      const dest =
        role === "company" ? "/company" :
        role === "institution" ? "/institution" :
        "/dashboard";
      navigate(dest);
    } else {
      setError("Email already registered, invalid code, or no seats remaining.");
    }
  };

  const tile = (active: boolean) =>
    `flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
      active ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button type="button" onClick={() => { setRole("student"); setCompanyCode(""); }} className={tile(role === "student")}>
                  <GraduationCap className={`w-5 h-5 ${role === "student" ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`font-semibold text-xs ${role === "student" ? "text-primary" : "text-foreground"}`}>🎓 Student</p>
                  <p className="text-[10px] text-muted-foreground text-center leading-tight">Learner</p>
                </button>
                <button type="button" onClick={() => { setRole("employee"); setSchool(""); setInstitutionCode(""); }} className={tile(role === "employee")}>
                  <Briefcase className={`w-5 h-5 ${role === "employee" ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`font-semibold text-xs ${role === "employee" ? "text-primary" : "text-foreground"}`}>💼 Employee</p>
                  <p className="text-[10px] text-muted-foreground text-center leading-tight">Take test</p>
                </button>
                <button type="button" onClick={() => { setRole("company"); setSchool(""); setInstitutionCode(""); }} className={tile(role === "company")}>
                  <ShieldCheck className={`w-5 h-5 ${role === "company" ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`font-semibold text-xs ${role === "company" ? "text-primary" : "text-foreground"}`}>🏢 Company</p>
                  <p className="text-[10px] text-muted-foreground text-center leading-tight">HR / Mgr</p>
                </button>
                <button type="button" onClick={() => { setRole("institution"); setSchool(""); setCompanyCode(""); }} className={tile(role === "institution")}>
                  <School className={`w-5 h-5 ${role === "institution" ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`font-semibold text-xs ${role === "institution" ? "text-primary" : "text-foreground"}`}>🏫 Institution</p>
                  <p className="text-[10px] text-muted-foreground text-center leading-tight">School/College</p>
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
                  <Label className="text-xs font-semibold">Institution Code <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Select value={institutionCode || "none"} onValueChange={v => setInstitutionCode(v === "none" ? "" : v)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select your institution" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Not from a partnered institution —</SelectItem>
                      {institutions.map(i => (<SelectItem key={i.id} value={i.code}><span className="font-medium">{i.name}</span> <span className="text-muted-foreground ml-2">({i.code})</span></SelectItem>))}
                    </SelectContent>
                  </Select>
                  {institutionCode && usage && (
                    <p className={`text-xs ${usage.remaining <= 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      Seats: {usage.used}/{usage.purchased} used • {usage.remaining} remaining
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">School / College Name {!institutionCode && <span className="text-destructive">*</span>}</Label>
                    <Input value={school} onChange={e => setSchool(e.target.value)} placeholder="e.g., MIT" required={!institutionCode} className="h-11" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Class / Year</Label>
                    <Input value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g., Grade 11" className="h-11" />
                  </div>
                </div>
              </div>
            )}

            {role === "employee" && (
              <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Building2 className="w-4 h-4 text-primary" /> Company Details</div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Company Code <span className="text-destructive">*</span></Label>
                  <Input
                    value={companyCode}
                    onChange={e => setCompanyCode(e.target.value.toUpperCase().trim())}
                    placeholder="e.g., TECH001"
                    className="h-11 font-mono uppercase tracking-wider"
                  />
                  {companyCode && (
                    companies.find(c => c.code.toUpperCase() === companyCode.toUpperCase())
                      ? <p className="text-xs text-emerald-600 font-medium">✓ {companies.find(c => c.code.toUpperCase() === companyCode.toUpperCase())!.name}</p>
                      : <p className="text-xs text-destructive">Code not recognised — ask your HR for the exact code.</p>
                  )}
                  <p className="text-xs text-muted-foreground">Your HR will share a private code. We never list other companies here for privacy.</p>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-semibold">Department</Label><Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g., Engineering" className="h-11" /></div>
              </div>
            )}

            {role === "company" && (
              <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><ShieldCheck className="w-4 h-4 text-primary" /> Company Portal Access</div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setOrgMode("create")} className={`p-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${orgMode === "create" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    🚀 Register New Company
                  </button>
                  <button type="button" onClick={() => setOrgMode("join")} className={`p-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${orgMode === "join" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    🔑 Join with Existing Code
                  </button>
                </div>

                {orgMode === "create" ? (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Company Name <span className="text-destructive">*</span></Label>
                      <Input value={newOrgName} onChange={e => setNewOrgName(e.target.value)} placeholder="e.g., Acme Innovations Pvt Ltd" className="h-11" />
                      <p className="text-[11px] text-muted-foreground">A unique company code will be generated automatically. You can buy seats from your portal after signup.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Industry</Label>
                        <Input value={newOrgIndustry} onChange={e => setNewOrgIndustry(e.target.value)} placeholder="e.g., Technology" className="h-11" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Location</Label>
                        <Input value={newOrgLocation} onChange={e => setNewOrgLocation(e.target.value)} placeholder="e.g., Bengaluru" className="h-11" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Company Code <span className="text-destructive">*</span></Label>
                    <Input
                      value={companyCode}
                      onChange={e => setCompanyCode(e.target.value.toUpperCase().trim())}
                      placeholder="e.g., TECH001"
                      className="h-11 font-mono uppercase tracking-wider"
                    />
                    {companyCode && (
                      companies.find(c => c.code.toUpperCase() === companyCode.toUpperCase())
                        ? <p className="text-xs text-emerald-600 font-medium">✓ {companies.find(c => c.code.toUpperCase() === companyCode.toUpperCase())!.name}</p>
                        : <p className="text-xs text-destructive">Code not recognised — contact the platform admin.</p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Designation</Label>
                  <Input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g., HR Manager" className="h-11" />
                </div>
                <p className="text-xs text-muted-foreground">View &amp; download reports, manage seats &amp; bulk-pay for all employees.</p>
              </div>
            )}

            {role === "institution" && (
              <div className="space-y-3 p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><School className="w-4 h-4 text-primary" /> Institution Portal Access</div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setOrgMode("create")} className={`p-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${orgMode === "create" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    🚀 Register New Institution
                  </button>
                  <button type="button" onClick={() => setOrgMode("join")} className={`p-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${orgMode === "join" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    🔑 Join Existing
                  </button>
                </div>

                {orgMode === "create" ? (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Institution Name <span className="text-destructive">*</span></Label>
                      <Input value={newOrgName} onChange={e => setNewOrgName(e.target.value)} placeholder="e.g., Greenwood Public School" className="h-11" />
                      <p className="text-[11px] text-muted-foreground">A unique institution code is generated automatically. Buy seats from your portal after signup.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Type</Label>
                        <Select value={newInstType} onValueChange={(v) => setNewInstType(v as any)}>
                          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(["School", "College", "Coaching", "Training", "NGO", "Other"] as const).map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Location</Label>
                        <Input value={newOrgLocation} onChange={e => setNewOrgLocation(e.target.value)} placeholder="e.g., Mumbai" className="h-11" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Institution <span className="text-destructive">*</span></Label>
                    <Select value={institutionCode} onValueChange={setInstitutionCode}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select your institution" /></SelectTrigger>
                      <SelectContent>
                        {institutions.map(i => (<SelectItem key={i.id} value={i.code}><span className="font-medium">{i.name}</span> <span className="text-muted-foreground ml-2">({i.code} • {i.type})</span></SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Designation</Label>
                  <Input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g., Principal, Dean, Coordinator" className="h-11" />
                </div>
                <p className="text-xs text-muted-foreground">Manage seats, members, analytics &amp; download reports for your institution.</p>
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
