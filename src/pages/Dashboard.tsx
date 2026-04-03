import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, CheckCircle, Clock, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hasCompleted, setHasCompleted] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role === "admin") { navigate("/admin"); return; }
    setHasCompleted(!!localStorage.getItem(`mm_completed_${user.id}`));
    const responses = JSON.parse(localStorage.getItem(`mm_responses_${user.id}`) || "{}");
    setAnsweredCount(Object.keys(responses).length);
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-hero">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-primary-foreground">Welcome, {user.name}</h1>
              <p className="text-xs text-primary-foreground/70 capitalize">{user.role} {user.companyName ? `• ${user.companyName}` : ""}{user.school ? ` • ${user.school}` : ""}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => { logout(); navigate("/"); }}>Logout</Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><p className="text-muted-foreground text-xs">Name</p><p className="font-medium">{user.name}</p></div>
              <div><p className="text-muted-foreground text-xs">Email</p><p className="font-medium">{user.email}</p></div>
              <div><p className="text-muted-foreground text-xs">Role</p><p className="font-medium capitalize">{user.role}</p></div>
              {user.companyName && <div><p className="text-muted-foreground text-xs">Company</p><p className="font-medium">{user.companyName}</p></div>}
            </div>
          </CardContent>
        </Card>

        {/* Assessment Status */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            {hasCompleted ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-display font-bold">Assessment Complete!</h3>
                  <p className="text-sm text-muted-foreground">All 199 questions answered. View your detailed results and download your report.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => navigate("/results")} className="gradient-primary text-primary-foreground">
                    View Results <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/assessment")}>Retake</Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-amber-600" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-display font-bold">{answeredCount > 0 ? "Continue Assessment" : "Start Assessment"}</h3>
                  <p className="text-sm text-muted-foreground">{answeredCount}/199 questions answered. Complete all questions to unlock your results.</p>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden max-w-xs">
                    <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${(answeredCount / 199) * 100}%` }} />
                  </div>
                </div>
                <Button onClick={() => navigate("/assessment")} className="gradient-primary text-primary-foreground">
                  {answeredCount > 0 ? "Continue" : "Start"} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
