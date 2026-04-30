import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type User } from "@/lib/auth";
import { calculateAllResults, type AssessmentResults, type Responses } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from "recharts";
import {
  Building2, Download, Eye, LogOut, Search, Users, TrendingUp,
  CheckCircle2, Clock, FileSpreadsheet, FileText
} from "lucide-react";
import UserReport from "@/components/UserReport";
import { generateDeepReport } from "@/lib/pdfReport";
import jsPDF from "jspdf";
import perfyLogo from "@/assets/perfy-logo.jpeg";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#6366F1"];

interface EmpRow {
  user: User;
  completed: boolean;
  results?: AssessmentResults;
}

export default function CompanyPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<EmpRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending">("all");
  const [selected, setSelected] = useState<User | null>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "company") {
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
      return;
    }
    refresh();
  }, [user, navigate]);

  const refresh = () => {
    if (!user?.companyCode) return;
    const all: User[] = JSON.parse(localStorage.getItem("mm_users") || "[]");
    const employees = all.filter(u => u.role === "employee" && u.companyCode === user.companyCode);
    const built: EmpRow[] = employees.map(u => {
      const completed = !!localStorage.getItem(`mm_completed_${u.id}`);
      let results: AssessmentResults | undefined;
      if (completed) {
        const responses: Responses = JSON.parse(localStorage.getItem(`mm_responses_${u.id}`) || "{}");
        results = calculateAllResults(responses, true);
      }
      return { user: u, completed, results };
    });
    setRows(built);
  };

  const stats = useMemo(() => {
    const completedRows = rows.filter(r => r.completed && r.results);
    const sum = (key: "IQ" | "EQ" | "AQ" | "CQ") =>
      completedRows.length
        ? Math.round(completedRows.reduce((a, r) => a + r.results!.quotients[key], 0) / completedRows.length)
        : 0;
    const discDist: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
    const mbtiDist: Record<string, number> = {};
    const deptDist: Record<string, number> = {};
    completedRows.forEach(r => {
      const b = r.results!.disc.bird;
      const d = b === "Eagle" ? "D" : b === "Parrot" ? "I" : b === "Dove" ? "S" : "C";
      discDist[d]++;
      mbtiDist[r.results!.mbti.type] = (mbtiDist[r.results!.mbti.type] || 0) + 1;
    });
    rows.forEach(r => {
      const dept = r.user.department || "Unassigned";
      deptDist[dept] = (deptDist[dept] || 0) + 1;
    });
    return {
      total: rows.length,
      completed: completedRows.length,
      pending: rows.length - completedRows.length,
      avgIQ: sum("IQ"), avgEQ: sum("EQ"), avgAQ: sum("AQ"), avgCQ: sum("CQ"),
      discDist, mbtiDist, deptDist,
    };
  }, [rows]);

  const filtered = rows.filter(r => {
    if (statusFilter === "completed" && !r.completed) return false;
    if (statusFilter === "pending" && r.completed) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.user.name.toLowerCase().includes(q) &&
          !r.user.email.toLowerCase().includes(q) &&
          !(r.user.department || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const exportCSV = () => {
    const headers = "Name,Email,Department,Status,DISC,MBTI,IQ,EQ,AQ,CQ,Top Career,Learning Style\n";
    const body = rows.map(r => {
      const u = r.user;
      const res = r.results;
      return [
        u.name, u.email, u.department || "",
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
    a.download = `${user?.companyName?.replace(/\s+/g, "_") || "Company"}_Employees_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSummaryPDF = () => {
    if (!user) return;
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pw, 38, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(`${user.companyName} — Workforce Assessment Summary`, pw / 2, 16, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Code: ${user.companyCode} • Generated: ${new Date().toLocaleDateString()}`, pw / 2, 24, { align: "center" });
    doc.text(`Total: ${stats.total} • Completed: ${stats.completed} • Pending: ${stats.pending}`, pw / 2, 31, { align: "center" });

    doc.setTextColor(0, 0, 0);
    let y = 50;
    doc.setFontSize(13);
    doc.text("Workforce Averages", 18, y); y += 7;
    doc.setFontSize(10);
    doc.text(`IQ: ${stats.avgIQ}%   EQ: ${stats.avgEQ}%   AQ: ${stats.avgAQ}%   CQ: ${stats.avgCQ}%`, 22, y); y += 10;

    doc.setFontSize(13); doc.text("Employees", 18, y); y += 7;
    doc.setFontSize(9);
    rows.forEach((r, i) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(`${i + 1}. ${r.user.name} — ${r.user.email}`, 22, y); y += 5;
      doc.text(`   Dept: ${r.user.department || "N/A"} | Status: ${r.completed ? "Completed" : "Pending"}`, 22, y); y += 5;
      if (r.results) {
        doc.text(`   DISC: ${r.results.disc.dominant} | MBTI: ${r.results.mbti.type} | IQ ${r.results.quotients.IQ}% • EQ ${r.results.quotients.EQ}% • AQ ${r.results.quotients.AQ}% • CQ ${r.results.quotients.CQ}%`, 22, y); y += 5;
        doc.text(`   Career: ${r.results.career.top2.join(", ")} | Learning: ${r.results.learningStyle.dominant}`, 22, y); y += 5;
      }
      y += 3;
    });
    doc.save(`${user.companyName?.replace(/\s+/g, "_")}_Summary.pdf`);
  };

  const downloadEmployeeReport = (row: EmpRow) => {
    if (!row.completed || !row.results) return;
    generateDeepReport(row.user, row.results);
  };

  if (!user) return null;

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
  const deptData = Object.entries(stats.deptDist).map(([k, v]) => ({ name: k, value: v }));
  const quotientData = [
    { subject: "IQ", value: stats.avgIQ },
    { subject: "EQ", value: stats.avgEQ },
    { subject: "AQ", value: stats.avgAQ },
    { subject: "CQ", value: stats.avgCQ },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="gradient-hero">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={perfyLogo} alt="Perfy" className="h-9 rounded-lg bg-white p-0.5 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-display font-bold text-primary-foreground truncate">
                {user.companyName} — Company Portal
              </h1>
              <p className="text-xs text-primary-foreground/70 truncate">
                {user.name} • {user.designation || "Company Rep"} • Code: {user.companyCode}
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
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Employees", value: stats.total, icon: Users, color: "text-primary" },
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
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Workforce Quotient Averages</CardTitle></CardHeader>
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
            <CardHeader className="pb-2"><CardTitle className="text-sm font-display">Employees by Department</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis /><Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {deptData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Table */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Employees
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
                  placeholder="Search by name, email, department..."
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
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Employee</th>
                    <th className="px-3 py-2 font-semibold">Dept</th>
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
                      <td className="px-3 py-2">{r.user.department || "—"}</td>
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
                            onClick={() => downloadEmployeeReport(r)}
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
                    <tr><td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">No employees match your filters.</td></tr>
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
