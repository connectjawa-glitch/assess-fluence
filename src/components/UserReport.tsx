import { useState } from "react";
import { type User, useAuth } from "@/lib/auth";
import { calculateAllResults, type AssessmentResults, type Responses } from "@/lib/scoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area, PolarRadiusAxis
} from "recharts";
import { generateDeepReport } from "@/lib/pdfReport";
import { Download, Printer, ArrowLeft, Brain, Target, BookOpen, Lightbulb, Shield, Rocket, TrendingUp, Users, Star, Zap, Lock } from "lucide-react";
import {
  mbtiInterpretations, discInterpretations, intelligenceDescriptions,
  learningStyleDetails, quotientInterpretations, careerTypeDetails,
  generateCorrelationInsight, generateActionPlan, generateCareerRoadmap
} from "@/lib/interpretations";
import { BrainLogo } from "@/components/BrainLogo";
import PaymentDialog from "@/components/PaymentDialog";

const COLORS = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#6366F1"];



const birdIcons: Record<string, string> = { Eagle: "🦅", Parrot: "🦜", Dove: "🕊️", Owl: "🦉" };

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

// Animated section wrapper
function Section({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div className={`animate-fade-in ${className}`} style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}>
      {children}
    </div>
  );
}

// Score gauge component
function ScoreGauge({ label, value, icon, color, subtitle }: { label: string; value: number; icon: React.ReactNode; color: string; subtitle: string }) {
  const pct = Math.min(value, 100);
  return (
    <div className="relative p-4 rounded-xl bg-gradient-to-br from-background to-muted/50 border border-border/50 hover-scale group">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${color}`}>{icon}</div>
        <div>
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        <span className="text-sm text-muted-foreground mb-0.5">%</span>
      </div>
      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS[0]}, ${COLORS[1]})` }} />
      </div>
    </div>
  );
}

// Info card component
function InfoCard({ icon, title, children, accent = "blue" }: { icon: string; title: string; children: React.ReactNode; accent?: string }) {
  const gradients: Record<string, string> = {
    blue: "from-blue-500/5 to-indigo-500/5 border-blue-200/50 dark:border-blue-800/50",
    green: "from-emerald-500/5 to-teal-500/5 border-emerald-200/50 dark:border-emerald-800/50",
    purple: "from-purple-500/5 to-pink-500/5 border-purple-200/50 dark:border-purple-800/50",
    amber: "from-amber-500/5 to-orange-500/5 border-amber-200/50 dark:border-amber-800/50",
    red: "from-red-500/5 to-rose-500/5 border-red-200/50 dark:border-red-800/50",
  };
  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${gradients[accent] || gradients.blue} border backdrop-blur-sm`}>
      <p className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1.5">{icon} {title}</p>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
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

  const intelligenceData = Object.entries(results.intelligence.percentages).map(([key, value]) => ({ name: key, value })).sort((a, b) => b.value - a.value);
  const careerData = Object.entries(results.career.percentages).map(([key, value]) => ({ name: key, value })).sort((a, b) => b.value - a.value);
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

  const allScores = [
    { name: "IQ", val: results.quotients.IQ },
    { name: "EQ", val: results.quotients.EQ },
    { name: "AQ", val: results.quotients.AQ },
    { name: "CQ", val: results.quotients.CQ },
  ];
  const highest = allScores.reduce((a, b) => a.val > b.val ? a : b);
  const lowest = allScores.reduce((a, b) => a.val < b.val ? a : b);

  return (
    <div className="space-y-8">
      {/* ── HEADER ── */}
      <Section delay={0}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-background to-secondary/10 border p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {showBackButton && onBack && (
                <Button variant="outline" size="icon" onClick={onBack} className="rounded-xl"><ArrowLeft className="w-4 h-4" /></Button>
              )}
              <img src={perfyLogo} alt="Perfy" className="h-14 w-14 rounded-xl shadow-lg object-cover ring-2 ring-primary/20" />
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">{targetUser.name}</h2>
                <p className="text-sm text-muted-foreground capitalize flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {targetUser.role}
                  {targetUser.companyName && ` • ${targetUser.companyName}`}
                  {targetUser.department && ` • ${targetUser.department}`}
                  {(targetUser as any).school && ` • ${(targetUser as any).school}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl"><Printer className="w-4 h-4 mr-1.5" /> Print</Button>
              <Button size="sm" onClick={() => generateDeepReport(targetUser, results)} className="rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                <Download className="w-4 h-4 mr-1.5" /> Download PDF
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* ── SECTION 1: PROFILE SUMMARY ── */}
      <Section delay={100}>
        <Card className="overflow-hidden border-0 shadow-xl bg-gradient-to-b from-background to-muted/30">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10"><Star className="w-4 h-4 text-primary" /></div>
              1. Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ScoreGauge label="DISC" value={results.disc.percentages[discKey]} icon={<span className="text-sm">{birdEmoji}</span>} color="bg-blue-100 dark:bg-blue-900/30" subtitle={`${results.disc.bird} Type`} />
              <ScoreGauge label="MBTI" value={Math.max(...Object.values(results.mbti.scores))} icon={<Brain className="w-3.5 h-3.5 text-purple-600" />} color="bg-purple-100 dark:bg-purple-900/30" subtitle={results.mbti.type} />
              <ScoreGauge label={highest.name} value={highest.val} icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-600" />} color="bg-emerald-100 dark:bg-emerald-900/30" subtitle="Strongest" />
              <ScoreGauge label={lowest.name} value={lowest.val} icon={<Target className="w-3.5 h-3.5 text-amber-600" />} color="bg-amber-100 dark:bg-amber-900/30" subtitle="Growth Area" />
            </div>

            {/* Overall Profile Area Chart */}
            <div className="rounded-xl bg-muted/30 border p-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Overall Profile Snapshot</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overallProfile}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }} />
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="url(#areaGrad)" strokeWidth={2.5} dot={{ r: 4, fill: "#3B82F6", stroke: "#fff", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary text */}
            <div className="p-5 rounded-xl bg-gradient-to-r from-primary/5 via-background to-secondary/5 border">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong className="text-foreground">{targetUser.name}</strong> is a <strong className="text-primary">{results.disc.dominant}</strong> ({birdEmoji}) personality with <strong className="text-primary">{results.mbti.type}</strong> ({mbtiInfo?.title || ""}) MBTI type.
                As a <strong>{results.learningStyle.dominant}</strong> learner with strong <strong>{results.intelligence.top2.join(" and ")}</strong> intelligence,
                their career aptitude aligns with <strong>{results.career.top2.join(" and ")}</strong> domains.
                {targetUser.role === "employee" && ` Brain dominance: Left ${results.brainDominance.left}% / Right ${results.brainDominance.right}%.`}
              </p>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ── SECTION 2: PERSONALITY (DISC + MBTI) ── */}
      <Section delay={150}>
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-purple-500/5 to-transparent">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Brain className="w-4 h-4 text-purple-600" /></div>
              2. Personality Interpretation
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">DISC behavioral model + Myers-Briggs Type Indicator</p>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            {/* Bird archetype banner */}
            <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-20">{birdEmoji}</div>
              <p className="text-base font-bold mb-1.5">{birdEmoji} You are a {results.disc.bird}</p>
              <p className="text-sm text-muted-foreground pr-16">{birdExplain[results.disc.bird]}</p>
            </div>

            {/* Charts side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-muted/30 border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">DISC Distribution</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {COLORS.slice(0, 4).map((c, i) => (
                          <linearGradient key={i} id={`pieGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={c} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={c} stopOpacity={0.6} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie data={discData} cx="50%" cy="50%" innerRadius={35} outerRadius={75} dataKey="value" label={({ name, value }) => `${name.split(" ")[0]}: ${value}%`} labelLine={false} strokeWidth={2} stroke="hsl(var(--background))">
                        {discData.map((_, i) => <Cell key={i} fill={`url(#pieGrad${i})`} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))" }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl bg-muted/30 border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">DISC Radar</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={discRadarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                      <Radar dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} dot={{ r: 4, fill: "#8B5CF6", stroke: "#fff", strokeWidth: 2 }} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* DISC dimension cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(["D", "I", "S", "C"] as const).map((k, i) => (
                <div key={k} className={`relative overflow-hidden p-3 rounded-xl transition-all duration-300 ${k === discKey ? "bg-primary/10 border-2 border-primary/30 shadow-lg scale-[1.02]" : "bg-muted/50 border border-border/50 hover:border-primary/20"}`}>
                  {k === discKey && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  <p className="text-2xl font-bold text-foreground text-center">{results.disc.percentages[k]}%</p>
                  <p className="text-xs text-center font-semibold">{["🦅 Eagle", "🦜 Parrot", "🕊️ Dove", "🦉 Owl"][i]}</p>
                  <p className="text-[10px] text-muted-foreground text-center mt-1 leading-tight">{discLetterExplain[k]}</p>
                </div>
              ))}
            </div>

            {/* DISC interpretation */}
            <div className="space-y-3">
              <InfoCard icon="📖" title="What This Means" accent="blue">{discInfo.meaning}</InfoCard>
              <InfoCard icon="🎭" title="Behaviour Traits" accent="purple">
                <ul className="space-y-0.5">{discInfo.traits.map((s, i) => <li key={i}>• {s}</li>)}</ul>
              </InfoCard>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoCard icon="💪" title="Strengths" accent="green">
                  <ul className="space-y-0.5">{discInfo.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                </InfoCard>
                <InfoCard icon="⚠️" title="Risks / Limitations" accent="red">
                  <ul className="space-y-0.5">{discInfo.risks.map((r, i) => <li key={i}>• {r}</li>)}</ul>
                </InfoCard>
              </div>
              <InfoCard icon="🏢" title="Workplace Fit" accent="blue">{discInfo.workFit}</InfoCard>
            </div>

            {/* MBTI */}
            <div className="border-t pt-6">
              <div className="mb-4">
                <h4 className="text-base font-bold mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" /> MBTI — {results.mbti.type} ({mbtiInfo?.title || ""})
                </h4>
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border">
                  <p className="text-xs text-muted-foreground">
                    <strong>MBTI</strong> uses 4 dimensions: <strong>E/I</strong> (energy), <strong>S/N</strong> (information), <strong>T/F</strong> (decisions), <strong>J/P</strong> (lifestyle).
                    Your type <strong className="text-primary">{results.mbti.type}</strong> = {results.mbti.type.split("").map(l => mbtiLetterExplain[l]?.split("—")[1]?.trim()).filter(Boolean).join(", ")}.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {(["E", "I", "S", "N", "T", "F", "J", "P"] as const).map(k => (
                  <div key={k} className={`px-3 py-2.5 rounded-xl transition-all ${results.mbti.type.includes(k) ? "bg-primary/10 border-2 border-primary/20 shadow-sm" : "bg-muted/50 border border-border/50"}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">{k}</span>
                      <span className="text-sm text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{results.mbti.scores[k]}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-1 leading-tight">{mbtiLetterExplain[k]}</p>
                  </div>
                ))}
              </div>

              {mbtiInfo && (
                <div className="space-y-3">
                  <InfoCard icon="📖" title="Core Personality" accent="purple">{mbtiInfo.description}</InfoCard>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <InfoCard icon="💼" title="Work Style" accent="blue">{mbtiInfo.workStyle}</InfoCard>
                    <InfoCard icon="👥" title="Team Strengths" accent="green">{mbtiInfo.teamStrengths}</InfoCard>
                    <InfoCard icon="🎯" title="Leadership" accent="purple">{mbtiInfo.leadership}</InfoCard>
                    <InfoCard icon="💬" title="Communication" accent="blue">{mbtiInfo.communication}</InfoCard>
                  </div>
                  <InfoCard icon="⚠️" title="Weakness Patterns" accent="amber">{mbtiInfo.weaknesses}</InfoCard>
                  <InfoCard icon="🎯" title="Ideal Career Directions" accent="green">
                    <div className="flex flex-wrap gap-1.5 mt-1">{mbtiInfo.careers.map(c => <span key={c} className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">{c}</span>)}</div>
                  </InfoCard>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ── SECTION 3: INTELLIGENCE ── */}
      <Section delay={200}>
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-emerald-500/5 to-transparent">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30"><Lightbulb className="w-4 h-4 text-emerald-600" /></div>
              3. Intelligence Analysis
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">IQ (analytical), EQ (emotional), AQ (resilience), CQ (creativity)</p>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-muted/30 border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Quotient Radar</h4>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={quotientData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fontWeight: 600, fill: "hsl(var(--foreground))" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                      <Radar dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2.5} dot={{ r: 5, fill: "#10B981", stroke: "#fff", strokeWidth: 2 }} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 content-center">
                {quotientData.map((q, i) => (
                  <div key={q.subject} className="relative p-4 rounded-xl bg-gradient-to-br from-muted/50 to-background border hover-scale">
                    <div className={`absolute top-2 right-2 w-8 h-8 rounded-full opacity-10`} style={{ background: COLORS[i] }} />
                    <p className="text-3xl font-bold text-foreground">{q.value}<span className="text-lg text-muted-foreground">%</span></p>
                    <p className="text-xs font-semibold" style={{ color: COLORS[i] }}>{q.subject}</p>
                    <p className="text-[10px] text-muted-foreground">{q.subject === "IQ" ? "Intelligence" : q.subject === "EQ" ? "Emotional" : q.subject === "AQ" ? "Adversity" : "Creative"} Quotient</p>
                  </div>
                ))}
              </div>
            </div>

            {(["IQ", "EQ", "AQ", "CQ"] as const).map((q, i) => {
              const interp = quotientInterpretations[q](results.quotients[q]);
              const icons = ["💡", "❤️", "⚡", "🎨"];
              const _accents = ["blue", "green", "purple", "amber"] as const;
              return (
                <div key={q} className="p-5 rounded-xl border bg-gradient-to-r from-muted/30 to-background">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{icons[i]}</span>
                    <div>
                      <h4 className="text-sm font-bold">{q}: {results.quotients[q]}%</h4>
                      <p className="text-[11px] text-muted-foreground">{q === "IQ" ? "Intelligence Quotient — Analytical Ability" : q === "EQ" ? "Emotional Quotient — Emotional Awareness" : q === "AQ" ? "Adversity Quotient — Resilience" : "Creative Quotient — Innovation"}</p>
                    </div>
                    <div className="ml-auto">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${results.quotients[q]}%`, background: COLORS[i] }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2"><strong>Meaning:</strong> {interp.meaning}</p>
                  <p className="text-xs text-muted-foreground mb-2"><strong>Impact:</strong> {interp.impact}</p>
                  <div className="mt-2 p-3 rounded-lg bg-muted/50">
                    <p className="text-xs font-semibold text-primary mb-1">Improvement Steps:</p>
                    <ul className="text-xs text-muted-foreground space-y-0.5">{interp.improvement.map((s, j) => <li key={j}>• {s}</li>)}</ul>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </Section>

      {/* ── SECTION 4: LEARNING STYLE ── */}
      <Section delay={250}>
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-blue-500/5 to-transparent">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30"><BookOpen className="w-4 h-4 text-blue-600" /></div>
              4. Learning Style Guide — {results.learningStyle.dominant}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-muted/30 border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Style Distribution</h4>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={learningData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} labelLine={false} strokeWidth={2} stroke="hsl(var(--background))">
                        {learningData.map((_, i) => <Cell key={i} fill={COLORS[i + 2]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12 }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-3 flex flex-col justify-center">
                {learningData.map((l, i) => (
                  <div key={l.name} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-24">{l.name}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${l.value}%`, background: COLORS[i + 2] }} />
                    </div>
                    <span className="text-sm font-mono w-12 text-right font-bold">{l.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            {lsInfo && (
              <div className="space-y-3">
                <InfoCard icon="🎓" title={`How ${targetUser.name} Learns Best`} accent="blue">{lsInfo.howLearns}</InfoCard>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <InfoCard icon="✅" title="Best Methods" accent="green">
                    <ul className="space-y-0.5">{lsInfo.bestMethods.map((m, i) => <li key={i}>• {m}</li>)}</ul>
                  </InfoCard>
                  <InfoCard icon="❌" title="Avoid" accent="red">
                    <ul className="space-y-0.5">{lsInfo.avoid.map((m, i) => <li key={i}>• {m}</li>)}</ul>
                  </InfoCard>
                  <InfoCard icon="🔧" title="Techniques" accent="blue">
                    <ul className="space-y-0.5">{lsInfo.techniques.slice(0, 5).map((m, i) => <li key={i}>• {m}</li>)}</ul>
                  </InfoCard>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Section>

      {/* ── SECTION 5: MULTIPLE INTELLIGENCE ── */}
      <Section delay={300}>
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-amber-500/5 to-transparent">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30"><Zap className="w-4 h-4 text-amber-600" /></div>
              5. Multiple Intelligence Analysis
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Top: <strong>{results.intelligence.top2.join(" & ")}</strong></p>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            <div className="rounded-xl bg-muted/30 border p-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={intelligenceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                    <Tooltip contentStyle={{ borderRadius: 12 }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {intelligenceData.map((entry, i) => <Cell key={i} fill={results.intelligence.top2.includes(entry.name) ? COLORS[0] : "#94A3B8"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {results.intelligence.top2.map(intel => {
              const info = intelligenceDescriptions[intel];
              return (
                <div key={intel} className="p-5 rounded-xl border bg-gradient-to-r from-amber-500/5 to-transparent">
                  <h4 className="text-sm font-bold mb-2">🧠 {intel} Intelligence ({results.intelligence.percentages[intel]}%)</h4>
                  <p className="text-xs text-muted-foreground mb-1"><strong>Meaning:</strong> {info.meaning}</p>
                  <p className="text-xs text-muted-foreground mb-1"><strong>Application:</strong> {info.application}</p>
                  <p className="text-xs text-muted-foreground"><strong>Career Relevance:</strong> {info.careerRelevance}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </Section>

      {/* ── SECTION 6: CAREER FIT ── */}
      <Section delay={350}>
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-teal-500/5 to-transparent">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/30"><Target className="w-4 h-4 text-teal-600" /></div>
              6. Career Fit Analysis (RIASEC)
            </CardTitle>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {results.career.suggestedRoles.map(r => (
                <span key={r} className="px-2.5 py-1 bg-teal-500/10 text-teal-700 dark:text-teal-300 rounded-lg text-xs font-medium">{r}</span>
              ))}
            </div>
          </CardHeader>
          <CardContent className="pt-5 space-y-5">
            <div className="rounded-xl bg-muted/30 border p-4">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={careerData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip contentStyle={{ borderRadius: 12 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {careerData.map((entry, i) => <Cell key={i} fill={results.career.top2.includes(entry.name) ? "#14B8A6" : "#94A3B8"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {results.career.top2.map(career => {
              const info = careerTypeDetails[career];
              return (
                <div key={career} className="p-5 rounded-xl border bg-gradient-to-r from-teal-500/5 to-transparent">
                  <h4 className="text-sm font-bold mb-2">🎯 {career} ({results.career.percentages[career]}%)</h4>
                  <p className="text-xs text-muted-foreground mb-2">{info.explanation}</p>
                  <p className="text-xs text-muted-foreground mb-1"><strong>Industries:</strong> {info.industries.join(", ")}</p>
                  <p className="text-xs text-muted-foreground mb-1"><strong>Roles:</strong> {info.roles.join(", ")}</p>
                  <p className="text-xs text-muted-foreground"><strong>Growth:</strong> {info.growthPath}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </Section>

      {/* ── SECTION 7: SWOT ── */}
      <Section delay={400}>
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-indigo-500/5 to-transparent">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30"><Shield className="w-4 h-4 text-indigo-600" /></div>
              7. SWOT Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Strengths", items: results.swot.strengths, accent: "green" as const, icon: "💪", desc: "Core competencies" },
                { title: "Weaknesses", items: results.swot.weaknesses, accent: "red" as const, icon: "⚠️", desc: "Development areas" },
                { title: "Opportunities", items: results.swot.opportunities, accent: "blue" as const, icon: "🚀", desc: "Growth pathways" },
                { title: "Threats", items: results.swot.threats, accent: "amber" as const, icon: "🛡️", desc: "Risks to manage" },
              ].map(s => (
                <InfoCard key={s.title} icon={s.icon} title={`${s.title} — ${s.desc}`} accent={s.accent}>
                  <ul className="space-y-1">{s.items.map((item, i) => <li key={i}>• {item}</li>)}</ul>
                </InfoCard>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ── SECTION 8: COMBINED INSIGHT ── */}
      <Section delay={450}>
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-pink-500/5 to-transparent">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-100 dark:bg-pink-900/30"><Users className="w-4 h-4 text-pink-600" /></div>
              8. Combined Personality Insight
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <InfoCard icon="🧑" title={`Who ${targetUser.name} Is`} accent="purple">{corr.whoTheyAre}</InfoCard>
            <InfoCard icon="🎭" title="How They Behave" accent="blue">{corr.howTheyBehave}</InfoCard>
            <InfoCard icon="🏆" title="Where They Perform Best" accent="green">{corr.whereTheyPerformBest}</InfoCard>
            <div className="p-5 rounded-xl border bg-gradient-to-r from-purple-500/5 to-pink-500/5">
              <p className="text-xs font-semibold text-primary mb-3 flex items-center gap-1.5">🔗 Correlation Insights</p>
              <div className="space-y-3">
                {[
                  { label: `DISC (${discKey}) + MBTI (${results.mbti.type})`, value: discKey === "D" || discKey === "I" ? "Action-oriented with strong external focus" : "Reflective with strong internal processing" },
                  { label: `IQ (${results.quotients.IQ}%) + AQ (${results.quotients.AQ}%)`, value: results.quotients.IQ >= 70 && results.quotients.AQ >= 70 ? "High work capability under pressure" : "Developing — strengthen resilience alongside analytics" },
                  { label: `Learning (${results.learningStyle.dominant}) + Intelligence (${results.intelligence.top2[0]})`, value: `Optimized ${results.learningStyle.dominant.toLowerCase()} processing + ${results.intelligence.top2[0].toLowerCase()} strength` },
                  { label: `EQ (${results.quotients.EQ}%) + CQ (${results.quotients.CQ}%)`, value: results.quotients.EQ >= 70 && results.quotients.CQ >= 70 ? "Strong innovation + communication" : "Growing creative-emotional synergy" },
                ].map((c, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ── SECTION 9: ACTION PLAN ── */}
      <Section delay={500}>
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-green-500/5 to-transparent">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30"><Rocket className="w-4 h-4 text-green-600" /></div>
              9. Action Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoCard icon="📚" title="Skill Development" accent="blue">
                <ul className="space-y-1">{plan.skillDev.map((s, i) => <li key={i}>• {s}</li>)}</ul>
              </InfoCard>
              <InfoCard icon="🌅" title="Daily Improvement" accent="green">
                <ul className="space-y-1">{plan.dailyPlan.map((s, i) => <li key={i}>• {s}</li>)}</ul>
              </InfoCard>
              <InfoCard icon="🧠" title="Behaviour Plan" accent="purple">
                <ul className="space-y-1">{plan.behaviourPlan.map((s, i) => <li key={i}>• {s}</li>)}</ul>
              </InfoCard>
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* ── SECTION 10: CAREER ROADMAP ── */}
      <Section delay={550}>
        <Card className="overflow-hidden border-0 shadow-xl">
          <CardHeader className="pb-3 border-b bg-gradient-to-r from-indigo-500/5 to-transparent">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30"><TrendingUp className="w-4 h-4 text-indigo-600" /></div>
              10. Career Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {/* Visual timeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { phase: "Foundation", period: "0-2 Years", items: roadmap.shortTerm, color: "from-emerald-500/10 to-emerald-500/5 border-emerald-200/50 dark:border-emerald-800/50", icon: "🌱", dotColor: "bg-emerald-500" },
                { phase: "Growth", period: "2-5 Years", items: [`Mid-level ${results.career.suggestedRoles[0]}`, `Cross-functional: ${results.career.top2.join(" + ")}`, `${results.mbti.type} leadership`], color: "from-blue-500/10 to-blue-500/5 border-blue-200/50 dark:border-blue-800/50", icon: "📈", dotColor: "bg-blue-500" },
                { phase: "Leadership", period: "5-10 Years", items: roadmap.longTerm, color: "from-purple-500/10 to-purple-500/5 border-purple-200/50 dark:border-purple-800/50", icon: "👑", dotColor: "bg-purple-500" },
              ].map((p, i) => (
                <div key={i} className={`relative p-5 rounded-xl bg-gradient-to-br ${p.color} border`}>
                  <div className={`absolute top-3 right-3 w-3 h-3 rounded-full ${p.dotColor} opacity-50`} />
                  <span className="text-2xl mb-2 block">{p.icon}</span>
                  <h4 className="text-sm font-bold text-foreground">{p.phase}</h4>
                  <p className="text-[10px] text-muted-foreground mb-3">{p.period}</p>
                  <ul className="text-xs text-muted-foreground space-y-1">{p.items.slice(0, 4).map((s, j) => <li key={j}>• {s}</li>)}</ul>
                </div>
              ))}
            </div>
            <InfoCard icon="🏭" title="Industry Path" accent="blue">{roadmap.industryPath}</InfoCard>
          </CardContent>
        </Card>
      </Section>

      {/* Brain Dominance (Employee) */}
      {targetUser.role === "employee" && (
        <Section delay={600}>
          <Card className="overflow-hidden border-0 shadow-xl">
            <CardHeader className="pb-3 border-b bg-gradient-to-r from-cyan-500/5 to-transparent">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-100 dark:bg-cyan-900/30"><Brain className="w-4 h-4 text-cyan-600" /></div>
                Brain Dominance
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="flex items-center gap-6 mb-4">
                <div className="flex-1 text-center">
                  <div className="text-4xl font-bold text-primary">{results.brainDominance.left}%</div>
                  <p className="text-xs text-muted-foreground mt-1">🔬 Left Brain (Logical)</p>
                </div>
                <div className="w-px h-16 bg-border" />
                <div className="flex-1 text-center">
                  <div className="text-4xl font-bold text-secondary">{results.brainDominance.right}%</div>
                  <p className="text-xs text-muted-foreground mt-1">🎨 Right Brain (Creative)</p>
                </div>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-l-full transition-all duration-1000" style={{ width: `${results.brainDominance.left}%` }} />
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-r-full transition-all duration-1000" style={{ width: `${results.brainDominance.right}%` }} />
              </div>
            </CardContent>
          </Card>
        </Section>
      )}

      {/* Download footer */}
      <Section delay={650}>
        <div className="flex flex-col items-center gap-4 py-10 border-t">
          <img src={perfyLogo} alt="Perfy" className="h-12 rounded-xl shadow-md ring-2 ring-primary/10" />
          <p className="text-sm text-muted-foreground font-medium">Perfy — From Effort to Impact</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrint} className="rounded-xl"><Printer className="w-4 h-4 mr-2" /> Print Report</Button>
            <Button onClick={() => generateDeepReport(targetUser, results)} className="rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <Download className="w-4 h-4 mr-2" /> Download Full Report (PDF)
            </Button>
          </div>
        </div>
      </Section>
    </div>
  );
}
