import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, GraduationCap, Briefcase, Building2, Users,
  Check, Sparkles, Brain,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";

type Audience = "individual" | "working" | "organization" | "group";

interface AddOn {
  id: string;
  label: string;
  base: number;
  discountPct?: number;
  helper?: string;
  required?: boolean;
}

const PLANS: Record<Exclude<Audience, "organization" | "group">, { title: string; addons: AddOn[] }> = {
  individual: {
    title: "Individual",
    addons: [
      { id: "brain", label: "Brain Mapping (Detailed Report)", base: 1000, discountPct: 20, helper: "Full 20-page interpretation report", required: true },
      { id: "tech",  label: "Technical Counseling Session", base: 500, helper: "1-on-1 session with our specialist" },
      { id: "career",label: "Course Selection + Career Guidance (School & College)", base: 500, helper: "Personalised academic & career roadmap" },
    ],
  },
  working: {
    title: "Working Professional",
    addons: [
      { id: "brain", label: "Brain Mapping (Detailed Report)", base: 1000, helper: "Full 20-page interpretation report", required: true },
      { id: "tech",  label: "Technical Counseling Session", base: 500, helper: "1-on-1 session with our specialist" },
    ],
  },
};

function priceAfter(addon: AddOn, groupDiscount: boolean): number {
  let p = addon.base;
  if (addon.discountPct) p = Math.round(p * (1 - addon.discountPct / 100));
  if (groupDiscount) p = Math.round(p * 0.85);
  return p;
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [audience, setAudience] = useState<Audience>("individual");
  const [selected, setSelected] = useState<Record<string, boolean>>({ brain: true });
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const isContact = audience === "organization";
  const isGroup = audience === "group";
  const plan = !isContact ? PLANS[(isGroup ? "individual" : audience) as keyof typeof PLANS] : null;

  const total = useMemo(() => {
    if (!plan) return 0;
    return plan.addons.reduce((sum, a) => {
      if (!selected[a.id] && !a.required) return sum;
      return sum + priceAfter(a, isGroup);
    }, 0);
  }, [plan, selected, isGroup]);

  const handleAudience = (v: string) => {
    setAudience(v as Audience);
    setSelected({ brain: true });
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-display font-bold">Plans &amp; Add-ons</h1>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Pick add-ons. Total updates live.
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
            One report. Choose how deep you want to go.
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Brain Mapping is the core deep-dive report. Add Technical Counseling and Career Guidance as
            optional add-ons. Group of students get an extra 15% off everything.
          </p>
        </div>

        <Tabs value={audience} onValueChange={handleAudience}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto mb-6">
            <TabsTrigger value="individual" className="gap-1.5 text-xs sm:text-sm py-2">
              <GraduationCap className="w-4 h-4" /> Individual
            </TabsTrigger>
            <TabsTrigger value="working" className="gap-1.5 text-xs sm:text-sm py-2">
              <Briefcase className="w-4 h-4" /> Working
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-1.5 text-xs sm:text-sm py-2">
              <Building2 className="w-4 h-4" /> Organization
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-1.5 text-xs sm:text-sm py-2">
              <Users className="w-4 h-4" /> Group / Students
            </TabsTrigger>
          </TabsList>

          {!isContact && (
            <TabsContent value={audience} className="space-y-3">
              {isGroup && (
                <div className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Group of students: an additional <strong>15% off</strong> applied on every add-on below.
                </div>
              )}

              <Card className="border-2 border-primary/20 shadow-elevated">
                <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5">
                  <CardTitle className="text-base font-display flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" /> {plan!.title} — pick your add-ons
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-2.5">
                  {plan!.addons.map(a => {
                    const checked = !!selected[a.id] || !!a.required;
                    const finalPrice = priceAfter(a, isGroup);
                    const original = a.base;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => !a.required && setSelected(s => ({ ...s, [a.id]: !s[a.id] }))}
                        className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                          checked
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox checked={checked} disabled={a.required} className="mt-1 pointer-events-none" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <p className="font-display font-semibold text-sm">
                                {a.label}
                                {a.required && (
                                  <span className="ml-2 text-[10px] uppercase tracking-wider text-primary">Included</span>
                                )}
                                {a.discountPct && (
                                  <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                    {a.discountPct}% off
                                  </span>
                                )}
                              </p>
                              <p className="font-bold text-primary tabular-nums">
                                ₹{finalPrice}
                                {finalPrice !== original && (
                                  <span className="ml-2 text-xs text-muted-foreground line-through font-normal">₹{original}</span>
                                )}
                              </p>
                            </div>
                            {a.helper && <p className="text-xs text-muted-foreground mt-1">{a.helper}</p>}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 mt-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Payable</p>
                      <p className="text-3xl font-display font-bold text-primary tabular-nums">₹{total}</p>
                      {audience === "individual" && total === 1300 && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">Brain Mapping ₹800 + Counseling ₹500 (after 20% off on mapping)</p>
                      )}
                    </div>
                    <Button
                      size="lg"
                      className="gradient-primary text-primary-foreground hover:scale-105 transition-transform"
                      onClick={() => navigate("/register")}
                      disabled={total === 0}
                    >
                      Get Started
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* What's inside */}
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Brain Mapping includes</p>
                  <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    {[
                      "Full DISC + MBTI interpretation",
                      "8 Multiple-Intelligence breakdown",
                      "IQ • EQ • AQ • CQ deep dive",
                      "Learning style guide",
                      "SWOT analysis",
                      "0-2 / 2-5 / 5-10 year career roadmap",
                      "Personalised action plan",
                      "Left vs Right brain dominance",
                    ].map(f => (
                      <div key={f} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> <span className="text-muted-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="organization" className="space-y-3">
            <Card className="border-2 border-primary/20 shadow-elevated">
              <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Organization — Custom Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Bulk pricing, dedicated dashboard, company-wise analytics, and on-demand counseling
                  sessions for your team. Tell us about your organization and our sales team will reach
                  out within one business day.
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Your name</Label>
                    <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Work email</Label>
                    <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="jane@company.com" />
                  </div>
                </div>
                <Button
                  className="w-full gradient-primary text-primary-foreground"
                  disabled={!contactName || !contactEmail || submitted}
                  onClick={() => { setSubmitted(true); setTimeout(() => setSubmitted(false), 1500); }}
                >
                  {submitted ? "✓ Sent! We'll be in touch." : "Contact Sales Team"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-muted-foreground italic mt-8">
          Secure checkout • Instant report delivery • 100% confidential
        </p>
      </div>
    </div>
  );
}
