import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type User } from "@/lib/auth";
import { calculateAllResults, type AssessmentResults, type Responses } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#6366F1"];

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<"all" | "student" | "employee">("all");
  const [analytics, setAnalytics] = useState<{
    totalUsers: number;
    completed: number;
    avgIQ: number;
    avgEQ: number;
    mbtiDist: Record<string, number>;
    careerTrends: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") { navigate("/login"); return; }
    const allUsers: User[] = JSON.parse(localStorage.getItem("mm_users") || "[]");
    setUsers(allUsers);

    // Calculate analytics
    let totalIQ = 0, totalEQ = 0, completedCount = 0;
    const mbtiDist: Record<string, number> = {};
    const careerTrends: Record<string, number> = {};

    allUsers.forEach(u => {
      const completed = localStorage.getItem(`mm_completed_${u.id}`);
      if (!completed) return;
      completedCount++;
      const responses: Responses = JSON.parse(localStorage.getItem(`mm_responses_${u.id}`) || "{}");
      const results: AssessmentResults = calculateAllResults(responses, u.role === "employee");
      totalIQ += results.quotients.IQ;
      totalEQ += results.quotients.EQ;
      mbtiDist[results.mbti.type] = (mbtiDist[results.mbti.type] || 0) + 1;
      results.career.top2.forEach(c => {
        careerTrends[c] = (careerTrends[c] || 0) + 1;
      });
    });

    setAnalytics({
      totalUsers: allUsers.length,
      completed: completedCount,
      avgIQ: completedCount ? Math.round(totalIQ / completedCount) : 0,
      avgEQ: completedCount ? Math.round(totalEQ / completedCount) : 0,
      mbtiDist,
      careerTrends,
    });
  }, [user, navigate]);

  if (!user || !analytics) return null;

  const filteredUsers = filter === "all" ? users : users.filter(u => u.role === filter);

  const mbtiData = Object.entries(analytics.mbtiDist).map(([key, value]) => ({ name: key, value }));
  const careerData = Object.entries(analytics.careerTrends).map(([key, value]) => ({ name: key, value }));

  const exportCSV = () => {
    const headers = "Name,Email,Role,Completed\n";
    const rows = users.map(u => {
      const completed = !!localStorage.getItem(`mm_completed_${u.id}`);
      return `${u.name},${u.email},${u.role},${completed}`;
    }).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_export.csv";
    a.click();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Mind Mapping & Assessment Portal</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>Export CSV</Button>
            <Button variant="outline" onClick={() => { logout(); navigate("/"); }}>Logout</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: analytics.totalUsers },
            { label: "Completed", value: analytics.completed },
            { label: "Avg IQ", value: `${analytics.avgIQ}%` },
            { label: "Avg EQ", value: `${analytics.avgEQ}%` },
          ].map(stat => (
            <Card key={stat.label} className="shadow-card">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">MBTI Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mbtiData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {mbtiData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Career Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={careerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {careerData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display">All Users</CardTitle>
              <div className="flex gap-2">
                {(["all", "student", "employee"] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                      filter === f ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const completed = !!localStorage.getItem(`mm_completed_${u.id}`);
                    return (
                      <tr key={u.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{u.name}</td>
                        <td className="py-3 px-2 text-muted-foreground">{u.email}</td>
                        <td className="py-3 px-2 capitalize">{u.role}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${completed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {completed ? "Completed" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
