import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft, Zap, Star, Crown } from "lucide-react";
import perfyLogo from "@/assets/perfy-logo.jpeg";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    icon: Zap,
    desc: "Try the assessment with basic results",
    features: [
      "199 questions assessment",
      "Basic profile summary",
      "DISC & MBTI type only",
      "Limited report (2 sections)",
      "No PDF download",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "per assessment",
    icon: Star,
    desc: "Full deep interpretation report",
    features: [
      "Everything in Free",
      "10-section deep report",
      "All graphs & visualizations",
      "Detailed explanations for every score",
      "Correlation & recommendation engines",
      "PDF download (14+ pages)",
      "Career roadmap & action plan",
      "SWOT analysis with expansion",
    ],
    cta: "Buy Pro Report",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "₹2,999",
    period: "per month",
    icon: Crown,
    desc: "For organizations & schools",
    features: [
      "Everything in Pro",
      "Unlimited assessments",
      "Company/School management",
      "Company code registration",
      "Bulk CSV export",
      "Company-wise aggregate reports",
      "Admin analytics dashboard",
      "Priority support",
      "Custom branding (coming soon)",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <img src={perfyLogo} alt="Perfy" className="h-8 rounded bg-foreground/5 p-0.5" />
          <h1 className="text-2xl font-display font-bold">Pricing Plans</h1>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Choose Your Plan</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            From basic personality insights to full enterprise reporting — pick the plan that fits your needs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {plans.map(plan => (
            <Card key={plan.name} className={`shadow-card relative overflow-hidden transition-all hover:-translate-y-1 ${plan.popular ? "border-2 border-primary shadow-elevated" : ""}`}>
              {plan.popular && (
                <div className="absolute top-0 right-0 gradient-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}
              <CardHeader className="pb-2 pt-6">
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center mb-3">
                  <plan.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl font-display">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{plan.desc}</p>
                <div className="mt-3">
                  <span className="text-3xl font-display font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? "gradient-primary text-primary-foreground" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => navigate("/register")}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center py-8 border-t">
          <p className="text-sm text-muted-foreground">
            All plans include the full 199-question assessment. Reports are generated instantly.
          </p>
        </div>
      </div>
    </div>
  );
}