import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Building2, GraduationCap, Briefcase, Lock, ArrowRight } from "lucide-react";

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
      { id: "tech", label: "Technical Counseling Session", base: 500, helper: "1-on-1 session with our specialist" },
      { id: "career", label: "Course & Career Guidance (School / College)", base: 500, helper: "Personalised academic & career roadmap" },
    ],
  },
  working: {
    title: "Working Professional",
    addons: [
      { id: "brain", label: "Brain Mapping (Detailed Report)", base: 1000, helper: "Full 20-page interpretation report", required: true },
      { id: "tech", label: "Technical Counseling Session", base: 500, helper: "1-on-1 session with our specialist" },
    ],
  },
};

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onUnlock: () => void;
}

function priceAfter(addon: AddOn, groupDiscount: boolean): number {
  let p = addon.base;
  if (addon.discountPct) p = Math.round(p * (1 - addon.discountPct / 100));
  if (groupDiscount) p = Math.round(p * 0.85);
  return p;
}

export default function PaymentDialog({ open, onOpenChange, onUnlock }: Props) {
  const [audience, setAudience] = useState<Audience>("individual");
  const [selected, setSelected] = useState<Record<string, boolean>>({ brain: true });
  const [contactEmail, setContactEmail] = useState("");
  const [contactName, setContactName] = useState("");
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

  const handlePay = () => {
    // Simulated payment success — wire to Lovable Cloud / Stripe later.
    setSubmitted(true);
    // Close immediately and trigger the download in the same gesture chain so the
    // browser doesn't re-open the plans dialog or block the file.
    onOpenChange(false);
    onUnlock();
    setSubmitted(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" /> Unlock Your Detailed Report
          </DialogTitle>
          <DialogDescription>
            Choose your plan and add-ons. The base detailed report is required; counseling and guidance are optional add-ons.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={audience} onValueChange={handleAudience} className="mt-2">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto">
            <TabsTrigger value="individual" className="gap-1 text-xs"><GraduationCap className="w-3.5 h-3.5" /> Individual</TabsTrigger>
            <TabsTrigger value="working" className="gap-1 text-xs"><Briefcase className="w-3.5 h-3.5" /> Working</TabsTrigger>
            <TabsTrigger value="organization" className="gap-1 text-xs"><Building2 className="w-3.5 h-3.5" /> Organization</TabsTrigger>
            <TabsTrigger value="group" className="gap-1 text-xs"><Sparkles className="w-3.5 h-3.5" /> Group / Students</TabsTrigger>
          </TabsList>

          {/* Individual / Working / Group share addon UI */}
          {!isContact && (
            <TabsContent value={audience} className="mt-4 space-y-3">
              {isGroup && (
                <div className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Group of students: an additional 15% off applied on every add-on.
                </div>
              )}
              {plan!.addons.map(a => {
                const checked = !!selected[a.id] || !!a.required;
                const finalPrice = priceAfter(a, isGroup);
                const original = a.base;
                return (
                  <Card
                    key={a.id}
                    className={`cursor-pointer transition-all ${checked ? "border-primary shadow-md" : "hover:border-primary/40"}`}
                    onClick={() => !a.required && setSelected(s => ({ ...s, [a.id]: !s[a.id] }))}
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      <Checkbox checked={checked} disabled={a.required} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="font-display font-semibold text-sm">
                            {a.label}
                            {a.required && <span className="ml-2 text-[10px] uppercase tracking-wider text-primary">Included</span>}
                            {a.discountPct && (
                              <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
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
                        {a.helper && <p className="text-xs text-muted-foreground mt-0.5">{a.helper}</p>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Total */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-primary/20">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Payable</p>
                  <p className="text-3xl font-display font-bold text-primary tabular-nums">₹{total}</p>
                </div>
                <Button
                  size="lg"
                  className="gradient-primary text-primary-foreground gap-2 hover:scale-105 transition-transform"
                  onClick={handlePay}
                  disabled={submitted || total === 0}
                >
                  {submitted ? "Processing..." : <>Pay &amp; Unlock <ArrowRight className="w-4 h-4" /></>}
                </Button>
              </div>
            </TabsContent>
          )}

          <TabsContent value="organization" className="mt-4 space-y-3">
            <Card>
              <CardContent className="p-5 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-lg">Custom Organisation Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Bulk pricing, dedicated dashboard, company-wise analytics, and on-demand counseling sessions for your team.
                  </p>
                </div>
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
                  onClick={() => { setSubmitted(true); setTimeout(() => { setSubmitted(false); onOpenChange(false); }, 900); }}
                >
                  {submitted ? "Sent!" : "Contact Sales Team"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="text-[11px] text-muted-foreground italic">
          Secure checkout • Instant report delivery • 100% confidential
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
