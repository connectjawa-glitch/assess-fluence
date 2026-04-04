import { type User } from "@/lib/auth";
import { calculateAllResults, type AssessmentResults, type Responses } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area
} from "recharts";
import { generateDeepReport } from "@/lib/pdfReport";
import { Download, Printer, ArrowLeft } from "lucide-react";
import {
  mbtiInterpretations, discInterpretations, intelligenceDescriptions,
  learningStyleDetails, quotientInterpretations, careerTypeDetails,
  generateCorrelationInsight, generateActionPlan, generateCareerRoadmap
} from "@/lib/interpretations";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#6366F1"];

const birdIcons: Record<string, string> = {
  Eagle: "🦅", Parrot: "🦜", Dove: "🕊️", Owl: "🦉",
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
  const birdEmoji = birdIcons[results.disc.bird] || "🦅";
  const discKey = results.disc.bird === "Eagle" ? "D" : results.disc.bird === "Parrot" ? "I" : results.disc.bird === "Dove" ? "S" : "C";
  const mbtiInfo = mbtiInterpretations[results.mbti.type];
  const discInfo = discInterpretations[discKey];
  const lsInfo = learningStyleDetails[results.learningStyle.dominant];
  const corr = generateCorrelationInsight(results.disc.dominant, results.mbti.type, results.quotients.IQ, results.quotients.EQ, results.quotients.AQ, results.quotients.CQ, results.learningStyle.dominant, results.intelligence.top2);
  const plan = generateActionPlan(results.quotients.IQ, results.quotients.EQ, results.quotients.AQ, results.quotients.CQ, results.learningStyle.dominant, results.career.top2);
  const roadmap = generateCareerRoadmap(results.career.top2, results.career.suggestedRoles);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {showBackButton && onBack && (
            <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
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
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" /> Print</Button>
          <Button size="sm" onClick={() => generateDeepReport(targetUser, results)} className="gradient-primary text-primary-foreground">
            <Download className="w-4 h-4 mr-1" /> Download Report (PDF)
          </Button>
        </div>
      </div>

      {/* ===== SECTION 1: PROFILE SUMMARY ===== */}
      <Card className="shadow-card border-2 border-primary/10">
        <CardHeader className="pb-2"><CardTitle className="text-base font-display">📋 1. Profile Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {[
              { label: "DISC", value: results.disc.dominant.split("(")[0].trim(), sub: `${birdEmoji} ${results.disc.bird}`, accent: true },
              { label: "MBTI", value: results.mbti.type, sub: mbtiInfo?.title || "" },
              { label: "Learning", value: results.learningStyle.dominant, sub: "Style" },
              { label: "Intelligence", value: results.intelligence.top2[0], sub: `& ${results.intelligence.top2[1]}` },
              { label: "IQ", value: `${results.quotients.IQ}%`, sub: "Intelligence Quotient" },
              { label: "EQ", value: `${results.quotients.EQ}%`, sub: "Emotional Quotient" },
              { label: "AQ", value: `${results.quotients.AQ}%`, sub: "Adversity Quotient" },
              { label: "CQ", value: `${results.quotients.CQ}%`, sub: "Creative Quotient" },
            ].map(b => (
              <div key={b.label} className={`p-3 rounded-lg text-center ${b.accent ? "bg-primary/10 border border-primary/20" : "bg-muted"}`}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{b.label}</p>
                <p className="text-sm font-display font-bold text-foreground">{b.value}</p>
                <p className="text-[10px] text-muted-foreground">{b.sub}</p>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {targetUser.name} is a <strong>{results.disc.dominant}</strong> ({birdEmoji}) personality with <strong>{results.mbti.type}</strong> ({mbtiInfo?.title || ""}) MBTI type.
              As a <strong>{results.learningStyle.dominant}</strong> learner with strong <strong>{results.intelligence.top2.join(" and ")}</strong> intelligence,
              they demonstrate {results.quotients.EQ >= 70 ? "strong emotional awareness" : "developing emotional skills"} (EQ: {results.quotients.EQ}%) and
              {results.quotients.IQ >= 70 ? " solid analytical capability" : " growing analytical ability"} (IQ: {results.quotients.IQ}%).
              Their career aptitude aligns with <strong>{results.career.top2.join(" and ")}</strong> domains, suggesting roles in {results.career.suggestedRoles.slice(0, 3).join(", ")}.
              {targetUser.role === "employee" && ` Brain dominance: Left ${results.brainDominance.left}% / Right ${results.brainDominance.right}%.`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 2: PERSONALITY INTERPRETATION (DISC + MBTI) ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-base font-display">🧬 2. Personality Interpretation (DISC + MBTI)</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {/* DISC Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">{birdEmoji} DISC — {results.disc.dominant}</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={discData} cx="50%" cy="50%" innerRadius={30} outerRadius={65} dataKey="value" label={({ name, value }) => `${name[0]}: ${value}%`} labelLine={false}>
                      {discData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">📈 DISC Radar</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={discRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <Radar dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* DISC Interpretation */}
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs font-semibold text-primary mb-1">Meaning</p>
              <p className="text-sm text-muted-foreground">{discInfo.meaning}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">💪 Strengths</p>
                <ul className="text-xs text-green-800 dark:text-green-300 space-y-0.5">{discInfo.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">⚠️ Risks</p>
                <ul className="text-xs text-red-800 dark:text-red-300 space-y-0.5">{discInfo.risks.map((r, i) => <li key={i}>• {r}</li>)}</ul>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs font-semibold text-primary mb-1">🏢 Workplace Fit</p>
              <p className="text-sm text-muted-foreground">{discInfo.workFit}</p>
            </div>
            {/* All DISC scores */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["D", "I", "S", "C"] as const).map(k => (
                <div key={k} className={`p-2 rounded-lg text-center ${k === discKey ? "bg-primary/10 border border-primary/30" : "bg-muted"}`}>
                  <p className="text-lg font-bold text-foreground">{results.disc.percentages[k]}%</p>
                  <p className="text-[10px] text-muted-foreground">{k === "D" ? "Dominant 🦅" : k === "I" ? "Influential 🦜" : k === "S" ? "Steady 🕊️" : "Compliant 🦉"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MBTI */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3">🧠 MBTI — {results.mbti.type} ({mbtiInfo?.title || ""})</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {(["E", "I", "S", "N", "T", "F", "J", "P"] as const).map(k => (
                <div key={k} className="flex justify-between px-3 py-2 rounded-lg bg-muted">
                  <span className="font-medium text-sm">{k}</span>
                  <span className="text-sm text-muted-foreground font-mono">{results.mbti.scores[k]}</span>
                </div>
              ))}
            </div>
            {mbtiInfo && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs font-semibold text-primary mb-1">Core Description</p>
                  <p className="text-sm text-muted-foreground">{mbtiInfo.description}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs font-semibold text-primary mb-1">💼 Work Style</p>
                    <p className="text-xs text-muted-foreground">{mbtiInfo.workStyle}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs font-semibold text-primary mb-1">👥 Team Strengths</p>
                    <p className="text-xs text-muted-foreground">{mbtiInfo.teamStrengths}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs font-semibold text-primary mb-1">🎯 Leadership</p>
                    <p className="text-xs text-muted-foreground">{mbtiInfo.leadership}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs font-semibold text-primary mb-1">💬 Communication</p>
                    <p className="text-xs text-muted-foreground">{mbtiInfo.communication}</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">⚠️ Weakness Patterns</p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">{mbtiInfo.weaknesses}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs font-semibold text-primary mb-1">🎯 Ideal Careers</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">{mbtiInfo.careers.map(c => <span key={c} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{c}</span>)}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 3: INTELLIGENCE ANALYSIS (IQ, EQ, AQ, CQ) ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-base font-display">💡 3. Intelligence Analysis (IQ, EQ, AQ, CQ)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={quotientData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <Radar dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overallProfile}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {quotientData.map(q => (
              <div key={q.subject} className="text-center p-3 rounded-lg bg-muted">
                <p className="text-lg font-bold text-foreground">{q.value}%</p>
                <p className="text-xs text-muted-foreground">{q.subject === "IQ" ? "Intelligence Quotient" : q.subject === "EQ" ? "Emotional Quotient" : q.subject === "AQ" ? "Adversity Quotient" : "Creative Quotient"}</p>
              </div>
            ))}
          </div>
          {(["IQ", "EQ", "AQ", "CQ"] as const).map(q => {
            const interp = quotientInterpretations[q](results.quotients[q]);
            return (
              <div key={q} className="p-4 rounded-lg border bg-card">
                <h4 className="text-sm font-semibold mb-2">{q === "IQ" ? "💡" : q === "EQ" ? "❤️" : q === "AQ" ? "⚡" : "🎨"} {q}: {results.quotients[q]}% — {q === "IQ" ? "Intelligence Quotient" : q === "EQ" ? "Emotional Quotient" : q === "AQ" ? "Adversity Quotient" : "Creative Quotient"}</h4>
                <p className="text-xs text-muted-foreground mb-2"><strong>Meaning:</strong> {interp.meaning}</p>
                <p className="text-xs text-muted-foreground mb-2"><strong>Impact:</strong> {interp.impact}</p>
                <p className="text-xs font-semibold text-primary mb-1">Improvement Steps:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">{interp.improvement.map((s, i) => <li key={i}>• {s}</li>)}</ul>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ===== SECTION 4: LEARNING STYLE ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-base font-display">📚 4. Learning Style Guide — {results.learningStyle.dominant}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={learningData} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                    {learningData.map((_, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {learningData.map(l => (
                <div key={l.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">{l.name}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${l.value}%` }} />
                  </div>
                  <span className="text-sm font-mono w-10 text-right">{l.value}%</span>
                </div>
              ))}
            </div>
          </div>
          {lsInfo && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs font-semibold text-primary mb-1">How {targetUser.name} Learns Best</p>
                <p className="text-sm text-muted-foreground">{lsInfo.howLearns}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">✅ Best Methods</p>
                  <ul className="text-xs text-green-800 dark:text-green-300 space-y-0.5">{lsInfo.bestMethods.map((m, i) => <li key={i}>• {m}</li>)}</ul>
                </div>
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">❌ Methods to Avoid</p>
                  <ul className="text-xs text-red-800 dark:text-red-300 space-y-0.5">{lsInfo.avoid.map((m, i) => <li key={i}>• {m}</li>)}</ul>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">🔧 Practical Techniques</p>
                  <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-0.5">{lsInfo.techniques.slice(0, 4).map((m, i) => <li key={i}>• {m}</li>)}</ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== SECTION 5: MULTIPLE INTELLIGENCE ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">🌟 5. Multiple Intelligence Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">Top 2: {results.intelligence.top2.join(" & ")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
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
          {results.intelligence.top2.map(intel => {
            const info = intelligenceDescriptions[intel];
            return (
              <div key={intel} className="p-4 rounded-lg border bg-card">
                <h4 className="text-sm font-semibold mb-2">🧠 {intel} Intelligence ({results.intelligence.percentages[intel]}%)</h4>
                <p className="text-xs text-muted-foreground mb-1"><strong>Meaning:</strong> {info.meaning}</p>
                <p className="text-xs text-muted-foreground mb-1"><strong>Real-Life Application:</strong> {info.application}</p>
                <p className="text-xs text-muted-foreground"><strong>Career Relevance:</strong> {info.careerRelevance}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ===== SECTION 6: CAREER FIT ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-display">🎯 6. Career Fit Analysis (RIASEC)</CardTitle>
              <p className="text-sm text-muted-foreground">Top: {results.career.top2.join(" & ")}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {results.career.suggestedRoles.map(r => (
                <span key={r} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">{r}</span>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
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
          {results.career.top2.map(career => {
            const info = careerTypeDetails[career];
            return (
              <div key={career} className="p-4 rounded-lg border bg-card">
                <h4 className="text-sm font-semibold mb-2">🎯 {career} ({results.career.percentages[career]}%)</h4>
                <p className="text-xs text-muted-foreground mb-1">{info.explanation}</p>
                <p className="text-xs text-muted-foreground mb-1"><strong>Industries:</strong> {info.industries.join(", ")}</p>
                <p className="text-xs text-muted-foreground mb-1"><strong>Roles:</strong> {info.roles.join(", ")}</p>
                <p className="text-xs text-muted-foreground"><strong>Growth Path:</strong> {info.growthPath}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ===== SECTION 7: SWOT ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-base font-display">🛡️ 7. SWOT Analysis (Expanded)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: "Strengths", items: results.swot.strengths, bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800", text: "text-green-800 dark:text-green-300", icon: "💪", detail: "These represent your core competencies and natural advantages that can be leveraged for career growth." },
              { title: "Weaknesses", items: results.swot.weaknesses, bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800", text: "text-red-800 dark:text-red-300", icon: "⚠️", detail: "These areas require focused development to prevent them from limiting your professional and personal growth." },
              { title: "Opportunities", items: results.swot.opportunities, bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800", text: "text-blue-800 dark:text-blue-300", icon: "🚀", detail: "These are actionable pathways aligned with your strengths, career mapping, and market demand." },
              { title: "Threats", items: results.swot.threats, bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", text: "text-amber-800 dark:text-amber-300", icon: "🛡️", detail: "These risks should be actively managed through preventive strategies and continuous development." },
            ].map(section => (
              <div key={section.title} className={`p-4 rounded-lg border ${section.bg} ${section.text}`}>
                <h3 className="font-display font-semibold mb-1">{section.icon} {section.title}</h3>
                <p className="text-xs opacity-80 mb-2">{section.detail}</p>
                <ul className="space-y-1">
                  {section.items.map((item, i) => <li key={i} className="text-sm">• {item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 8: COMBINED PERSONALITY INSIGHT ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-base font-display">🔗 8. Combined Personality Insight</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs font-semibold text-primary mb-1">Who {targetUser.name} Is</p>
            <p className="text-sm text-muted-foreground">{corr.whoTheyAre}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs font-semibold text-primary mb-1">How They Behave</p>
            <p className="text-sm text-muted-foreground">{corr.howTheyBehave}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs font-semibold text-primary mb-1">Where They Perform Best</p>
            <p className="text-sm text-muted-foreground">{corr.whereTheyPerformBest}</p>
          </div>
          <div className="p-3 rounded-lg border bg-card">
            <p className="text-xs font-semibold text-primary mb-2">🔗 Correlation Insights</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• DISC ({discKey}) + MBTI ({results.mbti.type}) → {discKey === "D" || discKey === "I" ? "Action-oriented behaviour with strong external focus" : "Reflective behaviour with strong internal processing"}</li>
              <li>• IQ ({results.quotients.IQ}%) + AQ ({results.quotients.AQ}%) → {results.quotients.IQ >= 70 && results.quotients.AQ >= 70 ? "High work capability under pressure" : "Moderate work capability — develop resilience alongside analytics"}</li>
              <li>• Learning ({results.learningStyle.dominant}) + Intelligence ({results.intelligence.top2[0]}) → Optimized {results.learningStyle.dominant.toLowerCase()} processing strength</li>
              <li>• EQ ({results.quotients.EQ}%) + DISC → {results.quotients.EQ >= 70 ? "Strong people management potential" : "Developing interpersonal capabilities"}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 9: ACTION PLAN ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-base font-display">📋 9. Action Plan (Short-Term & Long-Term)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">📚 Skill Development</p>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">{plan.skillDev.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">🌅 Daily Improvement</p>
              <ul className="text-xs text-green-800 dark:text-green-300 space-y-1">{plan.dailyPlan.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2">🧠 Behaviour Improvement</p>
              <ul className="text-xs text-purple-800 dark:text-purple-300 space-y-1">{plan.behaviourPlan.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 10: CAREER ROADMAP ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-base font-display">🗺️ 10. Career Roadmap</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-xs font-semibold text-primary mb-2">🎯 Short-Term (0-2 Years)</p>
              <ul className="text-xs text-muted-foreground space-y-1">{roadmap.shortTerm.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-xs font-semibold text-primary mb-2">🚀 Long-Term (3-10 Years)</p>
              <ul className="text-xs text-muted-foreground space-y-1">{roadmap.longTerm.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-xs font-semibold text-primary mb-1">🏭 Industry Path</p>
            <p className="text-sm text-muted-foreground">{roadmap.industryPath}</p>
          </div>
        </CardContent>
      </Card>

      {/* Brain Dominance (Employee) */}
      {targetUser.role === "employee" && (
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-base font-display">🧬 Brain Dominance</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 mb-4">
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold text-primary">{results.brainDominance.left}%</div>
                <p className="text-xs text-muted-foreground">🔬 Left Brain (Logical)</p>
              </div>
              <div className="w-px h-16 bg-border" />
              <div className="flex-1 text-center">
                <div className="text-3xl font-bold text-secondary">{results.brainDominance.right}%</div>
                <p className="text-xs text-muted-foreground">🎨 Right Brain (Creative)</p>
              </div>
            </div>
            <div className="h-5 bg-muted rounded-full overflow-hidden flex">
              <div className="h-full gradient-primary rounded-l-full transition-all" style={{ width: `${results.brainDominance.left}%` }} />
              <div className="h-full bg-secondary rounded-r-full transition-all" style={{ width: `${results.brainDominance.right}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download footer */}
      <div className="flex justify-center gap-3 py-6">
        <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" /> Print Report</Button>
        <Button onClick={() => generateDeepReport(targetUser, results)} className="gradient-primary text-primary-foreground">
          <Download className="w-4 h-4 mr-2" /> Download Full Report (PDF)
        </Button>
      </div>
    </div>
  );
}
