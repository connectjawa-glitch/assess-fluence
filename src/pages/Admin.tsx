import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type User, type Company } from "@/lib/auth";
import { calculateAllResults, type AssessmentResults, type Responses } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, AreaChart, Area
} from "recharts";
import { Building2, Download, Eye, LogOut, Plus, Search, Trash2, Users, TrendingUp, BarChart3 } from "lucide-react";
import UserReport from "@/components/UserReport";
import jsPDF from "jspdf";
import perfyLogo from "@/assets/perfy-logo.jpeg";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#6366F1"];

export default function AdminPage() {
  const { user, logout, getCompanies, addCompany, deleteCompany } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "employee">("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Company form
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyCode, setNewCompanyCode] = useState("");
  const [newCompanyIndustry, setNewCompanyIndustry] = useState("");
  const [newCompanyLocation, setNewCompanyLocation] = useState("");
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<{
    totalUsers: number; completed: number; students: number; employees: number;
    avgIQ: number; avgEQ: number; avgAQ: number; avgCQ: number;
    mbtiDist: Record<string, number>;
    careerTrends: Record<string, number>;
    discDist: Record<string, number>;
    companyStats: Record<string, { count: number; completed: number; avgIQ: number; avgEQ: number }>;
    learningDist: Record<string, number>;
  } | null>(null);

  const refreshData = () => {
    const allUsers: User[] = JSON.parse(localStorage.getItem("mm_users") || "[]");
    setUsers(allUsers);
    setCompanies(getCompanies());

    let totalIQ = 0, totalEQ = 0, totalAQ = 0, totalCQ = 0, completedCount = 0;
    const mbtiDist: Record<string, number> = {};
    const careerTrends: Record<string, number> = {};
    const discDist: Record<string, number> = { D: 0, I: 0, S: 0, C: 0 };
    const companyStats: Record<string, { count: number; completed: number; avgIQ: number; avgEQ: number; totalIQ: number; totalEQ: number }> = {};
    const learningDist: Record<string, number> = {};

    allUsers.forEach(u => {
      if (u.companyCode) {
        if (!companyStats[u.companyCode]) companyStats[u.companyCode] = { count: 0, completed: 0, avgIQ: 0, avgEQ: 0, totalIQ: 0, totalEQ: 0 };
        companyStats[u.companyCode].count++;
      }

      const completed = localStorage.getItem(`mm_completed_${u.id}`);
      if (!completed) return;
      completedCount++;
      const responses: Responses = JSON.parse(localStorage.getItem(`mm_responses_${u.id}`) || "{}");
      const results: AssessmentResults = calculateAllResults(responses, u.role === "employee");

      totalIQ += results.quotients.IQ;
      totalEQ += results.quotients.EQ;
      totalAQ += results.quotients.AQ;
      totalCQ += results.quotients.CQ;

      mbtiDist[results.mbti.type] = (mbtiDist[results.mbti.type] || 0) + 1;
      results.career.top2.forEach(c => { careerTrends[c] = (careerTrends[c] || 0) + 1; });

      const discType = results.disc.bird === "Eagle" ? "D" : results.disc.bird === "Parrot" ? "I" : results.disc.bird === "Dove" ? "S" : "C";
      discDist[discType]++;

      learningDist[results.learningStyle.dominant] = (learningDist[results.learningStyle.dominant] || 0) + 1;

      if (u.companyCode && companyStats[u.companyCode]) {
        companyStats[u.companyCode].completed++;
        companyStats[u.companyCode].totalIQ += results.quotients.IQ;
        companyStats[u.companyCode].totalEQ += results.quotients.EQ;
      }
    });

    Object.values(companyStats).forEach(cs => {
      cs.avgIQ = cs.completed ? Math.round(cs.totalIQ / cs.completed) : 0;
      cs.avgEQ = cs.completed ? Math.round(cs.totalEQ / cs.completed) : 0;
    });

    setAnalytics({
      totalUsers: allUsers.length,
      completed: completedCount,
      students: allUsers.filter(u => u.role === "student").length,
      employees: allUsers.filter(u => u.role === "employee").length,
      avgIQ: completedCount ? Math.round(totalIQ / completedCount) : 0,
      avgEQ: completedCount ? Math.round(totalEQ / completedCount) : 0,
      avgAQ: completedCount ? Math.round(totalAQ / completedCount) : 0,
      avgCQ: completedCount ? Math.round(totalCQ / completedCount) : 0,
      mbtiDist, careerTrends, discDist,
      companyStats: companyStats as any,
      learningDist,
    });
  };

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/login"); return; }
    refreshData();
  }, [user, navigate]);

  if (!user || !analytics) return null;

  // Show individual report
  if (selectedUser) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <UserReport targetUser={selectedUser} onBack={() => setSelectedUser(null)} />
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (companyFilter !== "all" && u.companyCode !== companyFilter) return false;
    if (searchQuery && !u.name.toLowerCase().includes(searchQuery.toLowerCase()) && !u.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const mbtiData = Object.entries(analytics.mbtiDist).map(([key, value]) => ({ name: key, value }));
  const careerData = Object.entries(analytics.careerTrends).map(([key, value]) => ({ name: key, value }));
  const discData = Object.entries(analytics.discDist).map(([key, value]) => {
    const nameMap: Record<string, string> = { D: "Eagle", I: "Parrot", S: "Dove", C: "Owl" };
    return { name: `${key} (${nameMap[key]})`, value };
  });
  const learningData = Object.entries(analytics.learningDist).map(([key, value]) => ({ name: key, value }));
  const quotientAvgData = [
    { subject: "IQ", value: analytics.avgIQ },
    { subject: "EQ", value: analytics.avgEQ },
    { subject: "AQ", value: analytics.avgAQ },
    { subject: "CQ", value: analytics.avgCQ },
  ];

  const handleAddCompany = () => {
    if (!newCompanyName || !newCompanyCode) return;
    addCompany({ name: newCompanyName, code: newCompanyCode, industry: newCompanyIndustry, location: newCompanyLocation });
    setNewCompanyName(""); setNewCompanyCode(""); setNewCompanyIndustry(""); setNewCompanyLocation("");
    setShowCompanyDialog(false);
    refreshData();
  };

  const handleDeleteCompany = (id: string) => {
    deleteCompany(id);
    refreshData();
  };

  const exportCSV = () => {
    const headers = "Name,Email,Role,Company,Department,Status,DISC,MBTI,IQ,EQ,AQ,CQ,Career1,Career2\n";
    const rows = filteredUsers.map(u => {
      const completed = !!localStorage.getItem(`mm_completed_${u.id}`);
      let disc = "", mbti = "", iq = "", eq = "", aq = "", cq = "", c1 = "", c2 = "";
      if (completed) {
        const responses: Responses = JSON.parse(localStorage.getItem(`mm_responses_${u.id}`) || "{}");
        const results = calculateAllResults(responses, u.role === "employee");
        disc = results.disc.dominant;
        mbti = results.mbti.type;
        iq = `${results.quotients.IQ}`;
        eq = `${results.quotients.EQ}`;
        aq = `${results.quotients.AQ}`;
        cq = `${results.quotients.CQ}`;
        c1 = results.career.top2[0] || "";
        c2 = results.career.top2[1] || "";
      }
      return `"${u.name}","${u.email}",${u.role},"${u.companyName || ""}","${u.department || ""}",${completed ? "Completed" : "Pending"},"${disc}",${mbti},${iq},${eq},${aq},${cq},${c1},${c2}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assessment_export_${companyFilter !== "all" ? companyFilter + "_" : ""}${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const exportCompanyReport = (code: string) => {
    const company = companies.find(c => c.code === code);
    if (!company) return;
    const companyUsers = users.filter(u => u.companyCode === code);
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pw, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(`${company.name} — Company Report`, pw / 2, 16, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Code: ${company.code} • ${company.industry} • ${company.location}`, pw / 2, 26, { align: "center" });
    doc.text(`Generated: ${new Date().toLocaleDateString()} • Total Employees: ${companyUsers.length}`, pw / 2, 34, { align: "center" });

    doc.setTextColor(0, 0, 0);
    let y = 55;

    companyUsers.forEach((u, idx) => {
      const completed = !!localStorage.getItem(`mm_completed_${u.id}`);
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.text(`${idx + 1}. ${u.name}`, 20, y);
      doc.setFontSize(10);
      y += 7;
      doc.text(`Email: ${u.email} • Dept: ${u.department || "N/A"} • Status: ${completed ? "Completed" : "Pending"}`, 25, y);
      y += 6;
      if (completed) {
        const responses: Responses = JSON.parse(localStorage.getItem(`mm_responses_${u.id}`) || "{}");
        const results = calculateAllResults(responses, true);
        doc.text(`DISC: ${results.disc.dominant} | MBTI: ${results.mbti.type} | IQ: ${results.quotients.IQ}% | EQ: ${results.quotients.EQ}%`, 25, y);
        y += 6;
        doc.text(`Career: ${results.career.top2.join(", ")} | Learning: ${results.learningStyle.dominant}`, 25, y);
        y += 6;
      }
      y += 6;
    });

    doc.save(`${company.name.replace(/\s+/g, "_")}_Company_Report.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="gradient-hero">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={perfyLogo} alt="Perfy" className="h-9 rounded-lg bg-white p-0.5" />
            <div>
              <h1 className="text-lg font-display font-bold text-primary-foreground">Perfy Admin</h1>
              <p className="text-xs text-primary-foreground/70">From Effort to Impact</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => { logout(); navigate("/"); }}>
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Total Users", value: analytics.totalUsers, icon: Users },
            { label: "Students", value: analytics.students, icon: Users },
            { label: "Employees", value: analytics.employees, icon: Building2 },
            { label: "Completed", value: analytics.completed, icon: TrendingUp },
            { label: "Avg IQ", value: `${analytics.avgIQ}%`, icon: TrendingUp },
            { label: "Avg EQ", value: `${analytics.avgEQ}%`, icon: TrendingUp },
            { label: "Avg AQ", value: `${analytics.avgAQ}%`, icon: TrendingUp },
            { label: "Avg CQ", value: `${analytics.avgCQ}%`, icon: TrendingUp },
          ].map(stat => (
            <Card key={stat.label} className="shadow-card">
              <CardContent className="p-3 text-center">
                <stat.icon className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
            <TabsTrigger value="users">👥 Users</TabsTrigger>
            <TabsTrigger value="companies">🏢 Companies</TabsTrigger>
          </TabsList>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Avg Quotients Radar */}
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">Average Quotients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={quotientAvgData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <Radar dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* DISC Distribution */}
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">DISC Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={discData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {discData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* MBTI Distribution */}
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">MBTI Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mbtiData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {mbtiData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Career Trends */}
              <Card className="shadow-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">Career Trends (RIASEC)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={careerData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Learning Style Distribution */}
              <Card className="shadow-card md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">Learning Style Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={learningData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {learningData.map((_, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users" className="space-y-4">
            {/* Filters */}
            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(["all", "student", "employee"] as const).map(f => (
                      <button key={f} onClick={() => setRoleFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${roleFilter === f ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                      >{f}</button>
                    ))}
                  </div>
                  <Select value={companyFilter} onValueChange={setCompanyFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Companies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {companies.map(c => (
                        <SelectItem key={c.id} value={c.code}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="w-4 h-4 mr-1" /> CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User Table */}
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-display">{filteredUsers.length} Users</CardTitle>
                  {companyFilter !== "all" && (
                    <Button size="sm" variant="outline" onClick={() => exportCompanyReport(companyFilter)}>
                      <Download className="w-3 h-3 mr-1" /> Company Report PDF
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                     <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs">Name</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs">Email</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs">Role</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs">Company/School</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs">Status</th>
                        <th className="text-left py-2 px-2 font-medium text-muted-foreground text-xs">MBTI</th>
                        <th className="text-right py-2 px-2 font-medium text-muted-foreground text-xs">Actions</th>
                      </tr>
                     </thead>
                    <tbody>
                      {filteredUsers.map(u => {
                        const completed = !!localStorage.getItem(`mm_completed_${u.id}`);
                        let mbti = "";
                        if (completed) {
                          const responses: Responses = JSON.parse(localStorage.getItem(`mm_responses_${u.id}`) || "{}");
                          const r = calculateAllResults(responses, u.role === "employee");
                          mbti = r.mbti.type;
                        }
                        return (
                          <tr key={u.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-2.5 px-2 font-medium">{u.name}</td>
                            <td className="py-2.5 px-2 text-muted-foreground text-xs">{u.email}</td>
                            <td className="py-2.5 px-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${u.role === "employee" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-xs">{u.companyName || u.school || "—"}</td>
                            <td className="py-2.5 px-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${completed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                                {completed ? "Done" : "Pending"}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 font-mono text-xs font-bold text-primary">{mbti || "—"}</td>
                            <td className="py-2.5 px-2 text-right">
                              {completed && (
                                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(u)}>
                                  <Eye className="w-4 h-4 mr-1" /> View
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* COMPANIES TAB */}
          <TabsContent value="companies" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold">Company Management</h3>
              <Dialog open={showCompanyDialog} onOpenChange={setShowCompanyDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gradient-primary text-primary-foreground">
                    <Plus className="w-4 h-4 mr-1" /> Add Company
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">Add New Company</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Company Name <span className="text-destructive">*</span></Label>
                      <Input value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} placeholder="TechCorp Solutions" />
                    </div>
                    <div className="space-y-2">
                      <Label>Company Code <span className="text-destructive">*</span></Label>
                      <Input value={newCompanyCode} onChange={e => setNewCompanyCode(e.target.value.toUpperCase())} placeholder="TECH001" />
                      <p className="text-xs text-muted-foreground">Employees will use this code to register</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Industry</Label>
                        <Input value={newCompanyIndustry} onChange={e => setNewCompanyIndustry(e.target.value)} placeholder="Technology" />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={newCompanyLocation} onChange={e => setNewCompanyLocation(e.target.value)} placeholder="New York" />
                      </div>
                    </div>
                    <Button onClick={handleAddCompany} className="w-full gradient-primary text-primary-foreground" disabled={!newCompanyName || !newCompanyCode}>
                      Create Company
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map(c => {
                const stats = analytics.companyStats[c.code];
                return (
                  <Card key={c.id} className="shadow-card">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-display font-semibold">{c.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Code: <span className="font-mono font-bold text-primary">{c.code}</span>
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteCompany(c.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>🏭 {c.industry || "N/A"} • 📍 {c.location || "N/A"}</p>
                        <p>👥 {stats?.count || 0} employees • ✅ {stats?.completed || 0} completed</p>
                        {stats && stats.completed > 0 && (
                          <p>📊 Avg IQ: {stats.avgIQ}% • EQ: {stats.avgEQ}%</p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => { setCompanyFilter(c.code); /* switch to users tab */ }}>
                          <Users className="w-3 h-3 mr-1" /> View Users
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => exportCompanyReport(c.code)}>
                          <Download className="w-3 h-3 mr-1" /> Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
