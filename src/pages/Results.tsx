import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import ReportSummary from "@/components/ReportSummary";
import { BrainLogo } from "@/components/BrainLogo";

export default function ResultsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const completed = localStorage.getItem(`mm_completed_${user.id}`);
    if (!completed) { navigate("/assessment"); return; }
    setReady(true);
  }, [user, navigate]);

  if (!user || !ready) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-3">
            <BrainLogo size={42} />
            <div>
              <p className="text-sm font-display font-bold leading-tight">Personality &amp; Intelligence</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Your snapshot</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/assessment")}>Retake</Button>
          </div>
        </div>
        <ReportSummary targetUser={user} />
      </div>
    </div>
  );
}
