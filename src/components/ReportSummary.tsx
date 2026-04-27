import { useState } from "react";
import { type User, useAuth } from "@/lib/auth";
import { calculateAllResults, type Responses } from "@/lib/scoring";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from "recharts";
import { generateDeepReport } from "@/lib/pdfReport";
import { Download, Lock, Brain, Sparkles, Lightbulb, Target, Compass } from "lucide-react";
import { mbtiInterpretations } from "@/lib/interpretations";
import { BrainLogo, SECTION_LOBE_COLORS } from "@/components/BrainLogo";
import PaymentDialog from "@/components/PaymentDialog";

const birdIcons: Record<string, string> = { Eagle: "🦅", Parrot: "🦜", Dove: "🕊️", Owl: "🦉" };

const archetypeLines: Record<string, string> = {
  // MBTI -> famous person
  INTJ: "An INTJ — the strategic mind of an Elon Musk.",
  INTP: "An INTP — the curious analyst, like Einstein.",
  ENTJ: "An ENTJ — the natural commander, like Steve Jobs.",
  ENTP: "An ENTP — the visionary debater, like Mark Twain.",
  INFJ: "An INFJ — the quiet idealist, like Martin Luther King Jr.",
  INFP: "An INFP — the dreamer-poet, like J.R.R. Tolkien.",
  ENFJ: "An ENFJ — the inspirer, like Oprah Winfrey.",
  ENFP: "An ENFP — the spark, like Robin Williams.",
  ISTJ: "An ISTJ — the dependable architect, like Warren Buffett.",
  ISFJ: "An ISFJ — the quiet protector, like Mother Teresa.",
  ESTJ: "An ESTJ — the executor, like Michelle Obama.",
  ESFJ: "An ESFJ — the host of the room, like Taylor Swift.",
  ISTP: "An ISTP — the calm builder, like Clint Eastwood.",
  ISFP: "An ISFP — the artist's soul, like Frida Kahlo.",
  ESTP: "An ESTP — the bold doer, like Madonna.",
  ESFP: "An ESFP — the entertainer, like Jamie Foxx.",
};

interface Props {
  targetUser: User;
}

export default function ReportSummary({ targetUser }: Props) {
  const { user: viewer } = useAuth();
  const responses: Responses = JSON.parse(localStorage.getItem(`mm_responses_${targetUser.id}`) || "{}");
  const results = calculateAllResults(responses, targetUser.role === "employee");

  const isAdmin = viewer?.role === "admin";
  const [unlocked, setUnlocked] = useState<boolean>(() =>
    typeof window !== "undefined" && localStorage.getItem(`pia_unlocked_${targetUser.id}`) === "1"
  );
  const [payOpen, setPayOpen] = useState(false);
  const canDownload = isAdmin || unlocked;

  const handleUnlock = () => {
    setUnlocked(true);
    localStorage.setItem(`pia_unlocked_${targetUser.id}`, "1");
    // Trigger immediately so the PDF downloads in the same user gesture chain.
    generateDeepReport(targetUser, results);
  };
  const handleDownloadClick = () => {
    if (canDownload) generateDeepReport(targetUser, results);
    else setPayOpen(true);
  };

  // Brain dominance: real value from scoring (works for all roles now)
  const left = results.brainDominance.left;
  const right = results.brainDominance.right;

  // Section fills for the brain visual = 100% per completed section
  const fills: Record<string, number> = { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1 };

  const birdEmoji = birdIcons[results.disc.bird] || "🦅";
  const mbtiInfo = mbtiInterpretations[results.mbti.type];
  const archetype = archetypeLines[results.mbti.type] ?? `${results.mbti.type} — ${mbtiInfo?.title ?? "a unique mind"}.`;

  // Compact radar — quotients
  const quotientData = [
    { subject: "IQ", value: results.quotients.IQ },
    { subject: "EQ", value: results.quotients.EQ },
    { subject: "AQ", value: results.quotients.AQ },
    { subject: "CQ", value: results.quotients.CQ },
  ];

  return (
    <div className="space-y-6">
      {/* HERO */}
      <Card className="overflow-hidden border-0 shadow-elevated">
        <CardContent className="p-0">
          <div className="relative bg-gradient-to-br from-primary/15 via-background to-secondary/15 p-6 md:p-8">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-primary/10 blur-3xl" aria-hidden />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-secondary/10 blur-3xl" aria-hidden />
            <div className="relative grid md:grid-cols-[220px_1fr] gap-6 items-center">
              <div className="flex items-center justify-center">
                <BrainLogo size={200} fills={fills} animated />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Your snapshot, {targetUser.name.split(" ")[0]}
                </p>
                <h1 className="text-2xl md:text-3xl font-display font-bold leading-tight">
                  {archetype}
                </h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  You're a <strong className="text-foreground">{results.disc.bird} {birdEmoji}</strong> with strong{" "}
                  <strong className="text-foreground">{results.intelligence.top2[0]}</strong> intelligence and a leaning toward{" "}
                  <strong className="text-foreground">{results.career.top2[0]}</strong> careers. The full analysis — 20+ pages,
                  charts, action plan and roadmap — is in your detailed report.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="lg"
                    onClick={handleDownloadClick}
                    className="rounded-xl gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
                  >
                    {canDownload ? <Download className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                    {canDownload ? "Download Detailed Report (PDF)" : "Unlock Detailed Report"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KEY HIGHLIGHTS — 4 small cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Highlight
          icon={<span className="text-xl">{birdEmoji}</span>}
          label="DISC Type"
          value={results.disc.bird}
          accent={SECTION_LOBE_COLORS.A}
          sub={results.disc.dominant}
        />
        <Highlight
          icon={<Brain className="w-4 h-4" />}
          label="MBTI"
          value={results.mbti.type}
          accent={SECTION_LOBE_COLORS.B}
          sub={mbtiInfo?.title ?? ""}
        />
        <Highlight
          icon={<Lightbulb className="w-4 h-4" />}
          label="Top Intelligence"
          value={results.intelligence.top2[0]}
          accent={SECTION_LOBE_COLORS.C}
          sub={`+ ${results.intelligence.top2[1]}`}
        />
        <Highlight
          icon={<Target className="w-4 h-4" />}
          label="Best Career Fit"
          value={results.career.top2[0]}
          accent={SECTION_LOBE_COLORS.F}
          sub={`+ ${results.career.top2[1]}`}
        />
      </div>

      {/* QUOTIENTS RADAR + LEFT/RIGHT BRAIN */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-elevated">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-display font-bold text-sm">Quotient Snapshot</h3>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={quotientData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                  <Radar
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.25}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-1">
              Detailed interpretation of each quotient is in the full PDF.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-elevated">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-primary" />
              <h3 className="font-display font-bold text-sm">Left vs Right Brain</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{left}%</div>
                <p className="text-[11px] text-muted-foreground">🔬 Left — Logical</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">{right}%</div>
                <p className="text-[11px] text-muted-foreground">🎨 Right — Creative</p>
              </div>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                style={{ width: `${left}%` }}
              />
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                style={{ width: `${right}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
              {left > right
                ? "You lean toward analytical, structured thinking. The PDF breaks down where this strength shines and where to balance it."
                : left < right
                  ? "You lean toward creative, intuitive thinking. The PDF shows the careers and habits that channel this best."
                  : "Beautifully balanced — your detailed report explains how to leverage both hemispheres."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PAYWALL TEASER */}
      <Card className="border-0 shadow-elevated overflow-hidden">
        <CardContent className="p-6 bg-gradient-to-r from-primary/10 via-background to-secondary/10">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-2">
                <Lock className="w-3 h-3" /> What's inside the detailed report
              </div>
              <h3 className="text-lg font-display font-bold mb-1">
                20+ pages of deep analysis, charts, action plan and career roadmap.
              </h3>
              <ul className="text-xs text-muted-foreground grid sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                <li>• Full DISC + MBTI interpretation</li>
                <li>• 8 Multiple-Intelligence breakdown</li>
                <li>• IQ • EQ • AQ • CQ deep dive</li>
                <li>• Learning style guide</li>
                <li>• SWOT analysis</li>
                <li>• 0-2 / 2-5 / 5-10 year career roadmap</li>
                <li>• Personalised action plan</li>
                <li>• Left/Right brain dominance + recommendations</li>
              </ul>
            </div>
            <Button
              size="lg"
              onClick={handleDownloadClick}
              className="rounded-xl gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow shrink-0"
            >
              {canDownload ? <Download className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              {canDownload ? "Download PDF" : "Unlock for ₹1300"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <PaymentDialog open={payOpen} onOpenChange={setPayOpen} onUnlock={handleUnlock} />
    </div>
  );
}

function Highlight({
  icon, label, value, sub, accent,
}: { icon: React.ReactNode; label: string; value: string; sub?: string; accent: string }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl p-3.5 border bg-card hover-scale"
      style={{ borderColor: accent + "33" }}
    >
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-30"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: accent }}>
          {icon} {label}
        </div>
        <p className="text-xl font-display font-bold mt-1 leading-tight">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
      </div>
    </div>
  );
}
