import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { allQuestions, sections } from "@/data/questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Responses } from "@/lib/scoring";
import { Clock, ChevronLeft, ChevronRight, CheckCircle, Circle, Save, LogOut } from "lucide-react";

const scaleLabels = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function AssessmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Responses>({});
  const [elapsed, setElapsed] = useState(0);
  const [showQuestionMap, setShowQuestionMap] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const saved = localStorage.getItem(`mm_responses_${user.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setResponses(parsed);
      const first = allQuestions.findIndex(q => !parsed[q.id]);
      if (first >= 0) setCurrentQ(first);
    }
    const savedTime = localStorage.getItem(`mm_timer_${user.id}`);
    if (savedTime) setElapsed(parseInt(savedTime));
  }, [user, navigate]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (user) localStorage.setItem(`mm_timer_${user.id}`, next.toString());
        return next;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [user]);

  const handleAnswer = useCallback((value: string) => {
    if (!user) return;
    const question = allQuestions[currentQ];
    const updated = { ...responses, [question.id]: parseInt(value) };
    setResponses(updated);
    localStorage.setItem(`mm_responses_${user.id}`, JSON.stringify(updated));
  }, [currentQ, responses, user]);

  const handleNext = () => { if (currentQ < 198) setCurrentQ(currentQ + 1); };
  const handlePrev = () => { if (currentQ > 0) setCurrentQ(currentQ - 1); };

  const handleComplete = () => {
    if (!user) return;
    localStorage.setItem(`mm_completed_${user.id}`, "true");
    navigate("/results");
  };

  if (!user) return null;

  const question = allQuestions[currentQ];
  const answered = Object.keys(responses).length;
  const progress = (answered / 199) * 100;
  const currentSection = sections.find(s => s.category === question.category);
  const allAnswered = allQuestions.every(q => responses[q.id]);
  const unansweredList = allQuestions.filter(q => !responses[q.id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-card border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-display font-bold text-foreground hidden sm:block">Assessment</h1>
            <span className="text-xs text-muted-foreground">{user.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-sm font-mono">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {formatTime(elapsed)}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              <Save className="w-3.5 h-3.5 mr-1" /> Save & Exit
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Question {currentQ + 1} of 199</span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {answered}/199 answered
            </span>
          </div>
          <Progress value={progress} className="h-2.5" />
        </div>

        {/* Section pills */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-2 scrollbar-thin">
          {sections.map(s => {
            const sectionStart = allQuestions.findIndex(q => q.section === s.id);
            const sectionQs = allQuestions.filter(q => q.section === s.id);
            const sectionAnswered = sectionQs.filter(q => responses[q.id]).length;
            const isActive = currentSection?.id === s.id;
            const isComplete = sectionAnswered === sectionQs.length;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentQ(sectionStart)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "gradient-primary text-primary-foreground shadow-md"
                    : isComplete
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {isComplete && <CheckCircle className="w-3 h-3" />}
                {s.id}: {s.name}
                <span className="text-[10px] opacity-70">({sectionAnswered}/{sectionQs.length})</span>
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        <Card className="shadow-elevated animate-fade-in mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary">{question.category}</span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-secondary/10 text-secondary">{question.subcategory}</span>
              {responses[question.id] && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
            <CardTitle className="text-lg font-display leading-relaxed">Q{question.id}. {question.text}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={responses[question.id]?.toString() || ""}
              onValueChange={handleAnswer}
              className="space-y-2"
            >
              {scaleLabels.map((label, i) => (
                <div
                  key={i + 1}
                  className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                    responses[question.id] === i + 1
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-transparent bg-muted/50 hover:bg-muted hover:border-muted-foreground/20"
                  }`}
                >
                  <RadioGroupItem value={(i + 1).toString()} id={`q${question.id}-${i + 1}`} />
                  <Label htmlFor={`q${question.id}-${i + 1}`} className="flex-1 cursor-pointer">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mr-2">{i + 1}</span>
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handlePrev} disabled={currentQ === 0} className="gap-1">
                <ChevronLeft className="w-4 h-4" /> Previous
              </Button>
              <div className="flex gap-2">
                {currentQ < 198 ? (
                  <Button onClick={handleNext} className="gradient-primary text-primary-foreground gap-1">
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={handleComplete} disabled={!allAnswered} className="gradient-accent text-accent-foreground gap-1">
                    <CheckCircle className="w-4 h-4" /> Complete Assessment
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Map Toggle */}
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuestionMap(!showQuestionMap)}
            className="w-full"
          >
            {showQuestionMap ? "Hide" : "Show"} Question Map ({answered}/199 answered, {unansweredList.length} remaining)
          </Button>
        </div>

        {/* Question Map Grid */}
        {showQuestionMap && (
          <Card className="shadow-card mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-3">
                Question Map
                <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Answered
                  <span className="w-3 h-3 rounded-sm bg-red-400 inline-block ml-2" /> Unanswered
                  <span className="w-3 h-3 rounded-sm ring-2 ring-primary inline-block ml-2" /> Current
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1">
                {allQuestions.map((q, idx) => {
                  const isAnswered = !!responses[q.id];
                  const isCurrent = idx === currentQ;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQ(idx)}
                      className={`w-7 h-7 rounded text-[10px] font-medium transition-all ${
                        isCurrent
                          ? "ring-2 ring-primary bg-primary text-primary-foreground scale-110"
                          : isAnswered
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-red-400 text-white hover:bg-red-500"
                      }`}
                      title={`Q${q.id}: ${q.category} - ${q.subcategory}`}
                    >
                      {q.id}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unanswered summary */}
        {unansweredList.length > 0 && unansweredList.length <= 20 && (
          <Card className="shadow-card border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                ⚠️ {unansweredList.length} unanswered question{unansweredList.length > 1 ? "s" : ""} remaining:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {unansweredList.map(q => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQ(allQuestions.indexOf(q))}
                    className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium hover:bg-red-200 transition-colors"
                  >
                    Q{q.id}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
