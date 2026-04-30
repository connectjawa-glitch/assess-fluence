import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type User, type Institution } from "@/lib/auth";
import { calculateAllResults, type AssessmentResults, type Responses } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import {
  School, Download, Eye, LogOut, Search, Users, TrendingUp,
  CheckCircle2, Clock, FileSpreadsheet, FileText, ShoppingCart, CreditCard, Sparkles,
} from "lucide-react";
import UserReport from "@/components/UserReport";
import { generateDeepReport } from "@/lib/pdfReport";
import jsPDF from "jspdf";
import perfyLogo from "@/assets/perfy-logo.jpeg";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#6366F1"];

interface MemberRow {
  user: User;
  completed: boolean;
  results?: AssessmentResults;
}

const SEAT_PACKS = [
  { seats: 25, pricePerSeat: 900, label: "Starter" },
  { seats: 50, pricePerSeat: 800, label: "Standard" },
  { seats: 100, pricePerSeat: 700, label: "Pro" },
  { seats: 250, pricePerSeat: 600, label: "Enterprise" },
];

export default function InstitutionPage() {
  const { user, logout, getInstitutions, addInstitutionSeats, getInstitutionUsage } = useAuth();
  const navigate = useNavigate();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [selected, setSelected] = useState<User | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [packIdx, setPackIdx] = useState(1);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "institution") {
      navigate(user.role === "admin" ? "/admin" : user.role === "company" ? "/company" : "/dashboard");
      return;
    }
    refresh();
  }, [user, navigate]);

  const refresh = () => {
    if (!user?.institutionCode) return;
    const inst = getInstitutions().find(i => i.code === user.institutionCode) || null;
    setInstitution(inst);

    const all: User[] = JSON.parse(localStorage.getItem("mm_users") || "[]");
    const members = all.filter(u => u.role === "student" && u.institutionCode === user.institutionCode);
    const built: MemberRow[] = members.map(u => {
      const completed = !!localStorage.getItem(`mm_completed_${u.id}`);
      let results: AssessmentResults | undefined;
      if (completed) {
        const responses: Responses = JSON.parse(localStorage.getItem(`mm_responses_${u.id}`) || "{}");
        results = calculateAllResults(responses, false);
      }
      return { user: u, completed, results };
    });
    setRows(built);
  };

  const usage = useMemo(() => {
    if (!user?.institutionCode) return { used: 0, purchased: 0, remaining: 0 };
    return getInstitutionUsage(user.institutionCode);
  }, [user, institution, rows, getInstitutionUsage]);

  const stats = useMemo(() => {
    const done = rows.filter(r => r.completed && r.results);
    const sum = (k: "IQ" | "EQ" | "AQ" | "CQ") =>
      done.length ? Math.round(done.reduce((a, r) => a + r.results!.quotients[k], 0) / done.length) : 0;
    const discDist: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
    const mbtiDist: Record<string, number> = {};
    const gradeDist: Record<string, number> = {};
    done.forEach(r => {
      const b = r.results!.disc.bird;
      const d = b === "Eagle" ? "D" : b === "Parrot" ? "I" : b === "Dove" ? "S" : "C";
      discDist[d]++;
      mbtiDist[r.results!.mbti.type] = (mbtiDist[r.results!.mbti.type] || 0) + 1;
    });
    rows.forEach(r => {
      const g = r.user.grade || "Unassigned";
      gradeDist[g] = (gradeDist[g] || 0) + 1;
    });
    return {
      total: rows.length,
      completed: done.length,
      pending: rows.length - done.length,
      avgIQ: sum("IQ"), avgEQ: sum("EQ"), avgAQ: sum("AQ"), avgCQ: sum("CQ"),
      discDist, mbtiDist, gradeDist,
    };
  }, [rows]);

  const filtered = rows.filter(r => {
    if (statusFilter === "completed" && !r.completed) return false;
    if (statusFilter === "pending" && r.completed) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.user.name.toLowerCase().includes(q) &&
          !r.user.email.toLowerCase().includes(q) &&
          !(r.user.grade || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const exportCSV = () => {
    if (!institution) return;
    const headers = "Name,Email,Grade/Class,Status,DISC,MBTI,IQ,EQ,AQ,CQ,Top Career,Learning Style\n";
    const body = rows.map(r => {
      const u = r.user; const res = r.results;
      return [
        u.name, u.email, u.grade || "",
        r.completed ? "Completed" : "Pending",
        res?.disc.dominant || "", res?.mbti.type || "",
        res?.quotients.IQ ?? "", res?.quotients.EQ ?? "",
        res?.quotients.AQ ?? "", res?.quotients.CQ ?? "",
        res?.career.top2[0] || "", res?.learningStyle.dominant || "",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    }).join("\n");
    const blob = new Blob([headers + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${institution.name.replace(/\s+/g, "_")}_Members_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSummaryPDF = () => {
    if (!institution) return;
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pw, 38, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.text(`${institution.name} — Institution Summary`, pw / 2, 16, { align: "center" });
    doc.setFontSize(10);
    doc.text(`${institution.type} • Code: ${institution.code} • ${institution.location}`, pw / 2, 24, { align: "center" });
    doc.text(`Seats: ${usage.used}/${usage.purchased} used (${usage.remaining} remaining) • Plan: ${institution.plan}`, pw / 2, 31, { align: "center" });

    doc.setTextColor(0, 0, 0);
    let y = 50;
    doc.setFontSize(13); doc.text("Cohort Averages", 18, y); y += 7;
    doc.setFontSize(10);
    doc.text(`IQ: ${stats.avgIQ}%   EQ: ${stats.avgEQ}%   AQ: ${stats.avgAQ}%   CQ: ${stats.avgCQ}%`, 22, y); y += 10;

    doc.setFontSize(13); doc.text("Members", 18, y); y += 7;
    doc.setFontSize(9);
    rows.forEach((r, i) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(`${i + 1}. ${r.user.name} — ${r.user.email}`, 22, y); y += 5;
      doc.text(`   Grade: ${r.user.grade || "N/A"} | Status: ${r.completed ? "Completed" : "Pending"}`, 22, y); y += 5;
      if (r.results) {
        doc.text(`   DISC: ${r.results.disc.dominant} | MBTI: ${r.results.mbti.type} | IQ ${r.results.quotients.IQ}% • EQ ${r.results.quotients.EQ}% • AQ ${r.results.quotients.AQ}% • CQ ${r.results.quotients.CQ}%`, 22, y); y += 5;
        doc.text(`   Career: ${r.results.career.top2.join(", ")} | Learning: ${r.results.learningStyle.dominant}`, 22, y); y += 5;
      }
      y += 3;
    });
    doc.save(`${institution.name.replace(/\s+/g, "_")}_Summary.pdf`);
  };

  const downloadMemberReport = (row: MemberRow) => {
    if (!row.completed || !row.results) return;
    generateDeepReport(row.user, row.results);
  };

  const handleBuySeats = () => {
    if (!institution) return;
    setPaying(true);
    const pack = SEAT_PACKS[packIdx];
    setTimeout(() => {
      addInstitutionSeats(institution.id, pack.seats, pack.pricePerSeat);
      setPaying(false);
      setBuyOpen(false);
      refresh();
    }, 600);
  };

  if (!user || !institution) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <Card className="max-w-md text-center shadow-card">
          <CardContent className="p-8 space-y-3">
            <School className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No active institution found for your account. Please contact admin.
            </p>
            <Button onClick={() => { logout(); navigate("/"); }}>Logout</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <UserReport targetUser={selected} onBack={() => setSelected(null)} />
        </div>
      </div>
    );
  }

  const discData = Object.entries(stats.discDist).map(([k, v]) => {
    const map: Record<string, string> = { D: "Eagle (D)", I: "Parrot (I)", S: "Dove (S)", C: "Owl (C)" };
    return { name: map[k], value: v };
  });
  const mbtiData = Object.entries(stats.mbtiDist).map(([k, v]) => ({ name: k, value: v }));
  const gradeData = Object.entries(stats.gradeDist).map(([k, v]) => ({ name: k, value: v }));
  const quotientData = [
    { subject: "IQ", value: stats.avgIQ },
    { subject: "EQ", value: stats.avgEQ },
    { subject: "AQ", value: stats.avgAQ },
    { subject: "CQ", value: stats.avgCQ },
  ];

  const seatPct = usage.purchased ? Math.round((usage.used / usage.purchased) * 100) : 0;
  const pack = SEAT_PACKS[packIdx];
  const totalDue = pack.seats * pack.pricePerSeat;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="gradient-hero">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={perfyLogo} alt="Perfy" className="h-9 rounded-lg bg-white p-0.5 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-display font-bold text-primary-foreground truncate">
                {institution.name} — Institution Portal
              </h1>
              <p className="text-xs text-primary-foreground/70 truncate">
                {user.name} • {user.designation || "Coordinator"} • Code: {institution.code} • {institution.type}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive shadow-md font-semibold shrink-0"
            onClick={() => { logout(); navigate("/"); }}
          >
            <LogOut className="w-4 h-4" /> <span>Logout</span>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Seat Usage Hero Card */}
        <Card className="shadow-elevated border-2 border-primary/20 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Seat License — {institution.plan}
                  </p>
                  {!institution.active && <Badge variant="destructive">Suspended</Badge>}
                </div>
                <p className="text-3xl font-display font-bold text-primary tabular-nums">
                  {usage.used} <span className="text-muted-foreground text-xl">/ {usage.purchased}</span>
                  <span className="ml-3 text-base font-medium text-muted-foreground">seats used</span>
                </p>
                <div className="mt-2 h-2.5 rounded-full bg-muted overflow-hidden max-w-md">
                  <div
                    className={`h-full rounded-full transition-all ${seatPct > 90 ? "bg-destructive" : "bg-gradient-to-r from-primary to-secondary"}`}
                    style={{ width: `${Math.min(100, seatPct)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {usage.remaining} seats remaining • Last price: ₹{institution.pricePerSeat}/seat
                </p>
              </div>
              <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gradient-primary text-primary-foreground gap-2 shrink-0">
                    <ShoppingCart className="w-4 h-4" /> Buy More Seats
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-display flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" /> Purchase Seats
                    </DialogTitle>
                    <DialogDescription>
                      Pick a pack to top up your seat license. Volume discounts apply automatically.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    {SEAT_PACKS.map((p, i) => {
                      const checked = packIdx === i;
                      const total = p.seats * p.pricePerSeat;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPackIdx(i)}
                          className={`w-full text-left rounded-xl border-2 p-4 transition-all ${checked ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40"}`}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                              <p className="font-display font-semibold text-sm">{p.label} — {p.seats} seats</p>
                              <p className="text-xs text-muted-foreground">₹{p.pricePerSeat}/seat</p>
                            </div>
                            <p className="font-bold text-primary tabular-nums">₹{total.toLocaleString("en-IN")}</p>
                          </div>
                        </button>
                      );
                    })}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 mt-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Due</p>
                        <p className="text-2xl font-display font-bold text-primary tabular-nums">₹{totalDue.toLocaleString("en-IN")}</p>
                      </div>
                      <Button onClick={handleBuySeats} disabled={paying} className="gradient-primary text-primary-foreground">
                        {paying ? "Processing…" : "Pay & Add Seats"}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic text-center pt-1">
                      Secure mock checkout • Seats are credited instantly to your institution.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Members", value: stats.total, icon: Users, color: "text-primary" },
            { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-green-600" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600" },
            { label: "Avg IQ", value: `${stats.avgIQ}%`, icon: TrendingUp, color: "text-primary" },
            { label: "Avg EQ", value: `${stats.avgEQ}%`, icon: TrendingUp, color: "text-primary" },
            { label: "Avg AQ", value: `${stats.avgAQ}%`, icon: TrendingUp, color: "text-primary" },
            { label: "Avg CQ", value: `${stats.avgCQ}%`, icon: TrendingUp, color: "text-primary" },
          ].map(s => (
            <Card key={s.label} className="shadow-card">
              <CardContent className="p-3 text-center">
                <s.icon className={`w-4 h-4 mx-auto mb-1 ${s.color}`} />
                <p className="text-xl font-display font-bold text-primary">{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Cohort Quotient Averages</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={quotientData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <Radar dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display">DISC Behaviour Mix</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={discData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {discData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display">MBTI Type Spread</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mbtiData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis /><Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {mbtiData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Members by Grade / Class</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={gradeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis /><Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {gradeData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Member Table */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <School className="w-4 h-4 text-primary" /> Members
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" /> Export CSV
                </Button>
                <Button size="sm" variant="outline" onClick={exportSummaryPDF} className="gap-1.5">
                  <FileText className="w-4 h-4" /> Summary PDF
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, email, grade…"
                  className="pl-9 h-10"
                />
              </div>
              <div className="flex gap-1.5">
                {(["all", "completed", "pending"] as const).map(s => (
                  <Button
                    key={s}
                    size="sm"
                    variant={statusFilter === s ? "default" : "outline"}
                    onClick={() => setStatusFilter(s)}
                    className="capitalize"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
            <div className="mt-3 p-3 rounded-lg bg-muted/40 border text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-0.5">Invite your students</p>
              Share your institution code <span className="font-mono font-bold text-primary">{institution.code}</span> — they enter it on the registration page. Each registration consumes one seat.
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Member</th>
                    <th className="px-3 py-2 font-semibold">Grade</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">DISC</th>
                    <th className="px-3 py-2 font-semibold">MBTI</th>
                    <th className="px-3 py-2 font-semibold">Quotients</th>
                    <th className="px-3 py-2 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.user.id} className="border-t hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <div className="font-medium">{r.user.name}</div>
                        <div className="text-xs text-muted-foreground">{r.user.email}</div>
                      </td>
                      <td className="px-3 py-2">{r.user.grade || "—"}</td>
                      <td className="px-3 py-2">
                        {r.completed
                          ? <Badge className="bg-green-600/15 text-green-700 hover:bg-green-600/20 border-green-600/30">Completed</Badge>
                          : <Badge variant="outline" className="text-amber-600 border-amber-500/40">Pending</Badge>}
                      </td>
                      <td className="px-3 py-2">{r.results?.disc.dominant || "—"}</td>
                      <td className="px-3 py-2 font-mono">{r.results?.mbti.type || "—"}</td>
                      <td className="px-3 py-2">
                        {r.results
                          ? <span className="text-xs">IQ {r.results.quotients.IQ} • EQ {r.results.quotients.EQ} • AQ {r.results.quotients.AQ} • CQ {r.results.quotients.CQ}</span>
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelected(r.user)}
                            disabled={!r.completed}
                            className="gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => downloadMemberReport(r)}
                            disabled={!r.completed}
                            className="gap-1 gradient-primary text-primary-foreground"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">No members yet. Share your code <span className="font-mono font-bold text-primary">{institution.code}</span> to start onboarding.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
