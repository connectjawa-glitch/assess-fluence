import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { allQuestions, sections } from "@/data/questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Responses } from "@/lib/scoring";
import { ChevronLeft, ChevronRight, CheckCircle, Save, Sparkles } from "lucide-react";
import { BrainLogo, SECTION_LOBE_COLORS } from "@/components/BrainLogo";
import MusicControls from "@/components/MusicControls";
import { useMusic } from "@/lib/music";
import { toast } from "@/hooks/use-toast";

const scaleLabels = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];

interface SectionTheme {
  emoji: string;
  archetype: string;          // "INTJ — Elon Musk"
  hookLine: string;           // "Are you the next…"
  tagline: string;            // short subtitle
  bgGradient: string;         // tailwind classes for outer surface
  cardGradient: string;       // tailwind classes for inner card
  encouragement: string[];
}

const sectionThemes: Record<string, SectionTheme> = {
  A: {
    emoji: "🦅",
    archetype: "Bold Ruler — Alexander the Great",
    hookLine: "Are you the next Alexander?",
    tagline: "DISC behavioral profile — how you take charge.",
    bgGradient: "from-violet-500/15 via-background to-indigo-500/10",
    cardGradient: "from-violet-500/10 to-fuchsia-500/5",
    encouragement: ["Trust your instincts.", "There are no wrong answers.", "Reveal the leader within."],
  },
  B: {
    emoji: "🧠",
    archetype: "Visionary Strategist — INTJ, like Elon Musk",
    hookLine: "Are you an INTJ like Elon Musk?",
    tagline: "MBTI mirror — your cognitive operating system.",
    bgGradient: "from-cyan-500/15 via-background to-blue-500/10",
    cardGradient: "from-cyan-500/10 to-sky-500/5",
    encouragement: ["Your mind is unique.", "Pick what *feels* like you.", "Future possibilities are forming."],
  },
  C: {
    emoji: "💡",
    archetype: "Polymath Genius — Da Vinci",
    hookLine: "Could you be the next Da Vinci?",
    tagline: "Eight intelligences — which ones light up in you?",
    bgGradient: "from-fuchsia-500/15 via-background to-purple-500/10",
    cardGradient: "from-fuchsia-500/10 to-purple-500/5",
    encouragement: ["Genius takes many forms.", "You're more intelligent than you think.", "Hidden strengths surfacing…"],
  },
  D: {
    emoji: "📚",
    archetype: "Eternal Learner — Einstein",
    hookLine: "Do you learn like Einstein?",
    tagline: "How does your brain absorb the world?",
    bgGradient: "from-emerald-500/15 via-background to-teal-500/10",
    cardGradient: "from-emerald-500/10 to-teal-500/5",
    encouragement: ["Visual, auditory, kinesthetic — all powerful.", "Halfway there!", "Knowing how you learn changes everything."],
  },
  E: {
    emoji: "⚡",
    archetype: "Balanced Force — IQ × EQ × AQ × CQ",
    hookLine: "How balanced are your four quotients?",
    tagline: "IQ • EQ • AQ • CQ — the four engines of success.",
    bgGradient: "from-amber-500/15 via-background to-orange-500/10",
    cardGradient: "from-amber-500/10 to-yellow-500/5",
    encouragement: ["You're doing brilliantly.", "Adversity sharpens the strongest minds.", "The balance is forming."],
  },
  F: {
    emoji: "🎯",
    archetype: "Career Compass — RIASEC",
    hookLine: "What's your destined career arc?",
    tagline: "Your career destiny — RIASEC compass calibration.",
    bgGradient: "from-rose-500/15 via-background to-pink-500/10",
    cardGradient: "from-rose-500/10 to-pink-500/5",
    encouragement: ["Last leg — finish strong!", "Your path is forming.", "One section away from your full report."],
  },
};

export default function AssessmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { start: startMusic, stop: stopMusic, muted, setMuted } = useMusic();
  const [sectionIdx, setSectionIdx] = useState(0);
  const [responses, setResponses] = useState<Responses>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Group questions by section
  const sectionGroups = useMemo(() => {
    return sections.map(s => ({
      meta: s,
      questions: allQuestions.filter(q => q.section === s.id),
    }));
  }, []);

  const current = sectionGroups[sectionIdx];

  // Per-section completion (0..1)
  const fills = useMemo(() => {
    const out: Record<string, number> = {};
    sectionGroups.forEach(g => {
      const total = g.questions.length;
      const answered = g.questions.filter(q => responses[q.id]).length;
      out[g.meta.id] = total ? answered / total : 0;
    });
    return out;
  }, [responses, sectionGroups]);

  // Load saved
  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const saved = localStorage.getItem(`mm_responses_${user.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setResponses(parsed);
      const firstUnfinished = sectionGroups.findIndex(g => g.questions.some(q => !parsed[q.id]));
      if (firstUnfinished >= 0) setSectionIdx(firstUnfinished);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // Try music as soon as the page mounts. The MusicProvider falls back to a
  // muted "primed" play if autoplay is blocked and unmutes on the first
  // pointer/key event automatically.
  useEffect(() => {
    startMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stop music when leaving page
  useEffect(() => () => stopMusic(), [stopMusic]);

  // Periodic celebrity-comparison popups — fire every 5 answers, but throttle
  // and pick a non-repeating message so it feels alive but not spammy.
  const lastCheerRef = useRef<number>(0);
  const cheerIdxRef = useRef<number>(0);
  const cheers = [
    { emoji: "🚀", title: "You're on fire!", desc: "That focus is Elon-Musk level." },
    { emoji: "👑", title: "Going great!", desc: "Channeling some Alexander-the-Great energy." },
    { emoji: "🎯", title: "Beautifully done", desc: "Steady like Warren Buffett." },
    { emoji: "💡", title: "Bright thinking", desc: "Curiosity worthy of Einstein." },
    { emoji: "🎨", title: "Lovely answers", desc: "A little Da Vinci in you." },
    { emoji: "✨", title: "You're in the zone", desc: "Oprah-style emotional clarity." },
    { emoji: "🦅", title: "Strong choices", desc: "Eagle-eyed and decisive." },
    { emoji: "🌟", title: "Stellar pace", desc: "Steve Jobs would approve." },
  ];

  const handleAnswer = (qid: number, value: string) => {
    if (!user) return;
    const updated = { ...responses, [qid]: parseInt(value) };
    setResponses(updated);
    localStorage.setItem(`mm_responses_${user.id}`, JSON.stringify(updated));

    // Encouragement popup roughly every 3 newly-answered questions, throttled to 6s.
    const answeredCount = Object.keys(updated).length;
    const now = Date.now();
    if (answeredCount > 0 && answeredCount % 3 === 0 && now - lastCheerRef.current > 6000) {
      const cheer = cheers[cheerIdxRef.current % cheers.length];
      cheerIdxRef.current += 1;
      lastCheerRef.current = now;
      toast({ title: `${cheer.emoji} ${cheer.title}`, description: cheer.desc });
    }
  };

  const sectionAnswered = current.questions.every(q => responses[q.id]);
  const allAnswered = sectionGroups.every(g => g.questions.every(q => responses[q.id]));
  const isLast = sectionIdx === sectionGroups.length - 1;

  const handleNext = () => {
    if (!sectionAnswered) {
      toast({ title: "A few more answers needed", description: "Please answer everything in this section before continuing." });
      return;
    }
    const theme = sectionThemes[current.meta.id];
    toast({
      title: `${theme.emoji} ${current.meta.name} complete!`,
      description: theme.encouragement[Math.floor(Math.random() * theme.encouragement.length)],
    });
    if (sectionIdx < sectionGroups.length - 1) {
      setSectionIdx(s => s + 1);
      containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (sectionIdx > 0) {
      setSectionIdx(s => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleComplete = () => {
    if (!user || !allAnswered) return;
    localStorage.setItem(`mm_completed_${user.id}`, "true");
    toast({ title: "✨ Assessment complete!", description: "Generating your personality insights..." });
    stopMusic();
    navigate("/results");
  };

  if (!user) return null;

  const theme = sectionThemes[current.meta.id];
  const lobeColor = SECTION_LOBE_COLORS[current.meta.id];

  return (
    <div
      className={`relative min-h-screen bg-gradient-to-br ${theme.bgGradient} transition-colors duration-1000 overflow-hidden`}
      ref={containerRef}
    >
      {/* Per-section animated background — three slow drifting orbs in the
          section's color, plus a faint grid mesh. Re-mounts on section change
          so the colors crossfade. */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden" key={`bg-${current.meta.id}`}>
        {/* Primary blob — always visible */}
        <div
          className="absolute -top-40 -left-40 w-[28rem] h-[28rem] sm:w-[36rem] sm:h-[36rem] rounded-full blur-3xl opacity-40 animate-blob-a"
          style={{ background: `radial-gradient(circle at 30% 30%, ${lobeColor}99, transparent 65%)` }}
        />
        {/* Secondary + tertiary blobs — desktop only, they're the heaviest paint */}
        <div
          className="hidden md:block absolute -bottom-40 -right-32 w-[40rem] h-[40rem] rounded-full blur-3xl opacity-35 animate-blob-b"
          style={{ background: `radial-gradient(circle at 70% 70%, ${lobeColor}88, transparent 65%)` }}
        />
        <div
          className="hidden md:block absolute top-1/3 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-25 animate-blob-c"
          style={{ background: `radial-gradient(circle, ${lobeColor}77, transparent 70%)` }}
        />
        {/* Faint mesh grid — desktop only */}
        <div
          className="hidden md:block absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-20 sticky top-0 bg-card/80 backdrop-blur-xl border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BrainLogo size={36} fills={fills} activeSection={current.meta.id} />
            <div className="min-w-0">
              <p className="text-sm font-display font-bold leading-tight truncate">Personality &amp; Intelligence Assessment</p>
              <p className="text-[11px] text-muted-foreground leading-tight truncate">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {muted && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => { setMuted(false); startMusic(); }}
              >
                🔊 Tap for music
              </Button>
            )}
            <MusicControls />
            <Button variant="outline" size="sm" onClick={() => { stopMusic(); navigate("/dashboard"); }}>
              <Save className="w-3.5 h-3.5 mr-1" /> Save &amp; Exit
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[300px_1fr] gap-6">
        {/* LEFT — Brain visual */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="shadow-elevated border-0 overflow-hidden">
            <CardContent
              className={`p-5 flex flex-col items-center text-center bg-gradient-to-b ${theme.cardGradient}`}
            >
              <BrainLogo size={220} fills={fills} animated activeSection={current.meta.id} />
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-4">
                Now mapping
              </p>
              <p className="text-base font-display font-bold mt-1" style={{ color: lobeColor }}>
                {current.meta.name}
              </p>
              <div className="mt-5 w-full space-y-1.5 text-left">
                {sectionGroups.map((g, idx) => {
                  const pct = Math.round(fills[g.meta.id] * 100);
                  const isCurrent = idx === sectionIdx;
                  const isDone = pct === 100;
                  const dotColor = SECTION_LOBE_COLORS[g.meta.id];
                  return (
                    <button
                      key={g.meta.id}
                      onClick={() => setSectionIdx(idx)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${
                        isCurrent
                          ? "bg-primary/10 text-foreground font-semibold shadow-sm"
                          : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 ring-offset-background ${
                          isCurrent ? "animate-pulse" : ""
                        }`}
                        style={{
                          background: dotColor,
                          // @ts-expect-error — CSS var typing
                          "--tw-ring-color": isDone ? dotColor : "transparent",
                        }}
                      />
                      <span className="flex-1 truncate">{g.meta.name}</span>
                      {isDone && <CheckCircle className="w-3.5 h-3.5" style={{ color: dotColor }} />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* RIGHT — Section questions */}
        <main className="space-y-5 animate-fade-in" key={sectionIdx}>
          {/* Themed section banner — personality icon + "Are you the next..." hook */}
          <div
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${theme.cardGradient} p-6`}
          >
            <div
              className="absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-40"
              style={{ background: lobeColor }}
              aria-hidden
            />
            <div className="relative flex items-start gap-4">
              <div
                className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                style={{ background: lobeColor + "22", border: `1px solid ${lobeColor}55` }}
              >
                {theme.emoji}
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-background/70 backdrop-blur text-[11px] font-semibold mb-2"
                  style={{ color: lobeColor }}>
                  <Sparkles className="w-3 h-3" /> {theme.archetype}
                </div>
                <h1
                  className="text-2xl md:text-3xl font-display font-bold leading-tight"
                  style={{ color: lobeColor }}
                >
                  {theme.hookLine}
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  <span className="font-semibold text-foreground">{current.meta.name}.</span>{" "}
                  {theme.tagline}
                </p>
              </div>
            </div>
          </div>

          <Card className="shadow-elevated border-0">
            <CardContent className="p-5 md:p-6 space-y-6">
              {current.questions.map((q, qIdx) => (
                <div key={q.id} className="animate-fade-in" style={{ animationDelay: `${qIdx * 25}ms` }}>
                  <div className="flex items-start gap-3 mb-3">
                    {/* Themed bullet (NOT a question number) */}
                    <span
                      className="mt-2 inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ background: lobeColor }}
                      aria-hidden
                    />
                    <p className="font-display text-base md:text-lg leading-relaxed flex-1">{q.text}</p>
                    {responses[q.id] && (
                      <CheckCircle className="w-4 h-4 mt-2 shrink-0" style={{ color: lobeColor }} />
                    )}
                  </div>
                  <RadioGroup
                    value={responses[q.id]?.toString() || ""}
                    onValueChange={(v) => handleAnswer(q.id, v)}
                    className="grid grid-cols-1 sm:grid-cols-5 gap-2"
                  >
                    {scaleLabels.map((label, i) => {
                      const selected = responses[q.id] === i + 1;
                      return (
                        <Label
                          key={i}
                          htmlFor={`q${q.id}-${i + 1}`}
                          className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg border-2 cursor-pointer transition-all text-center ${
                            selected
                              ? "shadow-md scale-[1.02]"
                              : "border-border bg-muted/30 hover:border-foreground/20"
                          }`}
                          style={
                            selected
                              ? {
                                  borderColor: lobeColor,
                                  background: lobeColor + "12",
                                }
                              : undefined
                          }
                        >
                          <RadioGroupItem value={(i + 1).toString()} id={`q${q.id}-${i + 1}`} className="sr-only" />
                          <span
                            className="text-[11px] leading-tight font-medium"
                            style={selected ? { color: lobeColor } : undefined}
                          >
                            {label}
                          </span>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                  {qIdx < current.questions.length - 1 && (
                    <div className="border-b border-border/50 mt-5" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Section navigation */}
          <div className="flex items-center justify-between gap-3">
            <Button variant="outline" onClick={handlePrev} disabled={sectionIdx === 0} className="gap-1">
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>
            {!isLast ? (
              <Button
                onClick={handleNext}
                className="text-white gap-1 hover:scale-105 transition-transform shadow-lg"
                style={{ background: `linear-gradient(135deg, ${lobeColor}, hsl(var(--primary)))` }}
              >
                Next Section <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!allAnswered}
                className="gradient-accent text-accent-foreground gap-1 hover:scale-105 transition-transform"
              >
                <CheckCircle className="w-4 h-4" /> Reveal My Insights
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
