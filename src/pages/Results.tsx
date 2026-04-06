import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import UserReport from "@/components/UserReport";
import perfyLogo from "@/assets/perfy-logo.jpeg";

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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-2 mb-4">
          <img src={perfyLogo} alt="Perfy" className="h-12 rounded-xl bg-foreground/5 p-0.5 shadow-sm" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/assessment")}>Retake</Button>
          </div>
        </div>
        <UserReport targetUser={user} showBackButton={false} />
      </div>
    </div>
  );
}
