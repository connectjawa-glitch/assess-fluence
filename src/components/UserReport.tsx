import { type User } from "@/lib/auth";
import { calculateAllResults, type AssessmentResults, type Responses } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area
} from "recharts";
import { generateDeepReport } from "@/lib/pdfReport";
import { Download, Printer, ArrowLeft, FileText, Bird, Shield, Eye as EyeIcon, Feather } from "lucide-react";
import { mbtiInterpretations, discInterpretations } from "@/lib/interpretations";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#6366F1"];

const birdIcons: Record<string, { icon: typeof Bird; color: string; label: string }> = {
  Eagle: { icon: Bird, color: "text-red-500", label: "🦅 Eagle" },
  Parrot: { icon: Feather, color: "text-green-500", label: "🦜 Parrot" },
  Dove: { icon: Bird, color: "text-blue-400", label: "🕊️ Dove" },
  Owl: { icon: EyeIcon, color: "text-amber-500", label: "🦉 Owl" },
};

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

  const handlePrint = () => window.print();
  const birdInfo = birdIcons[results.disc.bird] || birdIcons.Eagle;
  const discKey = results.disc.bird === "Eagle" ? "D" : results.disc.bird === "Parrot" ? "I" : results.disc.bird === "Dove" ? "S" : "C";
  const mbtiInfo = mbtiInterpretations[results.mbti.type];
  const discInfo = discInterpretations[discKey];

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
              {(targetUser as any).school && ` • ${(targetUser as any).school}`}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          <Button size="sm" variant="outline" onClick={() => generateDeepReport(targetUser, results)}>
            <FileText className="w-4 h-4 mr-1" /> Full Report (14pg)
          </Button>
          <Button size="sm" onClick={() => generateDeepReport(targetUser, results)} className="gradient-primary text-primary-foreground">
            <Download className="w-4 h-4 mr-1" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Summary Badges with Bird Icons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="shadow-card border-2 border-primary/20">
          <CardContent className="p-3 text-center">
            <div className="text-3xl mb-1">{birdInfo.label.split(" ")[0]}</div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">DISC</p>
            <p className="text-sm font-display font-bold text-primary">{results.disc.dominant.split(" ")[0]}</p>
            <p className="text-[10px] text-muted-foreground">{birdInfo.label.split(" ")[1]}</p>
          </CardContent>
        </Card>
        {[
          { label: "MBTI", value: results.mbti.type, sub: mbtiInfo?.title || "Personality", emoji: "🧠" },
          { label: "Learning", value: results.learningStyle.dominant, sub: "Style", emoji: "📚" },
          { label: "IQ", value: `${results.quotients.IQ}%`, sub: "Intelligence", emoji: "💡" },
          { label: "EQ", value: `${results.quotients.EQ}%`, sub: "Emotional", emoji: "❤️" },
          { label: "Career", value: results.career.top2[0], sub: results.career.top2[1], emoji: "🎯" },
        ].map(badge => (
          <Card key={badge.label} className="shadow-card">
            <CardContent className="p-3 text-center">
              <div className="text-2xl mb-1">{badge.emoji}</div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{badge.label}</p>
              <p className="text-sm font-display font-bold text-primary">{badge.value}</p>
              <p className="text-[10px] text-muted-foreground">{badge.sub}</p>
            </CardContent>
          </Card>
        ))}
        {targetUser.role === "employee" && (
          <Card className="shadow-card">
            <CardContent className="p-3 text-center">
              <div className="text-2xl mb-1">🧬</div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Brain</p>
              <p className="text-sm font-display font-bold text-primary">L:{results.brainDominance.left}%</p>
              <p className="text-[10px] text-muted-foreground">R:{results.brainDominance.right}%</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Personality Summary */}
      <Card className="shadow-card bg-gradient-to-r from-primary/5 to-secondary/5">
        <CardContent className="p-5">
          <h3 className="text-sm font-display font-semibold mb-2 text-primary">📝 Personality Summary</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {targetUser.name} is a <strong>{results.disc.dominant}</strong> personality with <strong>{results.mbti.type}</strong> ({mbtiInfo?.title || ""}) type.
            As a <strong>{results.learningStyle.dominant}</strong> learner with strong <strong>{results.intelligence.top2.join(" and ")}</strong> intelligence,
            they demonstrate {results.quotients.EQ >= 70 ? "strong emotional awareness" : "developing emotional skills"} and
            {results.quotients.IQ >= 70 ? " solid analytical capability" : " growing analytical ability"}.
            Their career aptitude aligns with <strong>{results.career.top2.join(" and ")}</strong> domains.
          </p>
        </CardContent>
      </Card>

      {/* Overall Profile Area Chart */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">📊 Overall Profile Snapshot</CardTitle>
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
        {/* DISC Pie */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">
              <span className="text-xl mr-2">{birdInfo.label.split(" ")[0]}</span>
              DISC Personality
            </CardTitle>
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
            <p className="text-xs text-muted-foreground mt-2 italic">{discInfo?.brief}</p>
          </CardContent>
        </Card>

        {/* DISC Radar */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">📈 DISC Radar</CardTitle>
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
            <CardTitle className="text-base font-display">🧠 MBTI — {results.mbti.type}</CardTitle>
            {mbtiInfo && <p className="text-xs text-muted-foreground">{mbtiInfo.title}</p>}
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="text-4xl font-display font-bold text-gradient mb-2">{results.mbti.type}</div>
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
            <CardTitle className="text-base font-display">💡 Quotients</CardTitle>
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

        {/* Learning Style */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">📚 Learning Style</CardTitle>
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
              <CardTitle className="text-base font-display">🧬 Brain Dominance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-primary">{results.brainDominance.left}%</div>
                  <p className="text-xs text-muted-foreground">🔬 Left (Logical)</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-secondary">{results.brainDominance.right}%</div>
                  <p className="text-xs text-muted-foreground">🎨 Right (Creative)</p>
                </div>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                <div className="h-full gradient-primary rounded-l-full" style={{ width: `${results.brainDominance.left}%` }} />
                <div className="h-full bg-secondary rounded-r-full" style={{ width: `${results.brainDominance.right}%` }} />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Intelligence Full Width */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">🌟 Multiple Intelligence</CardTitle>
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

      {/* Career Mapping */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-display">🎯 Career Mapping (RIASEC)</CardTitle>
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
          <CardTitle className="text-base font-display">🛡️ SWOT Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: "Strengths", items: results.swot.strengths, bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800", text: "text-green-800 dark:text-green-300", icon: "💪" },
              { title: "Weaknesses", items: results.swot.weaknesses, bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800", text: "text-red-800 dark:text-red-300", icon: "⚠️" },
              { title: "Opportunities", items: results.swot.opportunities, bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800", text: "text-blue-800 dark:text-blue-300", icon: "🚀" },
              { title: "Threats", items: results.swot.threats, bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", text: "text-amber-800 dark:text-amber-300", icon: "🛡️" },
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
          <CardTitle className="text-base font-display">📋 Recommendations & Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="p-3 rounded-lg bg-muted">
              <span className="font-medium">🌟 Intelligence Focus:</span> Develop your {results.intelligence.top2[0]} intelligence for maximum career impact.
            </li>
            <li className="p-3 rounded-lg bg-muted">
              <span className="font-medium">📚 Learning Strategy:</span> As a {results.learningStyle.dominant} learner, use{" "}
              {results.learningStyle.dominant === "Visual" ? "diagrams, mind maps, and videos" : results.learningStyle.dominant === "Auditory" ? "podcasts, discussions, and verbal instructions" : "hands-on projects, simulations, and experiments"}.
            </li>
            <li className="p-3 rounded-lg bg-muted">
              <span className="font-medium">🎯 Career Path:</span> Explore {results.career.top2.join(" and ")} domains — consider roles like {results.career.suggestedRoles.join(", ")}.
            </li>
            <li className="p-3 rounded-lg bg-muted">
              <span className="font-medium">🧠 Personality:</span> Your {results.mbti.type} ({mbtiInfo?.title || ""}) combined with {results.disc.dominant} makes you well-suited for {discInfo?.workFit?.split(".")[0] || "specialized environments"}.
            </li>
            {results.quotients.AQ < 70 && (
              <li className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <span className="font-medium text-destructive">⚡ Growth Area:</span> Focus on building resilience (AQ: {results.quotients.AQ}%) through challenging projects.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Download footer */}
      <div className="flex justify-center gap-3 py-4">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Print Report
        </Button>
        <Button onClick={() => generateDeepReport(targetUser, results)} className="gradient-primary text-primary-foreground">
          <Download className="w-4 h-4 mr-2" /> Download Deep Report (14 Pages)
        </Button>
      </div>
    </div>
  );
}
