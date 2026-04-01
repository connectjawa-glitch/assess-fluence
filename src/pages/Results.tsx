import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { calculateAllResults, type AssessmentResults, type Responses } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import jsPDF from "jspdf";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#6366F1"];

export default function ResultsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<AssessmentResults | null>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const completed = localStorage.getItem(`mm_completed_${user.id}`);
    if (!completed) { navigate("/assessment"); return; }
    const responses: Responses = JSON.parse(localStorage.getItem(`mm_responses_${user.id}`) || "{}");
    setResults(calculateAllResults(responses, user.role === "employee"));
  }, [user, navigate]);

  if (!user || !results) return null;

  const discData = [
    { name: "Dominant", value: results.disc.percentages.D },
    { name: "Influential", value: results.disc.percentages.I },
    { name: "Steady", value: results.disc.percentages.S },
    { name: "Compliant", value: results.disc.percentages.C },
  ];

  const quotientData = [
    { subject: "IQ", value: results.quotients.IQ },
    { subject: "EQ", value: results.quotients.EQ },
    { subject: "AQ", value: results.quotients.AQ },
    { subject: "CQ", value: results.quotients.CQ },
  ];

  const intelligenceData = Object.entries(results.intelligence.percentages).map(([key, value]) => ({
    name: key, value
  }));

  const careerData = Object.entries(results.career.percentages).map(([key, value]) => ({
    name: key, value
  }));

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Mind Mapping Assessment Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Name: ${user.name}`, 20, 35);
    doc.text(`Role: ${user.role}`, 20, 42);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 49);

    doc.setFontSize(14);
    doc.text("DISC Personality", 20, 65);
    doc.setFontSize(11);
    doc.text(`Result: ${results.disc.dominant}`, 20, 73);
    doc.text(`D: ${results.disc.percentages.D}% | I: ${results.disc.percentages.I}% | S: ${results.disc.percentages.S}% | C: ${results.disc.percentages.C}%`, 20, 80);

    doc.setFontSize(14);
    doc.text("MBTI Personality", 20, 95);
    doc.setFontSize(11);
    doc.text(`Type: ${results.mbti.type}`, 20, 103);

    doc.setFontSize(14);
    doc.text("Multiple Intelligence (Top 2)", 20, 118);
    doc.setFontSize(11);
    doc.text(results.intelligence.top2.join(", "), 20, 126);

    doc.setFontSize(14);
    doc.text("Learning Style", 20, 141);
    doc.setFontSize(11);
    doc.text(`Dominant: ${results.learningStyle.dominant}`, 20, 149);

    doc.setFontSize(14);
    doc.text("Quotients", 20, 164);
    doc.setFontSize(11);
    doc.text(`IQ: ${results.quotients.IQ}% | EQ: ${results.quotients.EQ}% | AQ: ${results.quotients.AQ}% | CQ: ${results.quotients.CQ}%`, 20, 172);

    doc.setFontSize(14);
    doc.text("Career Mapping (RIASEC)", 20, 187);
    doc.setFontSize(11);
    doc.text(`Top Areas: ${results.career.top2.join(", ")}`, 20, 195);
    doc.text(`Suggested Roles: ${results.career.suggestedRoles.join(", ")}`, 20, 202);

    if (user.role === "employee") {
      doc.setFontSize(14);
      doc.text("Brain Dominance", 20, 217);
      doc.setFontSize(11);
      doc.text(`Left: ${results.brainDominance.left}% | Right: ${results.brainDominance.right}%`, 20, 225);
    }

    doc.addPage();
    doc.setFontSize(16);
    doc.text("SWOT Analysis", 20, 20);

    doc.setFontSize(12);
    doc.text("Strengths:", 20, 35);
    doc.setFontSize(10);
    results.swot.strengths.forEach((s, i) => doc.text(`• ${s}`, 25, 43 + i * 7));

    const wStart = 43 + results.swot.strengths.length * 7 + 10;
    doc.setFontSize(12);
    doc.text("Weaknesses:", 20, wStart);
    doc.setFontSize(10);
    results.swot.weaknesses.forEach((s, i) => doc.text(`• ${s}`, 25, wStart + 8 + i * 7));

    const oStart = wStart + 8 + results.swot.weaknesses.length * 7 + 10;
    doc.setFontSize(12);
    doc.text("Opportunities:", 20, oStart);
    doc.setFontSize(10);
    results.swot.opportunities.forEach((s, i) => doc.text(`• ${s}`, 25, oStart + 8 + i * 7));

    const tStart = oStart + 8 + results.swot.opportunities.length * 7 + 10;
    doc.setFontSize(12);
    doc.text("Threats:", 20, tStart);
    doc.setFontSize(10);
    results.swot.threats.forEach((s, i) => doc.text(`• ${s}`, 25, tStart + 8 + i * 7));

    doc.save(`${user.name}_Assessment_Report.pdf`);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Assessment Results</h1>
            <p className="text-muted-foreground">{user.name} • {user.role}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button onClick={generatePDF} className="gradient-primary text-primary-foreground">Download PDF</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* DISC */}
          <Card className="shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg font-display">DISC Personality</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary font-semibold text-lg mb-3">{results.disc.dominant}</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={discData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                      {discData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* MBTI */}
          <Card className="shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg font-display">MBTI Personality</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="text-5xl font-display font-bold text-gradient mb-4">{results.mbti.type}</div>
              <div className="grid grid-cols-2 gap-2 text-sm w-full">
                {["E", "I", "S", "N", "T", "F", "J", "P"].map(k => (
                  <div key={k} className="flex justify-between px-2 py-1 rounded bg-muted">
                    <span className="font-medium">{k}</span>
                    <span className="text-muted-foreground">{results.mbti.scores[k as keyof typeof results.mbti.scores]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quotients Radar */}
          <Card className="shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg font-display">Quotients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={quotientData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <Radar name="Score" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                {quotientData.map(q => (
                  <div key={q.subject} className="flex justify-between px-2 py-1 rounded bg-muted">
                    <span className="font-medium">{q.subject}</span>
                    <span>{q.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Intelligence Bar */}
          <Card className="shadow-card animate-fade-in md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-display">Multiple Intelligence</CardTitle>
              <p className="text-sm text-muted-foreground">Top 2: {results.intelligence.top2.join(" & ")}</p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={intelligenceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {intelligenceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Learning Style */}
          <Card className="shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg font-display">Learning Style</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-primary font-semibold text-lg mb-4">{results.learningStyle.dominant}</p>
              {Object.entries(results.learningStyle.percentages).map(([key, val]) => (
                <div key={key} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{key}</span>
                    <span className="text-muted-foreground">{val}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${val}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Career Mapping */}
          <Card className="shadow-card animate-fade-in md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-display">Career Mapping (RIASEC)</CardTitle>
              <p className="text-sm text-muted-foreground">Top: {results.career.top2.join(" & ")}</p>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={careerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {careerData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium">Suggested Roles:</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {results.career.suggestedRoles.map(r => (
                    <span key={r} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">{r}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brain Dominance (Employee Only) */}
          {user.role === "employee" && (
            <Card className="shadow-card animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg font-display">Brain Dominance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-primary">{results.brainDominance.left}%</div>
                    <p className="text-sm text-muted-foreground">Left Brain</p>
                    <p className="text-xs text-muted-foreground">Logical</p>
                  </div>
                  <div className="w-px h-16 bg-border" />
                  <div className="flex-1 text-center">
                    <div className="text-2xl font-bold text-secondary">{results.brainDominance.right}%</div>
                    <p className="text-sm text-muted-foreground">Right Brain</p>
                    <p className="text-xs text-muted-foreground">Creative</p>
                  </div>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden flex">
                  <div className="h-full gradient-primary" style={{ width: `${results.brainDominance.left}%` }} />
                  <div className="h-full bg-secondary" style={{ width: `${results.brainDominance.right}%` }} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* SWOT */}
          <Card className="shadow-card animate-fade-in md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg font-display">SWOT Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "Strengths", items: results.swot.strengths, color: "bg-green-50 border-green-200 text-green-800" },
                  { title: "Weaknesses", items: results.swot.weaknesses, color: "bg-red-50 border-red-200 text-red-800" },
                  { title: "Opportunities", items: results.swot.opportunities, color: "bg-blue-50 border-blue-200 text-blue-800" },
                  { title: "Threats", items: results.swot.threats, color: "bg-yellow-50 border-yellow-200 text-yellow-800" },
                ].map(section => (
                  <div key={section.title} className={`p-4 rounded-lg border ${section.color}`}>
                    <h3 className="font-display font-semibold mb-2">{section.title}</h3>
                    <ul className="space-y-1">
                      {section.items.map((item, i) => (
                        <li key={i} className="text-sm">• {item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
