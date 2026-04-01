import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Users, BarChart3, FileText, Sparkles, Target } from "lucide-react";

const features = [
  { icon: Brain, title: "DISC & MBTI", desc: "Discover your personality type and communication style" },
  { icon: Sparkles, title: "Multiple Intelligence", desc: "Identify your top intelligences from 8 types" },
  { icon: Target, title: "Career Mapping", desc: "RIASEC-based career recommendations" },
  { icon: BarChart3, title: "Quotients", desc: "Measure your IQ, EQ, AQ, and CQ" },
  { icon: FileText, title: "SWOT Analysis", desc: "Automated strengths, weaknesses, opportunities & threats" },
  { icon: Users, title: "Brain Dominance", desc: "Left vs Right brain analysis for employees" },
];

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="gradient-hero text-primary-foreground">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <nav className="flex items-center justify-between mb-12">
            <h2 className="text-xl font-display font-bold">MindMap Portal</h2>
            {user ? (
              <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate(user.role === "admin" ? "/admin" : "/dashboard")}>
                Dashboard
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/login")}>Sign In</Button>
                <Button className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90" onClick={() => navigate("/register")}>Get Started</Button>
              </div>
            )}
          </nav>
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
              Mind Mapping &<br />Assessment Portal
            </h1>
            <p className="text-lg md:text-xl opacity-80 mb-8">
              Comprehensive personality assessment covering DISC, MBTI, Multiple Intelligence,
              Learning Styles, Quotients & Career Mapping — for students and employees.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-display" onClick={() => navigate("/register")}>
                Take Assessment
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/login")}>
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-4">Comprehensive Assessment System</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">199 research-backed questions across 6 categories to map your mind and unlock your potential</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <Card key={f.title} className="shadow-card hover:shadow-elevated transition-shadow animate-fade-in">
              <CardContent className="p-6">
                <f.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-display font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Two Systems */}
      <div className="bg-muted/50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-card">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Student System</h3>
                <p className="text-muted-foreground mb-4">Learning assessment with personality profiling, intelligence mapping, and academic career guidance.</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• DISC & MBTI Personality</li>
                  <li>• Multiple Intelligence & Learning Style</li>
                  <li>• Career Mapping & SWOT Analysis</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="shadow-card">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">Employee System</h3>
                <p className="text-muted-foreground mb-4">Performance profiling with brain dominance analysis and professional development insights.</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• All Student assessments included</li>
                  <li>• Brain Dominance (Left vs Right)</li>
                  <li>• Professional career recommendations</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <p>Mind Mapping & Assessment Portal • Powered by Research-Based Psychometrics</p>
      </footer>
    </div>
  );
}
