import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { allQuestions, sections } from "@/data/questions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Responses } from "@/lib/scoring";

const scaleLabels = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];

export default function AssessmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Responses>({});

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const saved = localStorage.getItem(`mm_responses_${user.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setResponses(parsed);
      // Find first unanswered
      const first = allQuestions.findIndex(q => !parsed[q.id]);
      if (first >= 0) setCurrentQ(first);
    }
  }, [user, navigate]);

  if (!user) return null;

  const question = allQuestions[currentQ];
  const answered = Object.keys(responses).length;
  const progress = (answered / 199) * 100;
  const currentSection = sections.find(s => s.category === question.category);

  const handleAnswer = (value: string) => {
    const updated = { ...responses, [question.id]: parseInt(value) };
    setResponses(updated);
    localStorage.setItem(`mm_responses_${user.id}`, JSON.stringify(updated));
  };

  const handleNext = () => {
    if (currentQ < 198) setCurrentQ(currentQ + 1);
  };

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(currentQ - 1);
  };

  const handleComplete = () => {
    localStorage.setItem(`mm_completed_${user.id}`, "true");
    navigate("/results");
  };

  const allAnswered = allQuestions.every(q => responses[q.id]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Assessment</h1>
            <p className="text-sm text-muted-foreground">{user.name} • {user.role}</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Save & Exit</Button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Question {currentQ + 1} of 199</span>
            <span>{answered}/199 answered</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Section Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {sections.map(s => {
            const sectionStart = allQuestions.findIndex(q => q.section === s.id);
            const isActive = currentSection?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentQ(sectionStart)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "gradient-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {s.id}: {s.name}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        <Card className="shadow-elevated animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">{question.category}</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-secondary/10 text-secondary">{question.subcategory}</span>
            </div>
            <CardTitle className="text-lg font-display">Q{question.id}. {question.text}</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={responses[question.id]?.toString() || ""}
              onValueChange={handleAnswer}
              className="space-y-3"
            >
              {scaleLabels.map((label, i) => (
                <div key={i + 1} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value={(i + 1).toString()} id={`q${question.id}-${i + 1}`} />
                  <Label htmlFor={`q${question.id}-${i + 1}`} className="flex-1 cursor-pointer">
                    <span className="font-medium">{i + 1}</span> — {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={handlePrev} disabled={currentQ === 0}>Previous</Button>
              <div className="flex gap-2">
                {currentQ < 198 ? (
                  <Button onClick={handleNext} className="gradient-primary text-primary-foreground">Next</Button>
                ) : (
                  <Button onClick={handleComplete} disabled={!allAnswered} className="gradient-accent text-accent-foreground">
                    Complete Assessment
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
