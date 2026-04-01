import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Welcome, {user.name}</h1>
            <p className="text-muted-foreground capitalize">{user.role} Dashboard</p>
          </div>
          <Button variant="outline" onClick={() => { logout(); navigate("/"); }}>Logout</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Profile Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><span className="text-muted-foreground">Name:</span> {user.name}</p>
              <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
              <p><span className="text-muted-foreground">Role:</span> <span className="capitalize">{user.role}</span></p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display">Assessment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasCompleted ? (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <p className="text-sm text-muted-foreground">199/199 questions answered</p>
                  <div className="flex gap-2">
                    <Button onClick={() => navigate("/results")} className="gradient-primary text-primary-foreground">View Results</Button>
                    <Button variant="outline" onClick={() => navigate("/assessment")}>Retake</Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-sm font-medium">{answeredCount > 0 ? "In Progress" : "Not Started"}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{answeredCount}/199 questions answered</p>
                  <Button onClick={() => navigate("/assessment")} className="gradient-primary text-primary-foreground">
                    {answeredCount > 0 ? "Continue Assessment" : "Start Assessment"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
