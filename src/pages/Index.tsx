import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Users, BarChart3, FileText, Sparkles, Target, Star, Shield, ArrowRight, Crown } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { BrainLogo } from "@/components/BrainLogo";

const features = [
  { icon: Brain, title: "DISC & MBTI", desc: "Discover your personality type, bird archetype, and communication style with deep explanations" },
  { icon: Sparkles, title: "Multiple Intelligence", desc: "Identify your top intelligences from 8 types with real-life applications" },
  { icon: Target, title: "Career Mapping (RIASEC)", desc: "Holland's RIASEC-based career recommendations with industry paths" },
  { icon: BarChart3, title: "IQ, EQ, AQ, CQ", desc: "Measure Intelligence, Emotional, Adversity & Creative Quotients" },
  { icon: FileText, title: "SWOT Analysis", desc: "Automated strengths, weaknesses, opportunities & threats with explanations" },
  { icon: Users, title: "Deep Interpretation Report", desc: "10-section professional report with graphs, correlations & action plans" },
];

const taglines = [
  "Are you an INTJ like Elon Musk?",
  "Could you lead like Alexander the Great?",
  "Discover the ruler within — your hidden archetype awaits.",
  "Left-brain logic vs Right-brain magic — which wins in you?",
];

// Famous personalities — used as a "Which legend matches you?" teaser strip on the home page.
const archetypes = [
  { emoji: "🚀", name: "Elon Musk",        type: "INTJ — Visionary Strategist",     accent: "from-cyan-500/20 to-blue-500/10",     ring: "ring-cyan-400/40" },
  { emoji: "👑", name: "Alexander the Great", type: "Eagle (D) — Bold Ruler",        accent: "from-violet-500/20 to-fuchsia-500/10", ring: "ring-violet-400/40" },
  { emoji: "🎨", name: "Leonardo da Vinci", type: "Polymath — All 8 Intelligences",  accent: "from-fuchsia-500/20 to-purple-500/10", ring: "ring-fuchsia-400/40" },
  { emoji: "🧪", name: "Albert Einstein",   type: "INTP — Eternal Learner",          accent: "from-emerald-500/20 to-teal-500/10",   ring: "ring-emerald-400/40" },
  { emoji: "💎", name: "Oprah Winfrey",     type: "ENFJ — Emotional Conductor",      accent: "from-amber-500/20 to-orange-500/10",   ring: "ring-amber-400/40" },
  { emoji: "🍎", name: "Steve Jobs",        type: "ENTJ — Creative Commander",       accent: "from-rose-500/20 to-pink-500/10",      ring: "ring-rose-400/40" },
];

const testimonials = [
  { name: "Dr. Priya Sharma", role: "Career Counselor", text: "This platform transformed how I deliver career guidance. The reports are professional and deeply insightful." },
  { name: "Arjun Mehta", role: "HR Director", text: "We use it for all employee assessments. The company-wise filtering and reports save us hours." },
  { name: "Sarah Johnson", role: "Student", text: "I finally understand my learning style and personality. The action plan helped me improve my study habits." },
];

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <div className="gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary/30 blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-secondary/30 blur-3xl" style={{ animation: "pulse 4s ease-in-out infinite 1s" }} />
        </div>
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <BrainLogo size={110} animated />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 text-sm mb-6 animate-fade-in">
              <Crown className="w-4 h-4" /> 199 Research-Backed Questions • 10-Section Deep Report
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 leading-tight animate-fade-in">
              Personality &amp; Intelligence Assessment
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-3 animate-fade-in font-display italic">
              {taglines[0]}
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8 animate-fade-in">
              {taglines.slice(1).map(t => (
                <span key={t} className="px-3 py-1 rounded-full bg-primary-foreground/10 text-xs">{t}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 justify-center animate-fade-in">
              <Button size="lg" className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90 font-display gap-2 hover:scale-105 transition-transform" onClick={() => navigate(user ? "/assessment" : "/register")}>
                {user ? "Take Assessment" : "Get Started"} <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" className="bg-primary-foreground/15 border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/25 hover:scale-105 transition-transform" onClick={() => navigate("/pricing")}>
                <Sparkles className="w-4 h-4 mr-1" /> View Plans
              </Button>
              {!user && (
                <Button size="lg" className="bg-primary-foreground/15 border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/25 hover:scale-105 transition-transform" onClick={() => navigate("/login")}>
                  Login
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Famous personality archetypes — "Which legend matches you?" */}
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-2">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-2">Which legend lives in you?</p>
          <h2 className="text-2xl md:text-3xl font-display font-bold">
            Your <span className="text-gradient">archetype</span> awaits
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            Every result maps you to a famous personality — discover whether you think like Musk, lead like Alexander, or create like Da Vinci.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {archetypes.map((a, i) => (
            <Card
              key={a.name}
              className={`shadow-card hover:shadow-elevated transition-all hover:-translate-y-1 animate-fade-in ring-1 ${a.ring}`}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <CardContent className={`p-4 flex flex-col items-center text-center bg-gradient-to-br ${a.accent} rounded-lg`}>
                <span className="text-3xl mb-2" aria-hidden>{a.emoji}</span>
                <p className="text-sm font-display font-bold leading-tight">{a.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{a.type}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Left vs Right Brain teaser */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Card className="shadow-elevated border-0 overflow-hidden">
          <CardContent className="p-6 md:p-8 grid md:grid-cols-2 gap-6 items-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div>
              <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">Left Brain vs Right Brain</h2>
              <p className="text-muted-foreground mb-4">
                Are you a logical strategist or a creative dreamer? Discover the balance between your analytical and imaginative hemispheres — and what it means for your career, relationships, and decisions.
              </p>
              <div className="flex gap-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">Logic • Analysis • Strategy</span>
                <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold">Creativity • Intuition • Empathy</span>
              </div>
            </div>
            <div className="flex justify-center">
              <BrainLogo size={180} animated />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-center mb-4">Comprehensive Assessment System</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">Transform raw data into meaning, insight, and action with our three-engine interpretation system</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <Card key={f.title} className="shadow-card hover:shadow-elevated transition-all hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary-foreground" />
                </div>
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
          <h2 className="text-2xl font-display font-bold text-center mb-8">Two Powerful Systems</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-card hover:shadow-elevated transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">🎓 Student System</h3>
                <p className="text-muted-foreground mb-4">Learning assessment with personality profiling, intelligence mapping, and academic career guidance.</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-primary" /> DISC & MBTI Personality</li>
                  <li className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-primary" /> Multiple Intelligence & Learning Style</li>
                  <li className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-primary" /> Career Mapping & SWOT Analysis</li>
                  <li className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-primary" /> School/College based grouping</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="shadow-card hover:shadow-elevated transition-all">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-display font-bold mb-2">💼 Employee System</h3>
                <p className="text-muted-foreground mb-4">Performance profiling with brain dominance analysis and company-wise management.</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-secondary" /> All Student assessments included</li>
                  <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-secondary" /> Brain Dominance (Left vs Right)</li>
                  <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-secondary" /> Company code registration</li>
                  <li className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-secondary" /> Company-wise reporting & export</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-display font-bold text-center mb-8">What People Say</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <Card key={t.name} className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-primary text-primary" />)}
                </div>
                <p className="text-sm text-muted-foreground italic mb-4">"{t.text}"</p>
                <p className="text-sm font-display font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t">
        <div className="flex justify-center mb-3"><BrainLogo size={40} /></div>
        <p>Personality &amp; Intelligence Assessment • From Effort to Impact</p>
      </footer>
    </div>
  );
}
