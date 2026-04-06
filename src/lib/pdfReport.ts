// Perfy — 20-Page Deep Interpretation PDF Report Generator
import jsPDF from "jspdf";
import type { User } from "@/lib/auth";
import type { AssessmentResults } from "@/lib/scoring";
import {
  discInterpretations, mbtiInterpretations, intelligenceDescriptions,
  learningStyleDetails, quotientInterpretations, careerTypeDetails,
  generateCorrelationInsight, generateActionPlan, generateCareerRoadmap
} from "@/lib/interpretations";

const BLUE = [59, 130, 246] as const;
const DARK = [30, 41, 59] as const;
const GRAY = [100, 116, 139] as const;
const GREEN = [34, 197, 94] as const;
const RED = [239, 68, 68] as const;
const AMBER = [245, 158, 11] as const;
const PURPLE = [139, 92, 246] as const;
const TEAL = [20, 184, 166] as const;

const PH = 297; // A4 height
const PW_A4 = 210;
const MARGIN = 18;
const CONTENT_W = PW_A4 - MARGIN * 2;
const FOOTER_H = 16;
const MAX_Y = PH - FOOTER_H - 10;

function addPageHeader(doc: jsPDF, sectionNum: number, title: string, subtitle?: string) {
  const pw = doc.internal.pageSize.getWidth();
  // Dark header bar
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pw, subtitle ? 30 : 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`PERFY  |  Section ${sectionNum}: ${title}`, pw / 2, 11, { align: "center" });
  doc.setFont("helvetica", "normal");
  if (subtitle) { doc.setFontSize(9); doc.text(subtitle, pw / 2, 20, { align: "center" }); }
  doc.setFontSize(7);
  doc.text("From Effort to Impact  •  Personality & Performance Report", pw / 2, subtitle ? 27 : 20, { align: "center" });
  doc.setTextColor(0, 0, 0);
}

function sectionTitle(doc: jsPDF, text: string, y: number, color: readonly [number, number, number] = BLUE): number {
  y = ensureSpace(doc, y, 14);
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(...color);
  doc.text(text, MARGIN, y);
  // underline
  doc.setDrawColor(...color); doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 1.5, MARGIN + doc.getTextWidth(text), y + 1.5);
  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  return y + 8;
}

function subTitle(doc: jsPDF, text: string, y: number): number {
  y = ensureSpace(doc, y, 10);
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...BLUE);
  doc.text(text, MARGIN, y);
  doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0); doc.setFontSize(10);
  return y + 6;
}

function subSubTitle(doc: jsPDF, text: string, y: number): number {
  y = ensureSpace(doc, y, 8);
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(60, 60, 60);
  doc.text(text, MARGIN + 3, y);
  doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
  return y + 5;
}

function para(doc: jsPDF, text: string, x: number, y: number, maxW: number, fontSize = 10, lineH = 5): number {
  doc.setFontSize(fontSize);
  const lines = doc.splitTextToSize(text, maxW);
  for (const line of lines) {
    y = ensureSpace(doc, y, lineH + 2);
    doc.text(line, x, y);
    y += lineH;
  }
  return y;
}

function explanation(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(9); doc.setTextColor(80, 80, 80);
  const lines = doc.splitTextToSize(text, CONTENT_W - 6);
  for (const line of lines) {
    y = ensureSpace(doc, y, 5);
    doc.text(line, MARGIN + 3, y); y += 4.5;
  }
  doc.setFontSize(10); doc.setTextColor(0, 0, 0);
  return y + 2;
}

function boldLabel(doc: jsPDF, label: string, value: string, y: number, x = MARGIN): number {
  y = ensureSpace(doc, y, 7);
  doc.setFont("helvetica", "bold"); doc.text(label, x, y);
  doc.setFont("helvetica", "normal");
  const labelW = doc.getTextWidth(label) + 2;
  const lines = doc.splitTextToSize(value, CONTENT_W - labelW - (x - MARGIN));
  doc.text(lines, x + labelW, y);
  return y + Math.max(lines.length * 5, 6);
}

function bullets(doc: jsPDF, items: string[], x: number, y: number, maxW: number): number {
  for (const item of items) {
    y = ensureSpace(doc, y, 8);
    const lines = doc.splitTextToSize(`•  ${item}`, maxW);
    doc.text(lines, x, y);
    y += lines.length * 5 + 1.5;
  }
  return y;
}

function progressBar(doc: jsPDF, label: string, value: number, y: number, barW = 90, color: readonly [number, number, number] = BLUE): number {
  y = ensureSpace(doc, y, 10);
  doc.setFont("helvetica", "bold"); doc.setFontSize(9);
  doc.text(`${label}:`, MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${value}%`, MARGIN + 50, y);
  const barX = MARGIN + 60;
  doc.setFillColor(230, 230, 230); doc.roundedRect(barX, y - 3.5, barW, 5, 1, 1, "F");
  doc.setFillColor(...color); doc.roundedRect(barX, y - 3.5, Math.max(2, (value / 100) * barW), 5, 1, 1, "F");
  doc.setFontSize(10);
  return y + 8;
}

// removed unused colorBox

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > MAX_Y) { doc.addPage(); return 15; }
  return y;
}

function forceNewPage(doc: jsPDF): number {
  doc.addPage();
  return 15;
}

function divider(doc: jsPDF, y: number): number {
  y = ensureSpace(doc, y, 6);
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  doc.setDrawColor(0, 0, 0);
  return y + 5;
}

export function generateDeepReport(user: User, results: AssessmentResults) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();

  const discKey = results.disc.bird === "Eagle" ? "D" : results.disc.bird === "Parrot" ? "I" : results.disc.bird === "Dove" ? "S" : "C";
  const discInfo = discInterpretations[discKey];
  const mbtiInfo = mbtiInterpretations[results.mbti.type];
  const lsInfo = learningStyleDetails[results.learningStyle.dominant];
  const corr = generateCorrelationInsight(results.disc.dominant, results.mbti.type, results.quotients.IQ, results.quotients.EQ, results.quotients.AQ, results.quotients.CQ, results.learningStyle.dominant, results.intelligence.top2);
  const plan = generateActionPlan(results.quotients.IQ, results.quotients.EQ, results.quotients.AQ, results.quotients.CQ, results.learningStyle.dominant, results.career.top2);
  const roadmap = generateCareerRoadmap(results.career.top2, results.career.suggestedRoles);
  const birdName = results.disc.bird;
  const birdLabel = birdName === "Eagle" ? "Eagle (Bold Leader)" : birdName === "Parrot" ? "Parrot (Social Influencer)" : birdName === "Dove" ? "Dove (Steady Supporter)" : "Owl (Analytical Thinker)";

  const allScores = [
    { name: "IQ (Intelligence Quotient)", val: results.quotients.IQ },
    { name: "EQ (Emotional Quotient)", val: results.quotients.EQ },
    { name: "AQ (Adversity Quotient)", val: results.quotients.AQ },
    { name: "CQ (Creative Quotient)", val: results.quotients.CQ },
  ];
  const highest = allScores.reduce((a, b) => a.val > b.val ? a : b);
  const lowest = allScores.reduce((a, b) => a.val < b.val ? a : b);

  // ====================================================================
  // COVER PAGE
  // ====================================================================
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pw, PH, "F");
  doc.setTextColor(255, 255, 255);

  doc.setFontSize(36); doc.setFont("helvetica", "bold");
  doc.text("PERFY", pw / 2, 55, { align: "center" });
  doc.setFontSize(12); doc.setFont("helvetica", "normal");
  doc.text("From Effort to Impact", pw / 2, 65, { align: "center" });

  doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.5);
  doc.line(pw / 2 - 40, 72, pw / 2 + 40, 72);

  doc.setFontSize(18); doc.setFont("helvetica", "bold");
  doc.text("PERSONALITY & PERFORMANCE", pw / 2, 90, { align: "center" });
  doc.text("DEEP INTERPRETATION REPORT", pw / 2, 100, { align: "center" });

  doc.setFontSize(14); doc.setFont("helvetica", "normal");
  doc.text(user.name.toUpperCase(), pw / 2, 125, { align: "center" });
  doc.setFontSize(11);
  doc.text(`Profile Type: ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`, pw / 2, 135, { align: "center" });
  const extras = [user.companyName, user.department, (user as any).school].filter(Boolean);
  if (extras.length) doc.text(extras.join("  |  "), pw / 2, 143, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pw / 2, 160, { align: "center" });

  // Quick stats at bottom of cover
  const statsY = 190;
  doc.setFontSize(9);
  const quickStats = [
    `DISC: ${discKey} (${birdName})`, `MBTI: ${results.mbti.type}`,
    `IQ: ${results.quotients.IQ}%`, `EQ: ${results.quotients.EQ}%`,
    `AQ: ${results.quotients.AQ}%`, `CQ: ${results.quotients.CQ}%`,
    `Style: ${results.learningStyle.dominant}`, `Career: ${results.career.top2.join(" & ")}`
  ];
  doc.text(quickStats.join("   •   "), pw / 2, statsY, { align: "center", maxWidth: pw - 30 });

  doc.setFontSize(8);
  doc.text("This report contains 10 detailed sections across 20+ pages", pw / 2, PH - 30, { align: "center" });
  doc.text("Data → Meaning → Insight → Action", pw / 2, PH - 24, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // ====================================================================
  // TABLE OF CONTENTS
  // ====================================================================
  doc.addPage();
  doc.setFillColor(...DARK); doc.rect(0, 0, pw, 20, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(13); doc.setFont("helvetica", "bold");
  doc.text("TABLE OF CONTENTS", pw / 2, 13, { align: "center" });
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal");

  let y = 35;
  const tocItems = [
    "Section 1: Profile Summary — Complete personality overview & snapshot",
    "Section 2: Personality Interpretation — DISC personality with bird archetype + MBTI deep analysis",
    "Section 3: Intelligence Analysis — IQ, EQ, AQ, CQ detailed interpretation",
    "Section 4: Learning Style Guide — How you learn best with practical techniques",
    "Section 5: Multiple Intelligence Analysis — Gardner's 8 intelligences mapped",
    "Section 6: Career Fit Analysis — RIASEC career mapping with industry paths",
    "Section 7: SWOT Analysis — Expanded strengths, weaknesses, opportunities & threats",
    "Section 8: Combined Personality Insight — Cross-dimensional correlation analysis",
    "Section 9: Action Plan — Short-term & long-term development strategies",
    "Section 10: Career Roadmap — Detailed career growth trajectory",
  ];
  doc.setFontSize(11);
  tocItems.forEach((item, i) => {
    doc.setFont("helvetica", "bold"); doc.setTextColor(...BLUE);
    doc.text(`${i + 1}.`, MARGIN, y);
    doc.setFont("helvetica", "normal"); doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(item, CONTENT_W - 10);
    doc.text(lines, MARGIN + 8, y);
    y += lines.length * 6 + 6;
  });

  y += 10;
  doc.setFontSize(9); doc.setTextColor(...GRAY);
  doc.text("Each section provides: Explanation → Meaning → Insight → Actionable Guidance", MARGIN, y); y += 5;
  doc.text("Every abbreviation is fully explained with context and reasoning", MARGIN, y); y += 5;
  doc.text("Report powered by Interpretation Engine, Correlation Engine & Recommendation Engine", MARGIN, y);

  // ====================================================================
  // SECTION 1: PROFILE SUMMARY (2 pages)
  // ====================================================================
  doc.addPage();
  addPageHeader(doc, 1, "Profile Summary", "Complete Personality & Performance Overview");
  y = 36;

  y = sectionTitle(doc, "Personal Information", y);
  y = boldLabel(doc, "Name: ", user.name, y);
  y = boldLabel(doc, "Profile Type: ", user.role.charAt(0).toUpperCase() + user.role.slice(1), y);
  if (user.companyName) y = boldLabel(doc, "Company: ", user.companyName, y);
  if (user.department) y = boldLabel(doc, "Department: ", user.department, y);
  if ((user as any).school) y = boldLabel(doc, "School/College: ", (user as any).school, y);
  y += 3;

  y = sectionTitle(doc, "Assessment Results at a Glance", y);
  y = boldLabel(doc, "DISC Personality: ", `${results.disc.dominant} — ${birdLabel}`, y);
  y = explanation(doc, `DISC stands for Dominance, Influence, Steadiness, Compliance. It is a behavioral assessment model that categorizes personality into 4 dimensions. Your dominant dimension is "${discKey}" which is represented by the ${birdName} archetype. This means ${discInfo.brief}`, y);

  y = boldLabel(doc, "MBTI Type: ", `${results.mbti.type} — ${mbtiInfo?.title || ""}`, y);
  y = explanation(doc, `MBTI stands for Myers-Briggs Type Indicator, a personality framework with 16 types based on 4 preference pairs: E/I (Extraversion vs Introversion — how you get energy), S/N (Sensing vs Intuition — how you process information), T/F (Thinking vs Feeling — how you make decisions), J/P (Judging vs Perceiving — how you organize your life). Your type ${results.mbti.type} means: ${results.mbti.type.split("").map((l: string) => l === "E" ? "Extraverted" : l === "I" ? "Introverted" : l === "S" ? "Sensing" : l === "N" ? "Intuitive" : l === "T" ? "Thinking" : l === "F" ? "Feeling" : l === "J" ? "Judging" : "Perceiving").join(", ")}.`, y);

  y = boldLabel(doc, "Learning Style: ", results.learningStyle.dominant, y);
  y = explanation(doc, `Learning style identifies how you absorb information best. The three types are Visual (learning by seeing), Auditory (learning by hearing), and Kinesthetic (learning by doing). Your dominant style "${results.learningStyle.dominant}" means ${lsInfo.howLearns}`, y);

  y = boldLabel(doc, "Top Intelligence: ", results.intelligence.top2.join(" & "), y);
  y = boldLabel(doc, "Career Mapping: ", `${results.career.top2.join(" & ")} → ${results.career.suggestedRoles.slice(0, 3).join(", ")}`, y);
  if (user.role === "employee") y = boldLabel(doc, "Brain Dominance: ", `Left ${results.brainDominance.left}% / Right ${results.brainDominance.right}%`, y);
  y += 3;

  y = sectionTitle(doc, "Quotient Scores Overview", y);
  allScores.forEach(s => { y = progressBar(doc, s.name, s.val, y); });
  y += 3;

  y = subTitle(doc, "Key Insight", y);
  y = para(doc, `Your highest score is ${highest.name} at ${highest.val}%, indicating this is your strongest natural aptitude and primary competitive advantage. Your lowest score is ${lowest.name} at ${lowest.val}%, which represents your primary growth opportunity. Focused development in this area will have the greatest impact on your overall performance and career trajectory.`, MARGIN, y, CONTENT_W);
  y += 3;

  y = sectionTitle(doc, "Overall Profile Summary", y);
  y = para(doc, `${user.name} is a ${results.disc.dominant} personality, represented by the ${birdName} archetype. In the MBTI framework, they are classified as ${results.mbti.type} (${mbtiInfo?.title || ""}), which means they are ${mbtiInfo?.description?.split(".")[0] || "a unique personality type"}.`, MARGIN, y, CONTENT_W);
  y += 2;
  y = para(doc, `As a ${results.learningStyle.dominant} learner with strong ${results.intelligence.top2.join(" and ")} intelligence, ${user.name} demonstrates ${results.quotients.EQ >= 70 ? "strong emotional awareness and empathy" : "developing emotional skills that can be enhanced with practice"} (EQ: ${results.quotients.EQ}%) and ${results.quotients.IQ >= 70 ? "solid analytical and problem-solving capability" : "growing analytical ability that benefits from structured training"} (IQ: ${results.quotients.IQ}%).`, MARGIN, y, CONTENT_W);
  y += 2;
  y = para(doc, `Their Adversity Quotient of ${results.quotients.AQ}% indicates ${results.quotients.AQ >= 70 ? "strong resilience — they handle pressure and setbacks effectively" : "moderate resilience — building stress management skills will improve performance"}. Their Creative Quotient of ${results.quotients.CQ}% shows ${results.quotients.CQ >= 70 ? "high innovation potential — they generate novel solutions and see connections others miss" : "developing creative capacity — regular creative exercises will unlock innovative thinking"}.`, MARGIN, y, CONTENT_W);
  y += 2;
  y = para(doc, `Their career aptitude aligns with ${results.career.top2.join(" and ")} domains in the RIASEC model (Holland's Career Theory), suggesting optimal fit for roles such as ${results.career.suggestedRoles.join(", ")}. This alignment combines their personality strengths with market opportunities for maximum career satisfaction.`, MARGIN, y, CONTENT_W);

  // ====================================================================
  // SECTION 2: PERSONALITY INTERPRETATION (DISC + MBTI) — 4 pages
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 2, "Personality Interpretation", "DISC Personality + MBTI Deep Analysis");
  y = 36;

  // -- DISC Part --
  y = sectionTitle(doc, "DISC Personality Analysis", y);
  y = explanation(doc, "DISC is a widely-used behavioral assessment developed from the work of psychologist William Moulton Marston. It measures four behavioral dimensions: D (Dominance) = how you handle problems and assert yourself, I (Influence) = how you interact with and persuade others, S (Steadiness) = your patience, persistence, and supportiveness, C (Compliance) = how you approach rules, procedures, and quality. Each person has a dominant dimension represented by a bird archetype: Eagle (D), Parrot (I), Dove (S), or Owl (C).", y);
  y += 2;

  y = subTitle(doc, `Your DISC Type: ${discKey} — ${results.disc.dominant}`, y);
  y = para(doc, `You are a ${birdLabel}. ${discKey === "D" ? "Eagles are bold, decisive leaders who take charge. They see the big picture, act fast, and drive results. Your dominant D score means you naturally lead from the front and thrive on challenges." : discKey === "I" ? "Parrots are enthusiastic, social, and persuasive communicators. They energize teams and build connections. Your dominant I score means you naturally inspire and motivate others through your charisma." : discKey === "S" ? "Doves are calm, supportive, and reliable team players. They value harmony and stability. Your dominant S score means you naturally create peaceful, productive environments where people feel safe." : "Owls are analytical, detail-oriented, and quality-focused. They ensure accuracy and thoroughness. Your dominant C score means you naturally maintain high standards and catch errors others miss."}`, MARGIN, y, CONTENT_W);
  y += 3;

  y = subTitle(doc, "Why You Are This Type", y);
  y = para(doc, `Based on your assessment responses, your ${discKey} dimension scored highest at ${results.disc.percentages[discKey]}%. This means your natural behavioral tendency in work and life situations is to ${discKey === "D" ? "take charge, make quick decisions, and drive toward results" : discKey === "I" ? "connect with people, communicate enthusiastically, and build social networks" : discKey === "S" ? "support others, maintain stability, and create harmonious environments" : "analyze carefully, follow procedures, and ensure quality and accuracy"}. This is your authentic behavioral preference — not a limitation, but your natural strength.`, MARGIN, y, CONTENT_W);
  y += 3;

  y = subTitle(doc, "DISC Dimension Scores", y);
  const discExplainFull: Record<string, string> = {
    D: "Dominance (Eagle) — Measures assertiveness, problem-solving drive, and results orientation. High D individuals are direct, competitive, and action-focused.",
    I: "Influence (Parrot) — Measures social interaction, persuasion, and enthusiasm. High I individuals are charismatic, optimistic, and relationship-focused.",
    S: "Steadiness (Dove) — Measures patience, persistence, and supportiveness. High S individuals are calm, loyal, and harmony-focused.",
    C: "Compliance (Owl) — Measures attention to detail, rules adherence, and quality focus. High C individuals are analytical, precise, and accuracy-focused.",
  };
  (["D", "I", "S", "C"] as const).forEach(k => {
    y = progressBar(doc, `${k} (${k === "D" ? "Dominance/Eagle" : k === "I" ? "Influence/Parrot" : k === "S" ? "Steadiness/Dove" : "Compliance/Owl"})`, results.disc.percentages[k], y, 80, k === discKey ? BLUE : GRAY);
    y = explanation(doc, discExplainFull[k], y);
  });
  y += 2;

  y = subTitle(doc, "Meaning of Your DISC Profile", y);
  y = para(doc, discInfo.meaning, MARGIN, y, CONTENT_W);
  y += 3;

  y = subTitle(doc, "Behaviour Traits — How You Act in Real Life", y);
  y = bullets(doc, discInfo.traits.map((t, i) => `${t} — This trait manifests in daily interactions through ${i === 0 ? "your natural tendency in group dynamics" : i === 1 ? "how you handle pressure" : i === 2 ? "your decision-making approach" : i === 3 ? "your goal-setting behavior" : "your problem-solving style"}.`), MARGIN + 3, y, CONTENT_W - 6);
  y += 2;

  y = subTitle(doc, "Strengths — Natural Advantages", y);
  y = bullets(doc, discInfo.strengths.map(s => `${s} — This strength gives you a competitive edge in professional and personal contexts.`), MARGIN + 3, y, CONTENT_W - 6);
  y += 2;

  y = subTitle(doc, "Risks & Limitations — Areas to Watch", y);
  y = bullets(doc, discInfo.risks.map(r => `${r} — Being aware of this tendency helps you manage it proactively.`), MARGIN + 3, y, CONTENT_W - 6);
  y += 2;

  y = subTitle(doc, "Workplace Fit", y);
  y = para(doc, discInfo.workFit, MARGIN, y, CONTENT_W);
  y += 2;
  y = para(doc, `As a ${birdName} personality, you thrive in environments that ${discKey === "D" ? "reward initiative, leadership, and results-driven performance. You prefer autonomy and resist micromanagement" : discKey === "I" ? "value creativity, teamwork, and social connection. You need recognition and variety to stay engaged" : discKey === "S" ? "provide stability, clear expectations, and supportive management. You prefer gradual change over sudden disruption" : "value precision, quality, and systematic processes. You prefer working with data and clear standards"}.`, MARGIN, y, CONTENT_W);

  // -- MBTI Part --
  y = ensureSpace(doc, y, 60);
  y = divider(doc, y);
  y = sectionTitle(doc, `MBTI Personality: ${results.mbti.type} — ${mbtiInfo?.title || ""}`, y);
  y = explanation(doc, "MBTI (Myers-Briggs Type Indicator) was developed by Isabel Briggs Myers and Katharine Briggs based on Carl Jung's theory of psychological types. It categorizes personality into 16 types using 4 preference pairs. MBTI helps you understand how you perceive the world and make decisions. It is one of the most widely used personality assessments globally.", y);
  y += 2;

  y = subTitle(doc, "Your MBTI Dimension Scores", y);
  const mbtiFullExplain: Record<string, string> = {
    E: "E = Extraversion — You gain energy from social interaction and the external world. You think out loud and prefer action.",
    I: "I = Introversion — You gain energy from solitude and internal reflection. You think before speaking and prefer depth.",
    S: "S = Sensing — You focus on concrete facts, real-world details, and practical information. You trust experience.",
    N: "N = Intuition — You focus on patterns, possibilities, and abstract ideas. You trust inspiration and imagination.",
    T: "T = Thinking — You make decisions based on logic, objective analysis, and consistent principles. You value fairness.",
    F: "F = Feeling — You make decisions based on personal values and how they affect people. You value harmony.",
    J: "J = Judging — You prefer structure, planning, and organization. You like things decided and settled.",
    P: "P = Perceiving — You prefer flexibility, spontaneity, and keeping options open. You adapt as you go.",
  };

  const pairs = [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]] as const;
  pairs.forEach(([a, b]) => {
    y = ensureSpace(doc, y, 18);
    const aS = results.mbti.scores[a], bS = results.mbti.scores[b];
    const winner = aS >= bS ? a : b;
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(`${a} vs ${b}:  ${a} = ${aS}  |  ${b} = ${bS}  →  You are ${winner}`, MARGIN, y);
    doc.setFont("helvetica", "normal"); y += 5;
    y = explanation(doc, mbtiFullExplain[a], y);
    y = explanation(doc, mbtiFullExplain[b], y);
    y = explanation(doc, `You scored higher on ${winner} (${winner === a ? aS : bS} vs ${winner === a ? bS : aS}), which means you naturally ${mbtiFullExplain[winner].split("—")[1]?.trim() || "prefer this dimension"}.`, y);
    y += 2;
  });

  y = subTitle(doc, `Why You Are ${results.mbti.type} (${mbtiInfo?.title || ""})`, y);
  y = para(doc, `Your MBTI type ${results.mbti.type} is determined by combining your four dominant preferences: ${results.mbti.type.split("").map((l: string) => mbtiFullExplain[l]?.split("—")[0]?.trim()).join(", ")}. Together, these preferences create the "${mbtiInfo?.title || ""}" personality archetype.`, MARGIN, y, CONTENT_W);
  y += 3;

  if (mbtiInfo) {
    y = subTitle(doc, "Core Personality Description", y);
    y = para(doc, mbtiInfo.description, MARGIN, y, CONTENT_W);
    y += 3;

    y = subTitle(doc, "Work Style", y);
    y = para(doc, mbtiInfo.workStyle, MARGIN, y, CONTENT_W);
    y += 2;
    y = para(doc, `This work style means you ${results.mbti.type.includes("E") ? "thrive in collaborative, people-oriented settings" : "excel in focused, independent work environments"} and ${results.mbti.type.includes("J") ? "prefer structured timelines and clear deliverables" : "prefer flexibility and open-ended exploration"}.`, MARGIN, y, CONTENT_W);
    y += 3;

    y = subTitle(doc, "Strengths in Teams", y);
    y = para(doc, mbtiInfo.teamStrengths, MARGIN, y, CONTENT_W);
    y += 3;

    y = subTitle(doc, "Weakness Patterns", y);
    y = para(doc, mbtiInfo.weaknesses, MARGIN, y, CONTENT_W);
    y += 2;
    y = para(doc, "Awareness of these patterns is the first step to managing them. Consider seeking feedback from trusted colleagues to identify blind spots.", MARGIN, y, CONTENT_W);
    y += 3;

    y = subTitle(doc, "Leadership Style", y);
    y = para(doc, mbtiInfo.leadership, MARGIN, y, CONTENT_W);
    y += 3;

    y = subTitle(doc, "Communication Style", y);
    y = para(doc, mbtiInfo.communication, MARGIN, y, CONTENT_W);
    y += 3;

    y = subTitle(doc, "Ideal Career Directions for " + results.mbti.type, y);
    y = bullets(doc, mbtiInfo.careers.map(c => `${c} — aligned with your ${results.mbti.type} personality preferences and natural strengths`), MARGIN + 3, y, CONTENT_W - 6);
  }

  // ====================================================================
  // SECTION 3: INTELLIGENCE ANALYSIS (2 pages)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 3, "Intelligence Analysis", "IQ  •  EQ  •  AQ  •  CQ — Detailed Interpretation");
  y = 36;

  y = sectionTitle(doc, "Understanding the Four Quotients", y);
  y = explanation(doc, "Intelligence is not a single measure. Modern psychology recognizes multiple dimensions of intelligence. The four quotients measured here represent different aspects of cognitive and emotional capability. Together, they provide a comprehensive picture of your mental strengths and growth areas.", y);
  y += 2;

  y = subTitle(doc, "Quotient Scores at a Glance", y);
  allScores.forEach(s => { y = progressBar(doc, s.name, s.val, y, 85, s.val >= 70 ? GREEN : s.val >= 50 ? BLUE : RED); });
  y += 3;
  y = para(doc, `Key Insight: You are a "${highest.val >= 70 ? "problem-solver" : "developing thinker"}" with your strongest dimension in ${highest.name} (${highest.val}%). Your primary growth area is ${lowest.name} (${lowest.val}%). Focused development here will yield the greatest overall improvement.`, MARGIN, y, CONTENT_W);
  y += 5;

  // Each quotient in detail
  (["IQ", "EQ", "AQ", "CQ"] as const).forEach(q => {
    const score = results.quotients[q];
    const interp = quotientInterpretations[q](score);
    const fullNames: Record<string, string> = {
      IQ: "Intelligence Quotient — Analytical Ability & Problem-Solving",
      EQ: "Emotional Quotient — Emotional Awareness & Relationship Handling",
      AQ: "Adversity Quotient — Ability to Handle Stress, Failure & Change",
      CQ: "Creative Quotient — Innovation, Imagination & Creative Problem-Solving"
    };
    const whyMatters: Record<string, string> = {
      IQ: "IQ measures your capacity for logical reasoning, abstract thinking, and problem-solving. It indicates how quickly you can process complex information, identify patterns, and arrive at solutions. In professional settings, IQ correlates with job performance in analytically demanding roles.",
      EQ: "EQ measures your ability to recognize, understand, and manage your own emotions, as well as recognize and influence the emotions of others. High EQ is the strongest predictor of leadership effectiveness, team collaboration, and relationship quality in both personal and professional life.",
      AQ: "AQ measures your resilience — how you respond to adversity, setbacks, and change. It determines whether you see obstacles as threats or opportunities. High AQ individuals bounce back faster from failures, adapt to change more readily, and maintain productivity under pressure.",
      CQ: "CQ measures your capacity for creative thinking, innovation, and generating novel solutions. It reflects your ability to think outside conventional frameworks, connect disparate ideas, and approach problems from unique angles. CQ is increasingly valued in knowledge-economy roles.",
    };

    y = ensureSpace(doc, y, 60);
    y = divider(doc, y);
    y = sectionTitle(doc, `${q}: ${score}% — ${fullNames[q]}`, y, score >= 70 ? GREEN : score >= 50 ? BLUE : RED);
    y = para(doc, whyMatters[q], MARGIN, y, CONTENT_W);
    y += 2;

    y = subTitle(doc, "What Your Score Means", y);
    y = para(doc, interp.meaning, MARGIN, y, CONTENT_W);
    y += 2;

    y = subTitle(doc, "Impact on Your Performance", y);
    y = para(doc, interp.impact, MARGIN, y, CONTENT_W);
    y += 2;

    y = subTitle(doc, "Actionable Improvement Steps", y);
    y = bullets(doc, interp.improvement, MARGIN + 3, y, CONTENT_W - 6);
    y += 4;
  });

  // ====================================================================
  // SECTION 4: LEARNING STYLE GUIDE (2 pages)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 4, "Learning Style Guide", `Dominant: ${results.learningStyle.dominant}`);
  y = 36;

  y = sectionTitle(doc, "Understanding Learning Styles", y);
  y = explanation(doc, "Learning style theory, based on the VAK model, identifies three primary channels through which people absorb information: Visual (seeing and reading), Auditory (hearing and discussing), and Kinesthetic (touching and doing). While everyone uses all three, your dominant style indicates the channel that is most efficient for you. Understanding this helps you optimize study methods, training approaches, and communication strategies.", y);
  y += 2;

  y = subTitle(doc, "Your Learning Style Scores", y);
  Object.entries(results.learningStyle.percentages).forEach(([k, v]) => {
    y = progressBar(doc, k, v, y, 85, k === results.learningStyle.dominant ? BLUE : GRAY);
  });
  y += 3;

  y = subTitle(doc, `Your Dominant Style: ${results.learningStyle.dominant}`, y);
  y = para(doc, `You are primarily a ${results.learningStyle.dominant} learner, scoring ${results.learningStyle.percentages[results.learningStyle.dominant]}% in this dimension. This means ${lsInfo.howLearns}`, MARGIN, y, CONTENT_W);
  y += 3;

  y = subTitle(doc, "Why This Matters", y);
  y = para(doc, `Understanding your learning style is critical because it directly impacts how efficiently you absorb, process, and retain information. When you study or train using methods aligned with your ${results.learningStyle.dominant} preference, you learn faster, remember longer, and perform better. When you use mismatched methods, you waste effort and experience frustration.`, MARGIN, y, CONTENT_W);
  y += 3;

  y = subTitle(doc, `How ${user.name} Learns Best`, y);
  y = para(doc, lsInfo.howLearns, MARGIN, y, CONTENT_W);
  y += 3;

  y = subTitle(doc, "Best Learning Methods for You", y);
  y = bullets(doc, lsInfo.bestMethods.map(m => `${m} — highly effective for your ${results.learningStyle.dominant} processing style`), MARGIN + 3, y, CONTENT_W - 6);
  y += 3;

  y = subTitle(doc, "Methods to Avoid", y);
  y = bullets(doc, lsInfo.avoid.map(m => `${m} — this approach conflicts with your natural learning preference and reduces retention`), MARGIN + 3, y, CONTENT_W - 6);
  y += 3;

  y = subTitle(doc, "Practical Techniques for Daily Use", y);
  y = bullets(doc, lsInfo.techniques.map(t => `${t}`), MARGIN + 3, y, CONTENT_W - 6);
  y += 3;

  // Other styles brief
  y = subTitle(doc, "Your Secondary Learning Channels", y);
  const otherStyles = Object.entries(results.learningStyle.percentages).filter(([k]) => k !== results.learningStyle.dominant).sort((a, b) => b[1] - a[1]);
  otherStyles.forEach(([style, pct]) => {
    const info = learningStyleDetails[style];
    y = ensureSpace(doc, y, 20);
    doc.setFont("helvetica", "bold"); doc.text(`${style}: ${pct}%`, MARGIN, y); doc.setFont("helvetica", "normal"); y += 5;
    y = para(doc, `${info.howLearns} While not your primary channel, incorporating ${style.toLowerCase()} elements can enhance overall learning effectiveness.`, MARGIN, y, CONTENT_W);
    y += 3;
  });

  // ====================================================================
  // SECTION 5: MULTIPLE INTELLIGENCE (2 pages)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 5, "Multiple Intelligence Analysis", `Top: ${results.intelligence.top2.join(" & ")}`);
  y = 36;

  y = sectionTitle(doc, "Howard Gardner's Theory of Multiple Intelligences", y);
  y = explanation(doc, "Developed by Harvard psychologist Howard Gardner in 1983, the theory of Multiple Intelligences identifies 8 distinct types of intelligence. Unlike traditional IQ which measures only logical-mathematical ability, this framework recognizes that intelligence is multi-faceted. Every person has all 8 intelligences, but each person's unique profile of strengths creates their competitive advantage and career fit.", y);
  y += 2;

  y = subTitle(doc, "All Intelligence Scores", y);
  const sortedIntel = Object.entries(results.intelligence.percentages).sort((a, b) => b[1] - a[1]);
  sortedIntel.forEach(([k, v]) => {
    const isTop = results.intelligence.top2.includes(k);
    y = progressBar(doc, k, v, y, 85, isTop ? BLUE : GRAY);
  });
  y += 3;

  y = subTitle(doc, "Your Top Intelligences — Detailed Analysis", y);
  results.intelligence.top2.forEach(intel => {
    const info = intelligenceDescriptions[intel];
    y = ensureSpace(doc, y, 40);
    y = divider(doc, y);
    y = sectionTitle(doc, `${intel} Intelligence (${results.intelligence.percentages[intel]}%)`, y, PURPLE);

    y = subSubTitle(doc, "What This Intelligence Means", y);
    y = para(doc, info.meaning, MARGIN, y, CONTENT_W);
    y += 2;

    y = subSubTitle(doc, "Real-Life Application", y);
    y = para(doc, info.application, MARGIN, y, CONTENT_W);
    y += 2;

    y = subSubTitle(doc, "Career Relevance", y);
    y = para(doc, info.careerRelevance, MARGIN, y, CONTENT_W);
    y += 2;

    y = subSubTitle(doc, "Why This Matters for You", y);
    y = para(doc, `Your strong ${intel} intelligence (${results.intelligence.percentages[intel]}%) means you have a natural aptitude in this area. Combined with your ${results.learningStyle.dominant} learning style and ${results.mbti.type} personality, this intelligence creates a powerful foundation for career success in ${info.careerRelevance.split(",").slice(0, 2).join(" and ")}.`, MARGIN, y, CONTENT_W);
    y += 4;
  });

  // Other intelligences brief
  y = subTitle(doc, "Other Intelligence Dimensions", y);
  sortedIntel.filter(([k]) => !results.intelligence.top2.includes(k)).forEach(([intel, pct]) => {
    const info = intelligenceDescriptions[intel];
    y = ensureSpace(doc, y, 15);
    doc.setFont("helvetica", "bold"); doc.text(`${intel}: ${pct}%`, MARGIN, y); doc.setFont("helvetica", "normal"); y += 5;
    y = explanation(doc, info.meaning, y);
    y += 1;
  });

  // ====================================================================
  // SECTION 6: CAREER FIT (2 pages)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 6, "Career Fit Analysis (RIASEC)", `Top: ${results.career.top2.join(" & ")}`);
  y = 36;

  y = sectionTitle(doc, "Holland's RIASEC Career Theory", y);
  y = explanation(doc, "Developed by psychologist John Holland, the RIASEC model categorizes both personalities and work environments into 6 types: R = Realistic (hands-on, practical), I = Investigative (research, analytical), A = Artistic (creative, expressive), S = Social (helping, teaching), E = Enterprising (leading, selling), C = Conventional (organizing, systematic). The theory states that people are most satisfied and successful when their personality type matches their work environment.", y);
  y += 2;

  y = subTitle(doc, "Career Type Scores", y);
  Object.entries(results.career.percentages).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    const isTop = results.career.top2.includes(k);
    y = progressBar(doc, k, v, y, 85, isTop ? BLUE : GRAY);
  });
  y += 2;

  y = subTitle(doc, "Suggested Career Roles", y);
  y = para(doc, `Based on your ${results.career.top2.join(" and ")} career aptitude, combined with your ${results.disc.dominant} personality and ${results.mbti.type} MBTI type, the following roles are recommended: ${results.career.suggestedRoles.join(", ")}.`, MARGIN, y, CONTENT_W);
  y += 4;

  results.career.top2.forEach(career => {
    const info = careerTypeDetails[career];
    y = ensureSpace(doc, y, 50);
    y = divider(doc, y);
    y = sectionTitle(doc, `${career} (${results.career.percentages[career]}%)`, y, TEAL);

    y = subSubTitle(doc, "Personality-Career Alignment", y);
    y = para(doc, info.explanation, MARGIN, y, CONTENT_W);
    y += 2;

    y = subSubTitle(doc, "Why This Fits You", y);
    y = para(doc, `Your ${discKey} (${birdName}) DISC personality and ${results.mbti.type} MBTI type align well with ${career} career environments because ${discKey === "D" || discKey === "I" ? "you are action-oriented and people-focused" : "you are detail-oriented and systematic"}, which are valued traits in ${career.toLowerCase()} professions.`, MARGIN, y, CONTENT_W);
    y += 2;

    y = subSubTitle(doc, "Suitable Industries", y);
    y = bullets(doc, info.industries.map(ind => `${ind} — offers ${career.toLowerCase()} work environments matching your profile`), MARGIN + 3, y, CONTENT_W - 6);
    y += 2;

    y = subSubTitle(doc, "Recommended Job Roles", y);
    y = bullets(doc, info.roles.map(r => `${r}`), MARGIN + 3, y, CONTENT_W - 6);
    y += 2;

    y = subSubTitle(doc, "Career Growth Path", y);
    y = para(doc, info.growthPath, MARGIN, y, CONTENT_W);
    y += 4;
  });

  // ====================================================================
  // SECTION 7: SWOT ANALYSIS (2 pages)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 7, "SWOT Analysis", "Expanded Strengths, Weaknesses, Opportunities & Threats");
  y = 36;

  y = sectionTitle(doc, "Understanding SWOT", y);
  y = explanation(doc, "SWOT stands for Strengths, Weaknesses, Opportunities, and Threats. Originally a business strategy tool, it is equally powerful for personal development. SWOT helps you understand your current position clearly and create targeted strategies for growth. Strengths and Weaknesses are internal factors (within your control), while Opportunities and Threats are external factors (market conditions, industry trends).", y);
  y += 3;

  const swotData = [
    { title: "STRENGTHS — Core Competencies & Natural Advantages", items: results.swot.strengths, color: GREEN, detail: "These are your natural advantages — leverage them for career growth and competitive positioning. Each strength represents a capability you can immediately deploy in professional settings." },
    { title: "WEAKNESSES — Areas Requiring Development", items: results.swot.weaknesses, color: RED, detail: "These areas need focused development. Weaknesses are not permanent limitations — they are growth opportunities. With targeted effort, each weakness can be transformed into a competency." },
    { title: "OPPORTUNITIES — Actionable Growth Pathways", items: results.swot.opportunities, color: BLUE, detail: "These represent pathways for advancement aligned with your personality, intelligence, and career mapping. Acting on opportunities while they align with market demand creates maximum impact." },
    { title: "THREATS — Risks to Manage Proactively", items: results.swot.threats, color: AMBER, detail: "These are risks that could undermine your progress if left unaddressed. Awareness is the first step — develop preventive strategies for each threat to maintain steady growth." },
  ];

  swotData.forEach(section => {
    y = ensureSpace(doc, y, 40);
    y = sectionTitle(doc, section.title, y, section.color as [number, number, number]);
    y = para(doc, section.detail, MARGIN, y, CONTENT_W);
    y += 2;
    section.items.forEach(item => {
      y = ensureSpace(doc, y, 18);
      doc.setFont("helvetica", "bold"); doc.text(`•  ${item}`, MARGIN + 3, y); doc.setFont("helvetica", "normal"); y += 5;
      // Generate expanded explanation for each item
      let itemExplanation = "";
      if (item.includes("Analytical")) itemExplanation = "Your analytical capability allows you to break down complex problems into manageable components. This skill is valued across industries and positions you for roles requiring strategic thinking.";
      else if (item.includes("Emotional")) itemExplanation = "Emotional intelligence is the strongest predictor of leadership success. Your ability to read and manage emotions creates trust and collaboration in teams.";
      else if (item.includes("Creative")) itemExplanation = "Creative thinking enables innovation and fresh approaches. In an increasingly automated world, creativity is one of the most in-demand skills.";
      else if (item.includes("Resilience") || item.includes("Adaptability")) itemExplanation = "Resilience and adaptability are essential in today's rapidly changing work environments. Your ability to bounce back from setbacks ensures consistent long-term performance.";
      else if (item.includes("Intelligence")) itemExplanation = `Your ${item} represents a significant cognitive strength that can be leveraged in specialized career paths and professional development.`;
      else if (item.includes("career") || item.includes("Role")) itemExplanation = `This represents a concrete career opportunity aligned with your personality profile and natural strengths.`;
      else itemExplanation = `This factor influences your overall development trajectory and should be considered in your personal growth strategy.`;
      y = explanation(doc, itemExplanation, y);
      y += 2;
    });
    y += 3;
  });

  // ====================================================================
  // SECTION 8: COMBINED PERSONALITY INSIGHT (2 pages)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 8, "Combined Personality Insight", "Cross-Dimensional Correlation Analysis");
  y = 36;

  y = sectionTitle(doc, "How Multiple Dimensions Create Your Unique Profile", y);
  y = explanation(doc, "Individual assessment dimensions tell only part of the story. The real power of personality assessment comes from combining multiple data points to reveal deeper patterns. This section uses the Correlation Engine to link DISC + MBTI + Quotients + Intelligence + Learning Style into a holistic, integrated personality profile.", y);
  y += 3;

  y = subTitle(doc, "Who You Are — Integrated Personality Portrait", y);
  y = para(doc, corr.whoTheyAre, MARGIN, y, CONTENT_W);
  y += 2;
  y = para(doc, `This portrait emerges from combining your ${discKey} (${birdName}) DISC personality with your ${results.mbti.type} MBTI type. The ${birdName} archetype provides your behavioral framework, while ${results.mbti.type} adds cognitive and decision-making preferences. Together, they reveal a personality that ${discKey === "D" || discKey === "I" ? "is externally focused, action-oriented, and naturally gravitates toward leadership or social influence" : "is internally focused, reflective, and naturally gravitates toward deep analysis or supportive collaboration"}.`, MARGIN, y, CONTENT_W);
  y += 4;

  y = subTitle(doc, "How You Behave — Behavioural Patterns", y);
  y = para(doc, corr.howTheyBehave, MARGIN, y, CONTENT_W);
  y += 2;
  y = para(doc, `Your behavioral patterns are further shaped by your Emotional Quotient (EQ: ${results.quotients.EQ}%). ${results.quotients.EQ >= 70 ? "With strong emotional awareness, you naturally read social cues, manage interpersonal dynamics, and maintain productive relationships even under stress." : "As your emotional awareness develops, you'll become increasingly skilled at navigating social dynamics and building stronger professional relationships."}`, MARGIN, y, CONTENT_W);
  y += 4;

  y = subTitle(doc, "Where You Perform Best — Optimal Environments", y);
  y = para(doc, corr.whereTheyPerformBest, MARGIN, y, CONTENT_W);
  y += 4;

  y = sectionTitle(doc, "Correlation Analysis — Connecting the Dots", y, PURPLE);

  const correlations = [
    { title: `DISC (${discKey}/${birdName}) + MBTI (${results.mbti.type}) → Behaviour Insight`, content: `Your ${discKey} personality combined with ${results.mbti.type} creates a ${discKey === "D" ? "driven, strategic" : discKey === "I" ? "enthusiastic, people-oriented" : discKey === "S" ? "supportive, patient" : "analytical, methodical"} behavioral pattern. The ${birdName} archetype (${discKey}) determines HOW you act, while ${results.mbti.type} determines WHY you act that way. This combination means you ${discKey === "D" || discKey === "I" ? "take initiative and lead naturally, expressing your MBTI preferences through action and social engagement" : "process deeply and act deliberately, expressing your MBTI preferences through careful analysis and measured response"}.` },
    { title: `IQ (${results.quotients.IQ}%) + AQ (${results.quotients.AQ}%) → Work Performance Capability`, content: `IQ measures your analytical power while AQ measures your resilience. Together they determine your work performance under pressure. ${results.quotients.IQ >= 70 && results.quotients.AQ >= 70 ? "With both high IQ and high AQ, you can solve complex problems even in stressful, high-pressure situations. This is a rare and valuable combination." : results.quotients.IQ >= 70 ? "Your strong analytical ability combined with developing resilience means you perform excellently in stable environments but may struggle when under extreme pressure. Building AQ will unlock your full potential." : results.quotients.AQ >= 70 ? "Your strong resilience means you persist through challenges, but developing analytical skills will help you solve problems more efficiently." : "Both areas are developing. Focus on building analytical skills first (structured practice), then gradually increase exposure to challenging situations to build resilience."}` },
    { title: `Learning Style (${results.learningStyle.dominant}) + Intelligence (${results.intelligence.top2[0]}) → Learning Strategy`, content: `Your ${results.learningStyle.dominant} learning preference combined with ${results.intelligence.top2[0]} intelligence creates an optimized learning channel. This means you absorb information most efficiently when it is presented ${results.learningStyle.dominant === "Visual" ? "visually (diagrams, charts, videos)" : results.learningStyle.dominant === "Auditory" ? "through discussion and verbal explanation" : "through hands-on practice and physical engagement"} AND connected to your ${results.intelligence.top2[0].toLowerCase()} cognitive strengths. Use this insight to select training programs, study methods, and professional development that align with both dimensions.` },
    { title: `EQ (${results.quotients.EQ}%) + CQ (${results.quotients.CQ}%) → Innovation & Team Potential`, content: `EQ (emotional awareness) and CQ (creative ability) together determine your potential for innovative teamwork. ${results.quotients.EQ >= 70 && results.quotients.CQ >= 70 ? "With both high EQ and CQ, you can generate creative ideas AND communicate them effectively to teams — a combination found in successful innovators and creative leaders." : results.quotients.EQ >= 70 ? "Your strong EQ helps you collaborate effectively, but developing CQ will help you contribute more innovative ideas to team discussions." : results.quotients.CQ >= 70 ? "Your strong creativity generates ideas, but developing EQ will help you sell those ideas and build the relationships needed to implement them." : "Developing both dimensions will significantly enhance your professional impact. Start with EQ (emotional journaling) while incorporating creative exercises."}` },
  ];

  correlations.forEach(c => {
    y = ensureSpace(doc, y, 30);
    y = subTitle(doc, c.title, y);
    y = para(doc, c.content, MARGIN, y, CONTENT_W);
    y += 4;
  });

  y = ensureSpace(doc, y, 25);
  y = subTitle(doc, "Final Integrated Insight", y);
  y = para(doc, `${user.name} is a ${results.disc.dominant.split("(")[0].trim().toLowerCase()} personality with ${results.mbti.type} (${mbtiInfo?.title || ""}) cognitive preferences. They demonstrate ${results.quotients.AQ >= 70 ? "strong resilience and adaptability" : "developing resilience"} combined with ${results.quotients.EQ >= 70 ? "high emotional intelligence" : "growing emotional awareness"}. Their ${results.learningStyle.dominant} learning style and ${results.intelligence.top2[0]} intelligence create a natural aptitude for ${results.career.top2.join(" and ")} career environments. Key growth area: ${lowest.name} development, which will have the greatest impact on overall performance.`, MARGIN, y, CONTENT_W);

  // ====================================================================
  // SECTION 9: ACTION PLAN (2 pages)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 9, "Action Plan", "Short-Term & Long-Term Development Strategies");
  y = 36;

  y = sectionTitle(doc, "Personalized Development Strategy", y);
  y = explanation(doc, "This action plan is generated by the Recommendation Engine based on your lowest scores, personality gaps, and career alignment. Each recommendation is specific, measurable, and designed for immediate implementation.", y);
  y += 3;

  y = sectionTitle(doc, "Skill Development Plan", y, GREEN);
  y = para(doc, "Based on your assessment results, the following skills have been identified as highest-priority development areas:", MARGIN, y, CONTENT_W);
  y += 2;
  y = bullets(doc, plan.skillDev.map(s => `${s}`), MARGIN + 3, y, CONTENT_W - 6);
  y += 2;
  y = para(doc, `As a ${results.learningStyle.dominant} learner, you should pursue these skills using ${results.learningStyle.dominant === "Visual" ? "video courses, visual tutorials, and diagram-based learning" : results.learningStyle.dominant === "Auditory" ? "podcasts, discussion groups, and verbal coaching" : "hands-on workshops, simulations, and practical projects"} for maximum retention and application.`, MARGIN, y, CONTENT_W);
  y += 5;

  y = sectionTitle(doc, "Daily Improvement Plan", y, BLUE);
  y = para(doc, "Consistent daily habits create compound growth. Follow this structured daily routine:", MARGIN, y, CONTENT_W);
  y += 2;
  y = bullets(doc, plan.dailyPlan, MARGIN + 3, y, CONTENT_W - 6);
  y += 5;

  y = sectionTitle(doc, "Behaviour Improvement Plan", y, PURPLE);
  y = para(doc, "Behavioral changes require awareness and deliberate practice. Focus on these areas:", MARGIN, y, CONTENT_W);
  y += 2;
  y = bullets(doc, plan.behaviourPlan, MARGIN + 3, y, CONTENT_W - 6);
  y += 5;

  y = sectionTitle(doc, "Career Development Strategy", y, TEAL);
  y = subTitle(doc, "Short-Term Actions (Next 3-6 Months)", y);
  y = bullets(doc, [
    `Identify 3-5 ${results.career.top2[0]} roles in your target industry and study their requirements`,
    `Build a portfolio or track record demonstrating your ${results.intelligence.top2[0]} intelligence`,
    `Seek mentorship from someone in a ${results.career.suggestedRoles[0]} role`,
    `Complete one certification aligned with ${results.career.top2[0]} career path`,
    `Practice ${lowest.name.split("(")[0].trim()} improvement exercises daily`,
  ], MARGIN + 3, y, CONTENT_W - 6);
  y += 3;

  y = subTitle(doc, "Medium-Term Goals (6-18 Months)", y);
  y = bullets(doc, [
    `Transition into a ${results.career.suggestedRoles[0]} or similar role`,
    `Build expertise combining ${results.intelligence.top2[0]} and ${results.intelligence.top2[1]} intelligences`,
    `Develop ${results.mbti.type.includes("E") ? "leadership" : "subject-matter expertise"} positioning`,
    `Grow your professional network in ${results.career.top2.join(" and ")} industries`,
  ], MARGIN + 3, y, CONTENT_W - 6);
  y += 3;

  y = subTitle(doc, "Personalized Recommendations Based on Your Profile", y);
  y = para(doc, `Given your ${results.disc.dominant} personality and ${results.mbti.type} type, your most effective development approach is ${results.mbti.type.includes("E") ? "social and collaborative — join groups, attend networking events, and learn through discussion" : "structured and self-directed — use online courses, books, and focused independent study"}. Your ${results.learningStyle.dominant} learning style means you should ${results.learningStyle.dominant === "Visual" ? "prioritize visual learning resources and create visual summaries of your progress" : results.learningStyle.dominant === "Auditory" ? "use podcasts, audiobooks, and find a study partner or mentor for regular discussions" : "seek hands-on projects, internships, and practical application opportunities"}.`, MARGIN, y, CONTENT_W);

  // ====================================================================
  // SECTION 10: CAREER ROADMAP (2 pages)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 10, "Career Roadmap", `${results.career.top2.join(" & ")} Career Path`);
  y = 36;

  y = sectionTitle(doc, "Your Personalized Career Trajectory", y);
  y = explanation(doc, "This career roadmap is generated by combining your RIASEC career mapping, DISC personality, MBTI type, intelligence profile, and quotient scores. It provides a structured pathway from your current position to long-term career success.", y);
  y += 3;

  y = sectionTitle(doc, "Phase 1: Foundation (0-2 Years)", y, GREEN);
  y = bullets(doc, roadmap.shortTerm.map(s => `${s}`), MARGIN + 3, y, CONTENT_W - 6);
  y += 2;
  y = para(doc, `During this phase, focus on building foundational skills in ${results.career.top2[0]} while exploring ${results.career.top2[1]} opportunities. Your ${results.learningStyle.dominant} learning style will help you absorb industry knowledge efficiently. Leverage your ${results.intelligence.top2[0]} intelligence as your primary competitive advantage.`, MARGIN, y, CONTENT_W);
  y += 5;

  y = sectionTitle(doc, "Phase 2: Growth (2-5 Years)", y, BLUE);
  y = bullets(doc, [
    `Advance to mid-level positions in ${results.career.suggestedRoles[0]} or related roles`,
    `Develop cross-functional skills combining ${results.career.top2[0]} and ${results.career.top2[1]}`,
    `Build leadership capabilities aligned with your ${results.mbti.type} personality`,
    `Create a personal brand as a ${results.intelligence.top2[0]}-focused professional`,
    `Seek project leadership opportunities to demonstrate your ${birdName} qualities`,
  ], MARGIN + 3, y, CONTENT_W - 6);
  y += 2;
  y = para(doc, `In this phase, your ${discKey} personality will be your greatest asset. As a ${birdName}, you naturally ${discKey === "D" ? "drive results and lead teams" : discKey === "I" ? "build relationships and inspire others" : discKey === "S" ? "create stability and support team growth" : "ensure quality and optimize processes"}. Use this to establish yourself as a valued contributor and emerging leader.`, MARGIN, y, CONTENT_W);
  y += 5;

  y = sectionTitle(doc, "Phase 3: Leadership (5-10 Years)", y, PURPLE);
  y = bullets(doc, roadmap.longTerm.map(s => `${s}`), MARGIN + 3, y, CONTENT_W - 6);
  y += 2;
  y = para(doc, `Long-term, your combination of ${results.disc.dominant} personality, ${results.mbti.type} cognitive style, and ${results.intelligence.top2.join("/")} intelligence positions you for senior roles in ${results.career.top2.join(" or ")} domains. Consider ${results.mbti.type.includes("E") ? "executive leadership, consulting, or entrepreneurship" : "technical leadership, research direction, or specialized consulting"}.`, MARGIN, y, CONTENT_W);
  y += 5;

  y = sectionTitle(doc, "Industry Path", y, TEAL);
  y = para(doc, roadmap.industryPath, MARGIN, y, CONTENT_W);
  y += 3;
  y = para(doc, `Given the current market trends and your personality-career alignment, the most promising industries for your profile include: ${careerTypeDetails[results.career.top2[0]]?.industries?.slice(0, 3).join(", ")} (from your ${results.career.top2[0]} aptitude) and ${careerTypeDetails[results.career.top2[1]]?.industries?.slice(0, 3).join(", ")} (from your ${results.career.top2[1]} aptitude). These industries value the combination of ${results.intelligence.top2[0]} intelligence and ${results.disc.dominant.split("(")[0].trim()} personality traits.`, MARGIN, y, CONTENT_W);
  y += 5;

  // Brain Dominance for employees
  if (user.role === "employee") {
    y = ensureSpace(doc, y, 30);
    y = sectionTitle(doc, "Brain Dominance Analysis", y);
    y = boldLabel(doc, "Left Brain (Logical): ", `${results.brainDominance.left}%`, y);
    y = boldLabel(doc, "Right Brain (Creative): ", `${results.brainDominance.right}%`, y);
    y += 2;
    y = para(doc, results.brainDominance.left > results.brainDominance.right
      ? `You are predominantly left-brained (${results.brainDominance.left}%), indicating strong logical, analytical, and systematic thinking. This aligns with your ${results.intelligence.top2.includes("Logical") ? "strong Logical intelligence" : "analytical tendencies"} and supports career paths in ${results.career.top2[0]}.`
      : `You are predominantly right-brained (${results.brainDominance.right}%), indicating strong creative, intuitive, and artistic thinking. This aligns with your ${results.intelligence.top2.includes("Musical") || results.intelligence.top2.includes("Spatial") ? "creative intelligences" : "innovative tendencies"} and supports career paths requiring imagination and vision.`, MARGIN, y, CONTENT_W);
  }

  // ====================================================================
  // FINAL PAGE — CONCLUSION
  // ====================================================================
  y = forceNewPage(doc);
  doc.setFillColor(...DARK); doc.rect(0, 0, pw, PH, "F");
  doc.setTextColor(255, 255, 255);

  doc.setFontSize(28); doc.setFont("helvetica", "bold");
  doc.text("PERFY", pw / 2, 50, { align: "center" });
  doc.setFontSize(12); doc.setFont("helvetica", "normal");
  doc.text("From Effort to Impact", pw / 2, 60, { align: "center" });

  doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.5);
  doc.line(pw / 2 - 30, 68, pw / 2 + 30, 68);

  doc.setFontSize(16); doc.setFont("helvetica", "bold");
  doc.text("Report Summary", pw / 2, 85, { align: "center" });

  doc.setFontSize(11); doc.setFont("helvetica", "normal");
  const summaryLines = [
    `Name: ${user.name}`,
    `DISC: ${results.disc.dominant} (${birdName})`,
    `MBTI: ${results.mbti.type} (${mbtiInfo?.title || ""})`,
    `Strongest Quotient: ${highest.name} (${highest.val}%)`,
    `Growth Area: ${lowest.name} (${lowest.val}%)`,
    `Learning Style: ${results.learningStyle.dominant}`,
    `Top Intelligence: ${results.intelligence.top2.join(" & ")}`,
    `Career Direction: ${results.career.top2.join(" & ")}`,
  ];
  let sy = 100;
  summaryLines.forEach(line => { doc.text(line, pw / 2, sy, { align: "center" }); sy += 8; });

  sy += 10;
  doc.setFontSize(10);
  doc.text("Key Takeaways:", pw / 2, sy, { align: "center" }); sy += 8;
  const takeaways = [
    `You are a ${birdName} — ${discInfo.brief}`,
    `Your ${results.mbti.type} type makes you a natural ${mbtiInfo?.title || "unique personality"}`,
    `Focus development on ${lowest.name} for maximum growth impact`,
    `Pursue ${results.career.top2.join(" and ")} career paths for optimal fit`,
  ];
  takeaways.forEach(t => {
    const lines = doc.splitTextToSize(`✓  ${t}`, pw - 50);
    doc.text(lines, pw / 2, sy, { align: "center" }); sy += lines.length * 6;
  });

  sy += 15;
  doc.setFontSize(11); doc.setFont("helvetica", "italic");
  doc.text('"Data alone does not create value."', pw / 2, sy, { align: "center" }); sy += 7;
  doc.text('"Interpretation creates understanding."', pw / 2, sy, { align: "center" }); sy += 7;
  doc.text('"Action creates transformation."', pw / 2, sy, { align: "center" }); sy += 15;

  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text("This report was generated by Perfy's Deep Interpretation System", pw / 2, sy, { align: "center" }); sy += 5;
  doc.text("Powered by Interpretation Engine • Correlation Engine • Recommendation Engine", pw / 2, sy, { align: "center" });

  doc.setTextColor(0, 0, 0);

  // ====================================================================
  // FOOTER ON ALL PAGES
  // ====================================================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.getHeight();
    doc.setFillColor(245, 245, 245); doc.rect(0, ph - FOOTER_H, pw, FOOTER_H, "F");
    doc.setFontSize(7); doc.setTextColor(...GRAY);
    doc.text(`PERFY  •  ${user.name}  •  Page ${i} of ${totalPages}`, pw / 2, ph - 9, { align: "center" });
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}  •  Confidential`, pw / 2, ph - 5, { align: "center" });
    doc.setTextColor(0, 0, 0);
  }

  doc.save(`Perfy_${user.name.replace(/\s+/g, "_")}_Deep_Report.pdf`);
}
