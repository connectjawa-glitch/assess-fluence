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
import perfyLogo from "@/assets/perfy-logo.jpeg";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#6366F1"];

const birdIcons: Record<string, string> = { Eagle: "🦅", Parrot: "🦜", Dove: "🕊️", Owl: "🦉" };

// Abbreviation explanation helpers
const discLetterExplain: Record<string, string> = {
  D: "D stands for Dominance — measures how you handle problems and assert yourself",
  I: "I stands for Influence — measures how you interact with and persuade others",
  S: "S stands for Steadiness — measures your patience, persistence, and thoughtfulness",
  C: "C stands for Compliance — measures how you approach rules, procedures, and details",
};

const mbtiLetterExplain: Record<string, string> = {
  E: "E = Extraversion — you gain energy from social interaction and the external world",
  I: "I = Introversion — you gain energy from solitude and internal reflection",
  S: "S = Sensing — you focus on concrete facts and real-world details",
  N: "N = Intuition — you focus on patterns, possibilities, and abstract ideas",
  T: "T = Thinking — you make decisions based on logic and objective analysis",
  F: "F = Feeling — you make decisions based on values and how they affect people",
  J: "J = Judging — you prefer structure, planning, and organization",
  P: "P = Perceiving — you prefer flexibility, spontaneity, and keeping options open",
};

const birdExplain: Record<string, string> = {
  Eagle: "You are an Eagle (🦅) — Eagles are bold, decisive leaders who take charge. They see the big picture, act fast, and drive results. Your dominant D score means you naturally lead from the front.",
  Parrot: "You are a Parrot (🦜) — Parrots are enthusiastic, social, and persuasive communicators. They energize teams and build connections. Your dominant I score means you naturally inspire others.",
  Dove: "You are a Dove (🕊️) — Doves are calm, supportive, and reliable team players. They value harmony and stability. Your dominant S score means you naturally create peaceful, productive environments.",
  Owl: "You are an Owl (🦉) — Owls are analytical, detail-oriented, and quality-focused. They ensure accuracy and thoroughness. Your dominant C score means you naturally maintain high standards.",
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
    { name: "D (Dominant)", value: results.disc.percentages.D },
    { name: "I (Influential)", value: results.disc.percentages.I },
    { name: "S (Steady)", value: results.disc.percentages.S },
    { name: "C (Compliant)", value: results.disc.percentages.C },
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
          <img src={perfyLogo} alt="Perfy" className="h-14 w-14 rounded-xl bg-foreground/5 p-0.5 shadow-md object-cover" />
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
        <CardHeader className="pb-2"><CardTitle className="text-lg font-display">📋 1. Profile Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {[
              { label: "DISC Personality", value: results.disc.dominant.split("(")[0].trim(), sub: `${birdEmoji} ${results.disc.bird}`, accent: true },
              { label: "MBTI Type", value: results.mbti.type, sub: mbtiInfo?.title || "" },
              { label: "Learning Style", value: results.learningStyle.dominant, sub: "Primary style" },
              { label: "Top Intelligence", value: results.intelligence.top2[0], sub: `& ${results.intelligence.top2[1]}` },
              { label: "IQ (Intelligence Quotient)", value: `${results.quotients.IQ}%`, sub: "Analytical ability" },
              { label: "EQ (Emotional Quotient)", value: `${results.quotients.EQ}%`, sub: "Emotional awareness" },
              { label: "AQ (Adversity Quotient)", value: `${results.quotients.AQ}%`, sub: "Resilience level" },
              { label: "CQ (Creative Quotient)", value: `${results.quotients.CQ}%`, sub: "Innovation ability" },
            ].map(b => (
              <div key={b.label} className={`p-3 rounded-lg text-center ${b.accent ? "bg-primary/10 border border-primary/20" : "bg-muted"}`}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{b.label}</p>
                <p className="text-lg font-display font-bold text-foreground">{b.value}</p>
                <p className="text-[10px] text-muted-foreground">{b.sub}</p>
              </div>
            ))}
          </div>

          {/* Overall Profile Area Chart */}
          <div className="h-48 mb-4">
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

          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Overall Summary:</strong> {targetUser.name} is a <strong>{results.disc.dominant}</strong> ({birdEmoji}) personality with <strong>{results.mbti.type}</strong> ({mbtiInfo?.title || ""}) MBTI type.
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
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display">🧬 2. Personality Interpretation (DISC + MBTI)</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>What is DISC?</strong> DISC is a behavioral assessment model that measures four dimensions: <strong>D</strong>ominance, <strong>I</strong>nfluence, <strong>S</strong>teadiness, and <strong>C</strong>ompliance. Each person has a dominant type represented by a bird archetype.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bird Explanation */}
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <p className="text-sm font-display font-semibold mb-1">{birdEmoji} Why You Are a {results.disc.bird}</p>
            <p className="text-sm text-muted-foreground">{birdExplain[results.disc.bird]}</p>
          </div>

          {/* DISC Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">{birdEmoji} DISC Pie Chart — {results.disc.dominant}</h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={discData} cx="50%" cy="50%" innerRadius={30} outerRadius={70} dataKey="value" label={({ name, value }) => `${name.split(" ")[0]}: ${value}%`} labelLine={false}>
                      {discData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">📈 DISC Radar Chart</h4>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={discRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <Radar dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Each DISC letter explanation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["D", "I", "S", "C"] as const).map(k => (
              <div key={k} className={`p-3 rounded-lg ${k === discKey ? "bg-primary/10 border-2 border-primary/30" : "bg-muted"}`}>
                <p className="text-xl font-bold text-foreground text-center">{results.disc.percentages[k]}%</p>
                <p className="text-xs text-center font-semibold">{k === "D" ? "🦅 Dominant" : k === "I" ? "🦜 Influential" : k === "S" ? "🕊️ Steady" : "🦉 Compliant"}</p>
                <p className="text-[10px] text-muted-foreground text-center mt-1">{discLetterExplain[k]}</p>
              </div>
            ))}
          </div>

          {/* DISC Interpretation */}
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs font-semibold text-primary mb-1">📖 What This Means</p>
              <p className="text-sm text-muted-foreground">{discInfo.meaning}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs font-semibold text-primary mb-1">🎭 Behaviour Traits</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">{discInfo.traits.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1">💪 Strengths</p>
                <ul className="text-xs text-green-800 dark:text-green-300 space-y-0.5">{discInfo.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">⚠️ Risks / Limitations</p>
                <ul className="text-xs text-red-800 dark:text-red-300 space-y-0.5">{discInfo.risks.map((r, i) => <li key={i}>• {r}</li>)}</ul>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs font-semibold text-primary mb-1">🏢 Workplace Fit</p>
              <p className="text-sm text-muted-foreground">{discInfo.workFit}</p>
            </div>
          </div>

          {/* MBTI */}
          <div className="border-t pt-6">
            <div className="mb-4">
              <h4 className="text-base font-display font-semibold mb-2">🧠 MBTI — {results.mbti.type} ({mbtiInfo?.title || ""})</h4>
              <div className="p-3 rounded-lg bg-muted/80 border">
                <p className="text-xs text-muted-foreground">
                  <strong>What is MBTI?</strong> The Myers-Briggs Type Indicator (MBTI) is a personality framework with 16 types, based on 4 dimensions:
                  <strong> E/I</strong> (how you get energy), <strong>S/N</strong> (how you take in info), <strong>T/F</strong> (how you decide), <strong>J/P</strong> (how you organize your life).
                  Your type <strong>{results.mbti.type}</strong> means you are {results.mbti.type.split("").map(l => mbtiLetterExplain[l]?.split("—")[1]?.trim()).filter(Boolean).join(", ")}.
                </p>
              </div>
            </div>

            {/* MBTI Dimension scores with explanations */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {(["E", "I", "S", "N", "T", "F", "J", "P"] as const).map(k => (
                <div key={k} className={`px-3 py-2 rounded-lg ${results.mbti.type.includes(k) ? "bg-primary/10 border border-primary/20" : "bg-muted"}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{k}</span>
                    <span className="text-sm text-muted-foreground font-mono">{results.mbti.scores[k]}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{mbtiLetterExplain[k]}</p>
                </div>
              ))}
            </div>

            {mbtiInfo && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-xs font-semibold text-primary mb-1">📖 Core Personality Description</p>
                  <p className="text-sm text-muted-foreground">{mbtiInfo.description}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted"><p className="text-xs font-semibold text-primary mb-1">💼 Work Style</p><p className="text-xs text-muted-foreground">{mbtiInfo.workStyle}</p></div>
                  <div className="p-3 rounded-lg bg-muted"><p className="text-xs font-semibold text-primary mb-1">👥 Team Strengths</p><p className="text-xs text-muted-foreground">{mbtiInfo.teamStrengths}</p></div>
                  <div className="p-3 rounded-lg bg-muted"><p className="text-xs font-semibold text-primary mb-1">🎯 Leadership Style</p><p className="text-xs text-muted-foreground">{mbtiInfo.leadership}</p></div>
                  <div className="p-3 rounded-lg bg-muted"><p className="text-xs font-semibold text-primary mb-1">💬 Communication Style</p><p className="text-xs text-muted-foreground">{mbtiInfo.communication}</p></div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">⚠️ Weakness Patterns</p>
                  <p className="text-xs text-amber-800 dark:text-amber-300">{mbtiInfo.weaknesses}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs font-semibold text-primary mb-1">🎯 Ideal Career Directions</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">{mbtiInfo.careers.map(c => <span key={c} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{c}</span>)}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 3: INTELLIGENCE ANALYSIS ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display">💡 3. Intelligence Analysis (IQ, EQ, AQ, CQ)</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>What are Quotients?</strong> These four quotients measure different dimensions of your intelligence:
            IQ = analytical thinking, EQ = emotional awareness, AQ = ability to handle adversity, CQ = creative innovation capability.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-56">
              <h4 className="text-xs font-semibold text-center mb-1">Quotient Radar Chart</h4>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={quotientData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <Radar dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 content-center">
              {quotientData.map(q => (
                <div key={q.subject} className="text-center p-4 rounded-lg bg-muted">
                  <p className="text-2xl font-bold text-foreground">{q.value}%</p>
                  <p className="text-xs font-semibold text-primary">{q.subject}</p>
                  <p className="text-[10px] text-muted-foreground">{q.subject === "IQ" ? "Intelligence Quotient" : q.subject === "EQ" ? "Emotional Quotient" : q.subject === "AQ" ? "Adversity Quotient" : "Creative Quotient"}</p>
                </div>
              ))}
            </div>
          </div>
          {(["IQ", "EQ", "AQ", "CQ"] as const).map(q => {
            const interp = quotientInterpretations[q](results.quotients[q]);
            const fullName = q === "IQ" ? "Intelligence Quotient — Analytical & Problem-Solving Ability" : q === "EQ" ? "Emotional Quotient — Emotional Awareness & Relationship Handling" : q === "AQ" ? "Adversity Quotient — Ability to Handle Stress & Failure" : "Creative Quotient — Innovation & Creative Ability";
            return (
              <div key={q} className="p-4 rounded-lg border bg-card">
                <h4 className="text-sm font-semibold mb-1">{q === "IQ" ? "💡" : q === "EQ" ? "❤️" : q === "AQ" ? "⚡" : "🎨"} {q}: {results.quotients[q]}%</h4>
                <p className="text-[11px] text-primary font-medium mb-2">{fullName}</p>
                <p className="text-xs text-muted-foreground mb-2"><strong>Meaning:</strong> {interp.meaning}</p>
                <p className="text-xs text-muted-foreground mb-2"><strong>Impact on Performance:</strong> {interp.impact}</p>
                <p className="text-xs font-semibold text-primary mb-1">Improvement Steps:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">{interp.improvement.map((s, i) => <li key={i}>• {s}</li>)}</ul>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ===== SECTION 4: LEARNING STYLE ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display">📚 4. Learning Style Guide — {results.learningStyle.dominant}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>What is Learning Style?</strong> Learning style measures how you absorb information best: <strong>Visual</strong> (seeing), <strong>Auditory</strong> (hearing), or <strong>Kinesthetic</strong> (doing/touching). Your dominant style is <strong>{results.learningStyle.dominant}</strong>.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={learningData} cx="50%" cy="50%" innerRadius={35} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                    {learningData.map((_, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {learningData.map(l => (
                <div key={l.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-24">{l.name}</span>
                  <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${l.value}%` }} />
                  </div>
                  <span className="text-sm font-mono w-12 text-right font-bold">{l.value}%</span>
                </div>
              ))}
            </div>
          </div>
          {lsInfo && (
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-xs font-semibold text-primary mb-1">🎓 How {targetUser.name} Learns Best</p>
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
                  <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-0.5">{lsInfo.techniques.slice(0, 5).map((m, i) => <li key={i}>• {m}</li>)}</ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== SECTION 5: MULTIPLE INTELLIGENCE ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display">🌟 5. Multiple Intelligence Analysis</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>What is Multiple Intelligence?</strong> Howard Gardner's theory identifies 8 types of intelligence. Everyone has all 8, but your top strengths are <strong>{results.intelligence.top2.join(" & ")}</strong>.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={intelligenceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
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
              <CardTitle className="text-lg font-display">🎯 6. Career Fit Analysis (RIASEC)</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>What is RIASEC?</strong> Holland's RIASEC model categorizes careers into 6 types: <strong>R</strong>ealistic, <strong>I</strong>nvestigative, <strong>A</strong>rtistic, <strong>S</strong>ocial, <strong>E</strong>nterprising, <strong>C</strong>onventional. Your top 2: <strong>{results.career.top2.join(" & ")}</strong>.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {results.career.suggestedRoles.map(r => (
              <span key={r} className="px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">{r}</span>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={careerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
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
                <p className="text-xs text-muted-foreground mb-2">{info.explanation}</p>
                <p className="text-xs text-muted-foreground mb-1"><strong>Suitable Industries:</strong> {info.industries.join(", ")}</p>
                <p className="text-xs text-muted-foreground mb-1"><strong>Job Roles:</strong> {info.roles.join(", ")}</p>
                <p className="text-xs text-muted-foreground"><strong>Growth Path:</strong> {info.growthPath}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* ===== SECTION 7: SWOT ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display">🛡️ 7. SWOT Analysis (Expanded)</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>What is SWOT?</strong> SWOT stands for <strong>S</strong>trengths, <strong>W</strong>eaknesses, <strong>O</strong>pportunities, and <strong>T</strong>hreats — a framework to understand your current position and plan growth.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { title: "Strengths", items: results.swot.strengths, bg: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800", text: "text-green-800 dark:text-green-300", icon: "💪", detail: "Core competencies and natural advantages that can be leveraged for career growth and success." },
              { title: "Weaknesses", items: results.swot.weaknesses, bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800", text: "text-red-800 dark:text-red-300", icon: "⚠️", detail: "Areas requiring focused development to prevent them from limiting professional and personal growth." },
              { title: "Opportunities", items: results.swot.opportunities, bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800", text: "text-blue-800 dark:text-blue-300", icon: "🚀", detail: "Actionable pathways aligned with your strengths, career mapping, and market demand." },
              { title: "Threats", items: results.swot.threats, bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", text: "text-amber-800 dark:text-amber-300", icon: "🛡️", detail: "Risks that should be actively managed through preventive strategies and continuous development." },
            ].map(section => (
              <div key={section.title} className={`p-4 rounded-lg border ${section.bg} ${section.text}`}>
                <h3 className="font-display font-semibold mb-1">{section.icon} {section.title}</h3>
                <p className="text-xs opacity-80 mb-2">{section.detail}</p>
                <ul className="space-y-1">{section.items.map((item, i) => <li key={i} className="text-sm">• {item}</li>)}</ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 8: COMBINED PERSONALITY INSIGHT ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display">🔗 8. Combined Personality Insight</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Cross-dimensional analysis combining DISC + MBTI + Quotients + Intelligence to create a holistic view.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 rounded-lg bg-muted"><p className="text-xs font-semibold text-primary mb-1">🧑 Who {targetUser.name} Is</p><p className="text-sm text-muted-foreground">{corr.whoTheyAre}</p></div>
          <div className="p-4 rounded-lg bg-muted"><p className="text-xs font-semibold text-primary mb-1">🎭 How They Behave</p><p className="text-sm text-muted-foreground">{corr.howTheyBehave}</p></div>
          <div className="p-4 rounded-lg bg-muted"><p className="text-xs font-semibold text-primary mb-1">🏆 Where They Perform Best</p><p className="text-sm text-muted-foreground">{corr.whereTheyPerformBest}</p></div>
          <div className="p-4 rounded-lg border bg-card">
            <p className="text-xs font-semibold text-primary mb-2">🔗 Correlation Insights</p>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>• <strong>DISC ({discKey}) + MBTI ({results.mbti.type})</strong> → {discKey === "D" || discKey === "I" ? "Action-oriented behaviour with strong external focus" : "Reflective behaviour with strong internal processing"}</li>
              <li>• <strong>IQ ({results.quotients.IQ}%) + AQ ({results.quotients.AQ}%)</strong> → {results.quotients.IQ >= 70 && results.quotients.AQ >= 70 ? "High work capability under pressure" : "Moderate work capability — develop resilience alongside analytics"}</li>
              <li>• <strong>Learning ({results.learningStyle.dominant}) + Intelligence ({results.intelligence.top2[0]})</strong> → Optimized {results.learningStyle.dominant.toLowerCase()} processing combined with {results.intelligence.top2[0].toLowerCase()} strength</li>
              <li>• <strong>EQ ({results.quotients.EQ}%) + DISC ({discKey})</strong> → {results.quotients.EQ >= 70 ? "Strong people management potential" : "Developing interpersonal capabilities"}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 9: ACTION PLAN ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-lg font-display">📋 9. Action Plan (Short-Term & Long-Term)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">📚 Skill Development Plan</p>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">{plan.skillDev.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">🌅 Daily Improvement Plan</p>
              <ul className="text-xs text-green-800 dark:text-green-300 space-y-1">{plan.dailyPlan.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2">🧠 Behaviour Improvement Plan</p>
              <ul className="text-xs text-purple-800 dark:text-purple-300 space-y-1">{plan.behaviourPlan.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== SECTION 10: CAREER ROADMAP ===== */}
      <Card className="shadow-card">
        <CardHeader className="pb-2"><CardTitle className="text-lg font-display">🗺️ 10. Career Roadmap</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-xs font-semibold text-primary mb-2">🎯 Short-Term Goals (0-2 Years)</p>
              <ul className="text-xs text-muted-foreground space-y-1">{roadmap.shortTerm.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            </div>
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-xs font-semibold text-primary mb-2">🚀 Long-Term Goals (3-10 Years)</p>
              <ul className="text-xs text-muted-foreground space-y-1">{roadmap.longTerm.map((s, i) => <li key={i}>• {s}</li>)}</ul>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-xs font-semibold text-primary mb-1">🏭 Industry Path</p>
            <p className="text-sm text-muted-foreground">{roadmap.industryPath}</p>
          </div>
        </CardContent>
      </Card>

      {/* Brain Dominance (Employee) */}
      {targetUser.role === "employee" && (
        <Card className="shadow-card">
          <CardHeader className="pb-2"><CardTitle className="text-lg font-display">🧬 Brain Dominance</CardTitle></CardHeader>
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
      <div className="flex flex-col items-center gap-3 py-8 border-t">
        <img src={perfyLogo} alt="Perfy" className="h-10 rounded-lg bg-foreground/5 p-1" />
        <p className="text-xs text-muted-foreground">Perfy — From Effort to Impact</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handlePrint}><Printer className="w-4 h-4 mr-2" /> Print Report</Button>
          <Button onClick={() => generateDeepReport(targetUser, results)} className="gradient-primary text-primary-foreground">
            <Download className="w-4 h-4 mr-2" /> Download Full Report (PDF)
          </Button>
        </div>
      </div>
    </div>
  );
}