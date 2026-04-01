import { type User } from "@/lib/auth";
import { calculateAllResults, type AssessmentResults, type Responses } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area
} from "recharts";
import jsPDF from "jspdf";
import { Download, Printer, ArrowLeft } from "lucide-react";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#6366F1"];

interface Props {
  targetUser: User;
  onBack?: () => void;
  showBackButton?: boolean;
}

export default function UserReport({ targetUser, onBack, showBackButton = true }: Props) {
  const responses: Responses = JSON.parse(localStorage.getItem(`mm_responses_${targetUser.id}`) || "{}");
  const results: AssessmentResults = calculateAllResults(responses, targetUser.role === "employee");

  const discData = [
    { name: "Dominant", value: results.disc.percentages.D },
    { name: "Influential", value: results.disc.percentages.I },
    { name: "Steady", value: results.disc.percentages.S },
    { name: "Compliant", value: results.disc.percentages.C },
  ];

  const quotientData = [
    { subject: "IQ", value: results.quotients.IQ, fullMark: 100 },
    { subject: "EQ", value: results.quotients.EQ, fullMark: 100 },
    { subject: "AQ", value: results.quotients.AQ, fullMark: 100 },
    { subject: "CQ", value: results.quotients.CQ, fullMark: 100 },
  ];

  const intelligenceData = Object.entries(results.intelligence.percentages).map(([key, value]) => ({ name: key, value }));
  const careerData = Object.entries(results.career.percentages).map(([key, value]) => ({ name: key, value }));

  const learningData = Object.entries(results.learningStyle.percentages).map(([key, value]) => ({ name: key, value }));

  const discRadarData = [
    { subject: "D", value: results.disc.percentages.D, fullMark: 100 },
    { subject: "I", value: results.disc.percentages.I, fullMark: 100 },
    { subject: "S", value: results.disc.percentages.S, fullMark: 100 },
    { subject: "C", value: results.disc.percentages.C, fullMark: 100 },
  ];

  const overallProfile = [
    { name: "IQ", value: results.quotients.IQ },
    { name: "EQ", value: results.quotients.EQ },
    { name: "AQ", value: results.quotients.AQ },
    { name: "CQ", value: results.quotients.CQ },
    { name: "DISC", value: Math.max(results.disc.percentages.D, results.disc.percentages.I, results.disc.percentages.S, results.disc.percentages.C) },
    { name: "Career", value: Math.max(...Object.values(results.career.percentages)) },
  ];

  const generatePDF = () => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pw, 45, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Mind Mapping Assessment Report", pw / 2, 18, { align: "center" });
    doc.setFontSize(11);
    doc.text(`${targetUser.name} • ${targetUser.role.charAt(0).toUpperCase() + targetUser.role.slice(1)}`, pw / 2, 28, { align: "center" });
    if (targetUser.companyName) {
      doc.text(`${targetUser.companyName} (${targetUser.companyCode}) • ${targetUser.department || ""}`, pw / 2, 36, { align: "center" });
    }
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pw / 2, targetUser.companyName ? 42 : 36, { align: "center" });

    doc.setTextColor(0, 0, 0);
    let y = 55;

    // DISC
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text("DISC Personality", 20, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    y += 10;
    doc.text(`Type: ${results.disc.dominant}`, 20, y);
    y += 7;
    doc.text(`D: ${results.disc.percentages.D}% | I: ${results.disc.percentages.I}% | S: ${results.disc.percentages.S}% | C: ${results.disc.percentages.C}%`, 20, y);
    y += 15;

    // MBTI
    doc.setFontSize(14);
    doc.setTextColor(139, 92, 246);
    doc.text("MBTI Personality", 20, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    y += 10;
    doc.text(`Type: ${results.mbti.type}`, 20, y);
    y += 15;

    // Intelligence
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129);
    doc.text("Multiple Intelligence (Top 2)", 20, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    y += 10;
    doc.text(results.intelligence.top2.join(" & "), 20, y);
    y += 7;
    Object.entries(results.intelligence.percentages).forEach(([k, v]) => {
      doc.text(`${k}: ${v}%`, 25, y);
      y += 6;
    });
    y += 8;

    // Learning Style
    doc.setFontSize(14);
    doc.setTextColor(245, 158, 11);
    doc.text("Learning Style", 20, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    y += 10;
    doc.text(`Dominant: ${results.learningStyle.dominant}`, 20, y);
    y += 7;
    Object.entries(results.learningStyle.percentages).forEach(([k, v]) => {
      doc.text(`${k}: ${v}%`, 25, y);
      y += 6;
    });
    y += 8;

    // Quotients
    doc.setFontSize(14);
    doc.setTextColor(6, 182, 212);
    doc.text("Quotients", 20, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    y += 10;
    doc.text(`IQ: ${results.quotients.IQ}% | EQ: ${results.quotients.EQ}% | AQ: ${results.quotients.AQ}% | CQ: ${results.quotients.CQ}%`, 20, y);
    y += 15;

    // Career
    doc.setFontSize(14);
    doc.setTextColor(236, 72, 153);
    doc.text("Career Mapping (RIASEC)", 20, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    y += 10;
    doc.text(`Top: ${results.career.top2.join(" & ")}`, 20, y);
    y += 7;
    doc.text(`Roles: ${results.career.suggestedRoles.join(", ")}`, 20, y);

    // Brain Dominance
    if (targetUser.role === "employee") {
      y += 15;
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text("Brain Dominance", 20, y);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      y += 10;
      doc.text(`Left Brain: ${results.brainDominance.left}% | Right Brain: ${results.brainDominance.right}%`, 20, y);
    }

    // SWOT page
    doc.addPage();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pw, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("SWOT Analysis", pw / 2, 14, { align: "center" });
    doc.setTextColor(0, 0, 0);

    const sections = [
      { title: "Strengths", items: results.swot.strengths, color: [34, 197, 94] as [number, number, number] },
      { title: "Weaknesses", items: results.swot.weaknesses, color: [239, 68, 68] as [number, number, number] },
      { title: "Opportunities", items: results.swot.opportunities, color: [59, 130, 246] as [number, number, number] },
      { title: "Threats", items: results.swot.threats, color: [245, 158, 11] as [number, number, number] },
    ];

    let sy = 35;
    sections.forEach(section => {
      doc.setFontSize(13);
      doc.setTextColor(...section.color);
      doc.text(section.title, 20, sy);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      sy += 8;
      section.items.forEach(item => {
        doc.text(`• ${item}`, 25, sy);
        sy += 7;
      });
      sy += 8;
    });

    // Recommendations
    sy += 5;
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text("Recommendations", 20, sy);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    sy += 10;
    const recs = [
      `Focus on developing ${results.intelligence.top2[0]} intelligence for career growth.`,
      `Your ${results.learningStyle.dominant} learning style suggests using ${results.learningStyle.dominant === "Visual" ? "diagrams and videos" : results.learningStyle.dominant === "Auditory" ? "podcasts and discussions" : "hands-on practice"}.`,
      `Consider careers in ${results.career.top2.join(" and ")} domains.`,
      results.quotients.AQ < 70 ? "Work on building resilience and adversity management." : "Your resilience is strong — maintain it.",
      `Your MBTI type (${results.mbti.type}) aligns well with ${results.career.suggestedRoles[0]} roles.`,
    ];
    recs.forEach(r => {
      doc.text(`• ${r}`, 25, sy);
      sy += 7;
    });

    doc.save(`${targetUser.name.replace(/\s+/g, "_")}_Assessment_Report.pdf`);
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {showBackButton && onBack && (
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">{targetUser.name}</h2>
            <p className="text-sm text-muted-foreground capitalize">
              {targetUser.role}
              {targetUser.companyName && ` • ${targetUser.companyName}`}
              {targetUser.department && ` • ${targetUser.department}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          <Button size="sm" onClick={generatePDF} className="gradient-primary text-primary-foreground">
            <Download className="w-4 h-4 mr-1" /> PDF Report
          </Button>
        </div>
      </div>

      {/* Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "DISC", value: results.disc.bird, sub: results.disc.dominant.split(" ")[0] },
          { label: "MBTI", value: results.mbti.type, sub: "Personality" },
          { label: "Learning", value: results.learningStyle.dominant, sub: "Style" },
          { label: "IQ", value: `${results.quotients.IQ}%`, sub: "Intelligence" },
          { label: "EQ", value: `${results.quotients.EQ}%`, sub: "Emotional" },
          { label: "Career", value: results.career.top2[0], sub: results.career.top2[1] },
        ].map(badge => (
          <Card key={badge.label} className="shadow-card">
            <CardContent className="p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{badge.label}</p>
              <p className="text-lg font-display font-bold text-primary mt-1">{badge.value}</p>
              <p className="text-[10px] text-muted-foreground">{badge.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall Profile Area Chart */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">Overall Profile Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overallProfile}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* DISC Pie + Radar */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">DISC Personality</CardTitle>
            <p className="text-sm text-primary font-medium">{results.disc.dominant}</p>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={discData} cx="50%" cy="50%" innerRadius={30} outerRadius={60} dataKey="value" label={({ name, value }) => `${name[0]}: ${value}%`} labelLine={false}>
                    {discData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* DISC Radar */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">DISC Radar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={discRadarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* MBTI */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">MBTI Personality</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="text-4xl font-display font-bold text-gradient mb-3">{results.mbti.type}</div>
            <div className="grid grid-cols-2 gap-1.5 text-xs w-full">
              {(["E", "I", "S", "N", "T", "F", "J", "P"] as const).map(k => (
                <div key={k} className="flex justify-between px-2 py-1 rounded bg-muted">
                  <span className="font-medium">{k}</span>
                  <span className="text-muted-foreground">{results.mbti.scores[k]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quotients Radar */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Quotients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={quotientData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <Radar dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-2">
              {quotientData.map(q => (
                <div key={q.subject} className="text-center p-1.5 rounded bg-muted">
                  <p className="text-xs text-muted-foreground">{q.subject}</p>
                  <p className="text-sm font-bold text-foreground">{q.value}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Learning Style Donut */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Learning Style</CardTitle>
            <p className="text-sm text-primary font-medium">{results.learningStyle.dominant}</p>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={learningData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                    {learningData.map((_, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Brain Dominance */}
        {targetUser.role === "employee" && (
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-display">Brain Dominance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-primary">{results.brainDominance.left}%</div>
                  <p className="text-xs text-muted-foreground">Left (Logical)</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-secondary">{results.brainDominance.right}%</div>
                  <p className="text-xs text-muted-foreground">Right (Creative)</p>
                </div>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                <div className="h-full gradient-primary rounded-l-full" style={{ width: `${results.brainDominance.left}%` }} />
                <div className="h-full bg-secondary rounded-r-full" style={{ width: `${results.brainDominance.right}%` }} />
              </div>
              <div className="mt-4 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ name: "Brain", Left: results.brainDominance.left, Right: results.brainDominance.right }]}>
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="Left" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Right" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Intelligence Full Width */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">Multiple Intelligence</CardTitle>
          <p className="text-sm text-muted-foreground">Top 2: {results.intelligence.top2.join(" & ")}</p>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intelligenceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {intelligenceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Career Mapping Full Width */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-display">Career Mapping (RIASEC)</CardTitle>
              <p className="text-sm text-muted-foreground">Top: {results.career.top2.join(" & ")}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {results.career.suggestedRoles.map(r => (
                <span key={r} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{r}</span>
              ))}
            </div>
          </div>
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
        </CardContent>
      </Card>

      {/* SWOT */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">SWOT Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: "Strengths", items: results.swot.strengths, bg: "bg-green-50 border-green-200", text: "text-green-800", icon: "💪" },
              { title: "Weaknesses", items: results.swot.weaknesses, bg: "bg-red-50 border-red-200", text: "text-red-800", icon: "⚠️" },
              { title: "Opportunities", items: results.swot.opportunities, bg: "bg-blue-50 border-blue-200", text: "text-blue-800", icon: "🚀" },
              { title: "Threats", items: results.swot.threats, bg: "bg-amber-50 border-amber-200", text: "text-amber-800", icon: "🛡️" },
            ].map(section => (
              <div key={section.title} className={`p-4 rounded-lg border ${section.bg} ${section.text}`}>
                <h3 className="font-display font-semibold mb-2">{section.icon} {section.title}</h3>
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

      {/* Recommendations */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">📋 Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="p-3 rounded-lg bg-muted">
              <span className="font-medium">Intelligence Focus:</span> Develop your {results.intelligence.top2[0]} intelligence for maximum career impact.
            </li>
            <li className="p-3 rounded-lg bg-muted">
              <span className="font-medium">Learning Strategy:</span> As a {results.learningStyle.dominant} learner, use{" "}
              {results.learningStyle.dominant === "Visual" ? "diagrams, mind maps, and videos" : results.learningStyle.dominant === "Auditory" ? "podcasts, discussions, and verbal instructions" : "hands-on projects, simulations, and experiments"}.
            </li>
            <li className="p-3 rounded-lg bg-muted">
              <span className="font-medium">Career Path:</span> Explore {results.career.top2.join(" and ")} domains — consider roles like {results.career.suggestedRoles.join(", ")}.
            </li>
            <li className="p-3 rounded-lg bg-muted">
              <span className="font-medium">Personality:</span> Your {results.mbti.type} personality combined with {results.disc.dominant} DISC type makes you well-suited for collaborative and structured environments.
            </li>
            {results.quotients.AQ < 70 && (
              <li className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <span className="font-medium text-destructive">Growth Area:</span> Focus on building resilience (AQ: {results.quotients.AQ}%) through challenging projects and mindset training.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
