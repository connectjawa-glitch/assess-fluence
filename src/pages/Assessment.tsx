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
import { BrainLogo } from "@/components/BrainLogo";
import MusicControls from "@/components/MusicControls";
import { useMusic } from "@/lib/music";
import { toast } from "@/hooks/use-toast";

const scaleLabels = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];

const sectionVibes: Record<string, { tagline: string; encouragement: string[] }> = {
  A: {
    tagline: "How do you take charge? Let's reveal your DISC archetype.",
    encouragement: ["Trust your instincts.", "There are no wrong answers — only honest ones.", "Reveal the leader within."],
  },
  B: {
    tagline: "Cognitive style — the MBTI mirror is held up to you.",
    encouragement: ["Are you the next INTJ like Elon?", "Your mind is unique. Show us how it works.", "Pick the answer that *feels* most like you."],
  },
  C: {
    tagline: "Eight intelligences. Which ones light up in you?",
    encouragement: ["Genius takes many forms.", "You're more intelligent than you think.", "Discover your hidden strengths."],
  },
  D: {
    tagline: "How does your brain absorb the world?",
    encouragement: ["Visual, auditory, kinesthetic — all are powerful.", "Almost halfway. Keep going!", "Knowing how you learn changes everything."],
  },
  E: {
    tagline: "IQ • EQ • AQ • CQ — the four quotients of success.",
    encouragement: ["You're doing brilliantly.", "Reveal the balance behind your potential.", "Adversity sharpens the strongest minds."],
  },
  F: {
    tagline: "Your career destiny — RIASEC compass calibration.",
    encouragement: ["Last leg — finish strong!", "Your perfect career path is forming.", "One section away from your full report."],
  },
};

export default function AssessmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { start: startMusic, stop: stopMusic } = useMusic();
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
      // jump to first section with unanswered
      const firstUnfinished = sectionGroups.findIndex(g => g.questions.some(q => !parsed[q.id]));
      if (firstUnfinished >= 0) setSectionIdx(firstUnfinished);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  // Music auto-start (after user gesture - we trigger on first answer click)
  const [musicStarted, setMusicStarted] = useState(false);
  const ensureMusic = () => {
    if (musicStarted) return;
    startMusic();
    setMusicStarted(true);
  };

  // Stop music when leaving page
  useEffect(() => () => stopMusic(), [stopMusic]);

  const handleAnswer = (qid: number, value: string) => {
    if (!user) return;
    ensureMusic();
    const updated = { ...responses, [qid]: parseInt(value) };
    setResponses(updated);
    localStorage.setItem(`mm_responses_${user.id}`, JSON.stringify(updated));
  };

  const sectionAnswered = current.questions.every(q => responses[q.id]);
  const allAnswered = sectionGroups.every(g => g.questions.every(q => responses[q.id]));
  const isLast = sectionIdx === sectionGroups.length - 1;

  const handleNext = () => {
    if (!sectionAnswered) {
      toast({ title: "A few more answers needed", description: "Please answer all questions in this section before continuing." });
      return;
    }
    // Encouragement
    const vibe = sectionVibes[current.meta.id];
    toast({
      title: `🧠 ${current.meta.name} complete!`,
      description: vibe.encouragement[Math.floor(Math.random() * vibe.encouragement.length)],
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

  const vibe = sectionVibes[current.meta.id];

  return (
    <div className="min-h-screen bg-background" ref={containerRef}>
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-card/90 backdrop-blur-md border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BrainLogo size={36} />
            <div className="min-w-0">
              <p className="text-sm font-display font-bold leading-tight truncate">Personality &amp; Intelligence Assessment</p>
              <p className="text-[11px] text-muted-foreground leading-tight truncate">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MusicControls />
            <Button variant="outline" size="sm" onClick={() => { stopMusic(); navigate("/dashboard"); }}>
              <Save className="w-3.5 h-3.5 mr-1" /> Save &amp; Exit
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[280px_1fr] gap-6">
        {/* LEFT — Brain visual */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="shadow-elevated border-0 overflow-hidden">
            <CardContent className="p-5 flex flex-col items-center text-center bg-gradient-to-b from-primary/5 to-background">
              <BrainLogo size={200} fills={fills} animated />
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-4">Your brain map</p>
              <p className="text-sm font-display font-semibold mt-1">Each section lights up a lobe</p>
              <div className="mt-4 w-full space-y-1.5 text-left">
                {sectionGroups.map((g, idx) => {
                  const pct = Math.round(fills[g.meta.id] * 100);
                  const isCurrent = idx === sectionIdx;
                  const isDone = pct === 100;
                  return (
                    <button
                      key={g.meta.id}
                      onClick={() => setSectionIdx(idx)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        isCurrent ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isDone ? "bg-emerald-500" : isCurrent ? "bg-primary animate-pulse" : "bg-muted-foreground/30"}`} />
                      <span className="flex-1 truncate">{g.meta.name}</span>
                      {isDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* RIGHT — Section questions */}
        <main className="space-y-5 animate-fade-in" key={sectionIdx}>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Section {current.meta.id}
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">{current.meta.name}</h1>
            <p className="text-muted-foreground mt-1">{vibe.tagline}</p>
          </div>

          <Card className="shadow-elevated border-0">
            <CardContent className="p-5 md:p-6 space-y-6">
              {current.questions.map((q, qIdx) => (
                <div key={q.id} className="animate-fade-in" style={{ animationDelay: `${qIdx * 30}ms` }}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="mt-1 inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {qIdx + 1}
                    </span>
                    <p className="font-display text-base md:text-lg leading-relaxed flex-1">{q.text}</p>
                    {responses[q.id] && <CheckCircle className="w-4 h-4 text-emerald-500 mt-2 shrink-0" />}
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
                          className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-lg border-2 cursor-pointer transition-all text-center hover:border-primary/40 ${
                            selected
                              ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          <RadioGroupItem value={(i + 1).toString()} id={`q${q.id}-${i + 1}`} className="sr-only" />
                          <span className={`text-xs font-bold ${selected ? "text-primary" : "text-muted-foreground"}`}>
                            {i + 1}
                          </span>
                          <span className="text-[11px] leading-tight">{label}</span>
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
              <ChevronLeft className="w-4 h-4" /> Previous Section
            </Button>
            {!isLast ? (
              <Button onClick={handleNext} className="gradient-primary text-primary-foreground gap-1 hover:scale-105 transition-transform">
                Next Section <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={!allAnswered}
                className="gradient-accent text-accent-foreground gap-1 hover:scale-105 transition-transform"
              >
                <CheckCircle className="w-4 h-4" /> Complete Assessment
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
