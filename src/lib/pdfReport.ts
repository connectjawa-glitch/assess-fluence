// Perfy — 20-Page Deep Interpretation PDF Report Generator
import jsPDF from "jspdf";
import type { User } from "@/lib/auth";
import type { AssessmentResults } from "@/lib/scoring";
import {
  discInterpretations, mbtiInterpretations, intelligenceDescriptions,
  learningStyleDetails, quotientInterpretations, careerTypeDetails,
  generateCorrelationInsight, generateActionPlan, generateCareerRoadmap
} from "@/lib/interpretations";
import { drawRadarChart, drawPieChart, drawHBarChart, drawComparisonBars, drawGauge } from "@/lib/pdfCharts";

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
  const lines = doc.splitTextToSize(text, CONTENT_W);
  doc.text(lines[0], MARGIN, y);
  doc.setDrawColor(...color); doc.setLineWidth(0.5);
  doc.line(MARGIN, y + 1.5, MARGIN + Math.min(doc.getTextWidth(lines[0]), CONTENT_W), y + 1.5);
  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  return y + 8;
}

function subTitle(doc: jsPDF, text: string, y: number): number {
  y = ensureSpace(doc, y, 10);
  doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...BLUE);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  doc.text(lines, MARGIN, y);
  doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0); doc.setFontSize(10);
  return y + lines.length * 5 + 2;
}

function subSubTitle(doc: jsPDF, text: string, y: number): number {
  y = ensureSpace(doc, y, 8);
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(60, 60, 60);
  const lines = doc.splitTextToSize(text, CONTENT_W - 3);
  doc.text(lines, MARGIN + 3, y);
  doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
  return y + lines.length * 4.5 + 2;
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
  const availW = CONTENT_W - labelW - (x - MARGIN);
  const lines = doc.splitTextToSize(value, availW);
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
  const labelLines = doc.splitTextToSize(`${label}:`, 48);
  doc.text(labelLines, MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${value}%`, MARGIN + 50, y);
  const barX = MARGIN + 60;
  doc.setFillColor(230, 230, 230); doc.roundedRect(barX, y - 3.5, barW, 5, 1, 1, "F");
  doc.setFillColor(...color); doc.roundedRect(barX, y - 3.5, Math.max(2, (value / 100) * barW), 5, 1, 1, "F");
  doc.setFontSize(10);
  return y + 8;
}

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

// Decorative box for key insights
function insightBox(doc: jsPDF, text: string, y: number, color: readonly [number, number, number] = BLUE): number {
  y = ensureSpace(doc, y, 25);
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(text, CONTENT_W - 16);
  const boxH = lines.length * 4.5 + 8;
  // Light background
  const lightBg: [number, number, number] = [
    Math.round(color[0] * 0.08 + 255 * 0.92),
    Math.round(color[1] * 0.08 + 255 * 0.92),
    Math.round(color[2] * 0.08 + 255 * 0.92),
  ];
  doc.setFillColor(...lightBg);
  doc.roundedRect(MARGIN, y - 3, CONTENT_W, boxH, 2, 2, "F");
  // Left accent bar
  doc.setFillColor(...color);
  doc.rect(MARGIN, y - 3, 2, boxH, "F");
  // Text
  doc.setTextColor(40, 40, 40);
  let ty = y + 2;
  for (const line of lines) { doc.text(line, MARGIN + 8, ty); ty += 4.5; }
  doc.setTextColor(0, 0, 0); doc.setFontSize(10);
  return y + boxH + 3;
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

  // Quotient gauges on cover
  const gaugeY = 190;
  const gaugeColors: (readonly [number, number, number])[] = [BLUE, GREEN, AMBER, PURPLE];
  allScores.forEach((s, i) => {
    const gx = MARGIN + 22 + i * 44;
    drawGauge(doc, gx, gaugeY, 14, s.val, s.name.split("(")[0].trim(), [...gaugeColors[i]] as [number, number, number]);
  });

  doc.setFontSize(9);
  const quickStats = [
    `DISC: ${discKey} (${birdName})`, `MBTI: ${results.mbti.type}`,
    `Style: ${results.learningStyle.dominant}`, `Career: ${results.career.top2.join(" & ")}`
  ];
  doc.text(quickStats.join("   •   "), pw / 2, 220, { align: "center", maxWidth: pw - 30 });

  doc.setFontSize(8);
  doc.text("This report contains 10 detailed sections across 20+ pages", pw / 2, PH - 30, { align: "center" });
  doc.text("Data -> Meaning -> Insight -> Action", pw / 2, PH - 24, { align: "center" });
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
  doc.text("Each section provides: Explanation -> Meaning -> Insight -> Actionable Guidance", MARGIN, y); y += 5;
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
  y = explanation(doc, `MBTI stands for Myers-Briggs Type Indicator, a personality framework with 16 types based on 4 preference pairs: E/I (Extraversion vs Introversion), S/N (Sensing vs Intuition), T/F (Thinking vs Feeling), J/P (Judging vs Perceiving). Your type ${results.mbti.type} means: ${results.mbti.type.split("").map((l: string) => l === "E" ? "Extraverted" : l === "I" ? "Introverted" : l === "S" ? "Sensing" : l === "N" ? "Intuitive" : l === "T" ? "Thinking" : l === "F" ? "Feeling" : l === "J" ? "Judging" : "Perceiving").join(", ")}.`, y);

  y = boldLabel(doc, "Learning Style: ", results.learningStyle.dominant, y);
  y = explanation(doc, `Learning style identifies how you absorb information best. The three types are Visual (seeing), Auditory (hearing), and Kinesthetic (doing). Your dominant style "${results.learningStyle.dominant}" means ${lsInfo.howLearns}`, y);

  y = boldLabel(doc, "Top Intelligence: ", results.intelligence.top2.join(" & "), y);
  y = boldLabel(doc, "Career Mapping: ", `${results.career.top2.join(" & ")} -> ${results.career.suggestedRoles.slice(0, 3).join(", ")}`, y);
  if (user.role === "employee") y = boldLabel(doc, "Brain Dominance: ", `Left ${results.brainDominance.left}% / Right ${results.brainDominance.right}%`, y);
  y += 3;

  // ★ RADAR CHART: Overall Profile Snapshot
  y = ensureSpace(doc, y, 80);
  y = sectionTitle(doc, "Overall Profile Radar", y);
  const profileLabels = ["IQ", "EQ", "AQ", "CQ", "DISC", "Career"];
  const profileValues = [
    results.quotients.IQ, results.quotients.EQ, results.quotients.AQ, results.quotients.CQ,
    Math.max(...Object.values(results.disc.percentages)),
    Math.max(...Object.values(results.career.percentages))
  ];
  drawRadarChart(doc, pw / 2, y + 32, 28, profileLabels, profileValues, {
    title: "Overall Profile Snapshot", fillColor: [...BLUE] as [number, number, number]
  });
  y += 75;

  y = insightBox(doc, `Key Insight: Your highest quotient is ${highest.name} at ${highest.val}%, your primary competitive advantage. Your growth area is ${lowest.name} at ${lowest.val}%. Focused development here will have the greatest impact.`, y, GREEN);

  y = sectionTitle(doc, "Overall Profile Summary", y);
  y = para(doc, `${user.name} is a ${results.disc.dominant} personality, represented by the ${birdName} archetype. In the MBTI framework, they are classified as ${results.mbti.type} (${mbtiInfo?.title || ""}), which means they are ${mbtiInfo?.description?.split(".")[0] || "a unique personality type"}.`, MARGIN, y, CONTENT_W);
  y += 2;
  y = para(doc, `As a ${results.learningStyle.dominant} learner with strong ${results.intelligence.top2.join(" and ")} intelligence, ${user.name} demonstrates ${results.quotients.EQ >= 70 ? "strong emotional awareness" : "developing emotional skills"} (EQ: ${results.quotients.EQ}%) and ${results.quotients.IQ >= 70 ? "solid analytical capability" : "growing analytical ability"} (IQ: ${results.quotients.IQ}%).`, MARGIN, y, CONTENT_W);
  y += 2;
  y = para(doc, `Their career aptitude aligns with ${results.career.top2.join(" and ")} domains in the RIASEC model, suggesting optimal fit for roles such as ${results.career.suggestedRoles.join(", ")}.`, MARGIN, y, CONTENT_W);

  // ====================================================================
  // SECTION 2: PERSONALITY INTERPRETATION (DISC + MBTI)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 2, "Personality Interpretation", "DISC Personality + MBTI Deep Analysis");
  y = 36;

  y = sectionTitle(doc, "DISC Personality Analysis", y);
  y = explanation(doc, "DISC is a widely-used behavioral assessment developed from the work of psychologist William Moulton Marston. It measures four behavioral dimensions: D (Dominance) = how you handle problems, I (Influence) = how you interact with others, S (Steadiness) = your patience and supportiveness, C (Compliance) = how you approach rules and quality.", y);
  y += 2;

  y = subTitle(doc, `Your DISC Type: ${discKey} — ${results.disc.dominant}`, y);
  y = para(doc, `You are a ${birdLabel}. ${discKey === "D" ? "Eagles are bold, decisive leaders who take charge and drive results." : discKey === "I" ? "Parrots are enthusiastic, social communicators who energize teams." : discKey === "S" ? "Doves are calm, supportive team players who value harmony." : "Owls are analytical, detail-oriented thinkers who ensure accuracy."}`, MARGIN, y, CONTENT_W);
  y += 3;

  // ★ PIE CHART: DISC Distribution
  y = ensureSpace(doc, y, 75);
  const discLabels = ["D (Dominance)", "I (Influence)", "S (Steadiness)", "C (Compliance)"];
  const discValues = [results.disc.percentages.D, results.disc.percentages.I, results.disc.percentages.S, results.disc.percentages.C];
  drawPieChart(doc, pw / 4, y + 28, 22, discLabels, discValues, {
    title: "DISC Distribution",
    colors: [[239, 68, 68], [245, 158, 11], [34, 197, 94], [59, 130, 246]]
  });

  // ★ RADAR CHART: DISC Profile alongside pie
  drawRadarChart(doc, pw * 3 / 4, y + 28, 22, ["D", "I", "S", "C"], discValues, {
    title: "DISC Radar Profile",
    fillColor: [...BLUE] as [number, number, number]
  });
  y += 72;

  y = subTitle(doc, "Why You Are This Type", y);
  y = para(doc, `Based on your assessment responses, your ${discKey} dimension scored highest at ${results.disc.percentages[discKey]}%. This means your natural behavioral tendency is to ${discKey === "D" ? "take charge, make quick decisions, and drive toward results" : discKey === "I" ? "connect with people, communicate enthusiastically, and build networks" : discKey === "S" ? "support others, maintain stability, and create harmony" : "analyze carefully, follow procedures, and ensure quality"}.`, MARGIN, y, CONTENT_W);
  y += 3;

  y = subTitle(doc, "DISC Dimension Scores", y);
  const discExplainFull: Record<string, string> = {
    D: "Dominance (Eagle) — Measures assertiveness, problem-solving drive, and results orientation.",
    I: "Influence (Parrot) — Measures social interaction, persuasion, and enthusiasm.",
    S: "Steadiness (Dove) — Measures patience, persistence, and supportiveness.",
    C: "Compliance (Owl) — Measures attention to detail, rules adherence, and quality focus.",
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
  y = bullets(doc, discInfo.traits.map((t, i) => `${t} — This trait manifests through ${i === 0 ? "your group dynamics" : i === 1 ? "how you handle pressure" : i === 2 ? "your decision-making" : i === 3 ? "your goal-setting" : "your problem-solving"}.`), MARGIN + 3, y, CONTENT_W - 6);
  y += 2;

  y = subTitle(doc, "Strengths — Natural Advantages", y);
  y = bullets(doc, discInfo.strengths.map(s => `${s} — Gives you a competitive edge professionally.`), MARGIN + 3, y, CONTENT_W - 6);
  y += 2;

  y = subTitle(doc, "Risks & Limitations", y);
  y = bullets(doc, discInfo.risks.map(r => `${r} — Awareness helps you manage this proactively.`), MARGIN + 3, y, CONTENT_W - 6);
  y += 2;

  y = subTitle(doc, "Workplace Fit", y);
  y = para(doc, discInfo.workFit, MARGIN, y, CONTENT_W);
  y += 2;

  // -- MBTI Part --
  y = ensureSpace(doc, y, 60);
  y = divider(doc, y);
  y = sectionTitle(doc, `MBTI Personality: ${results.mbti.type} — ${mbtiInfo?.title || ""}`, y);
  y = explanation(doc, "MBTI (Myers-Briggs Type Indicator) was developed by Isabel Briggs Myers and Katharine Briggs based on Carl Jung's theory. It categorizes personality into 16 types using 4 preference pairs.", y);
  y += 2;

  // ★ COMPARISON BARS: MBTI Dimensions
  y = ensureSpace(doc, y, 55);
  const mbtiPairs = [
    { labelA: "E (Extraversion)", valA: results.mbti.scores.E, labelB: "I (Introversion)", valB: results.mbti.scores.I },
    { labelA: "S (Sensing)", valA: results.mbti.scores.S, labelB: "N (Intuition)", valB: results.mbti.scores.N },
    { labelA: "T (Thinking)", valA: results.mbti.scores.T, labelB: "F (Feeling)", valB: results.mbti.scores.F },
    { labelA: "J (Judging)", valA: results.mbti.scores.J, labelB: "P (Perceiving)", valB: results.mbti.scores.P },
  ];
  y = drawComparisonBars(doc, MARGIN, y, CONTENT_W, mbtiPairs, { title: "MBTI Preference Pairs" });
  y += 3;

  const mbtiFullExplain: Record<string, string> = {
    E: "E = Extraversion — You gain energy from social interaction. You think out loud and prefer action.",
    I: "I = Introversion — You gain energy from solitude and reflection. You think before speaking.",
    S: "S = Sensing — You focus on concrete facts and practical information. You trust experience.",
    N: "N = Intuition — You focus on patterns and possibilities. You trust imagination.",
    T: "T = Thinking — You decide based on logic and objective analysis.",
    F: "F = Feeling — You decide based on personal values and how it affects people.",
    J: "J = Judging — You prefer structure, planning, and organization.",
    P: "P = Perceiving — You prefer flexibility and keeping options open.",
  };

  const pairs = [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]] as const;
  pairs.forEach(([a, b]) => {
    y = ensureSpace(doc, y, 18);
    const aS = results.mbti.scores[a], bS = results.mbti.scores[b];
    const winner = aS >= bS ? a : b;
    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    const pairText = `${a} vs ${b}:  ${a} = ${aS}  |  ${b} = ${bS}  ->  You are ${winner}`;
    const pairLines = doc.splitTextToSize(pairText, CONTENT_W);
    doc.text(pairLines, MARGIN, y);
    doc.setFont("helvetica", "normal"); y += pairLines.length * 5;
    y = explanation(doc, mbtiFullExplain[a], y);
    y = explanation(doc, mbtiFullExplain[b], y);
    y += 2;
  });

  y = subTitle(doc, `Why You Are ${results.mbti.type}`, y);
  y = para(doc, `Your MBTI type ${results.mbti.type} is determined by combining your four dominant preferences. Together, these create the "${mbtiInfo?.title || ""}" personality archetype.`, MARGIN, y, CONTENT_W);
  y += 3;

  if (mbtiInfo) {
    y = subTitle(doc, "Core Personality Description", y);
    y = para(doc, mbtiInfo.description, MARGIN, y, CONTENT_W);
    y += 3;

    y = subTitle(doc, "Work Style", y);
    y = para(doc, mbtiInfo.workStyle, MARGIN, y, CONTENT_W);
    y += 3;

    y = subTitle(doc, "Strengths in Teams", y);
    y = para(doc, mbtiInfo.teamStrengths, MARGIN, y, CONTENT_W);
    y += 3;

    y = subTitle(doc, "Weakness Patterns", y);
    y = para(doc, mbtiInfo.weaknesses, MARGIN, y, CONTENT_W);
    y += 3;

    y = subTitle(doc, "Leadership Style", y);
    y = para(doc, mbtiInfo.leadership, MARGIN, y, CONTENT_W);
    y += 3;

    y = subTitle(doc, "Communication Style", y);
    y = para(doc, mbtiInfo.communication, MARGIN, y, CONTENT_W);
    y += 3;

    y = subTitle(doc, "Ideal Career Directions for " + results.mbti.type, y);
    y = bullets(doc, mbtiInfo.careers.map(c => `${c} — aligned with your ${results.mbti.type} personality`), MARGIN + 3, y, CONTENT_W - 6);
  }

  // ====================================================================
  // SECTION 3: INTELLIGENCE ANALYSIS (2 pages)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 3, "Intelligence Analysis", "IQ  •  EQ  •  AQ  •  CQ — Detailed Interpretation");
  y = 36;

  y = sectionTitle(doc, "Understanding the Four Quotients", y);
  y = explanation(doc, "Intelligence is not a single measure. Modern psychology recognizes multiple dimensions. The four quotients measured here represent different aspects of cognitive and emotional capability.", y);
  y += 2;

  // ★ GAUGE CHARTS: Four Quotients
  y = ensureSpace(doc, y, 45);
  y = subTitle(doc, "Quotient Scores at a Glance", y);
  const qColors: (readonly [number, number, number])[] = [BLUE, GREEN, AMBER, PURPLE];
  allScores.forEach((s, i) => {
    const gx = MARGIN + 22 + i * 42;
    drawGauge(doc, gx, y + 18, 15, s.val, s.name.split("(")[0].trim(), [...qColors[i]] as [number, number, number]);
  });
  y += 42;

  // ★ RADAR CHART: Quotient Radar
  y = ensureSpace(doc, y, 75);
  drawRadarChart(doc, pw / 2, y + 30, 26,
    ["IQ", "EQ", "AQ", "CQ"],
    [results.quotients.IQ, results.quotients.EQ, results.quotients.AQ, results.quotients.CQ],
    { title: "Quotient Radar Profile", fillColor: [...TEAL] as [number, number, number] }
  );
  y += 70;

  y = insightBox(doc, `You are a "${highest.val >= 70 ? "high-performer" : "developing thinker"}" with your strongest dimension in ${highest.name} (${highest.val}%). Primary growth area: ${lowest.name} (${lowest.val}%).`, y, BLUE);
  y += 3;

  // Each quotient in detail
  (["IQ", "EQ", "AQ", "CQ"] as const).forEach(q => {
    const score = results.quotients[q];
    const interp = quotientInterpretations[q](score);
    const fullNames: Record<string, string> = {
      IQ: "Intelligence Quotient — Analytical Ability & Problem-Solving",
      EQ: "Emotional Quotient — Emotional Awareness & Relationships",
      AQ: "Adversity Quotient — Stress, Failure & Change Handling",
      CQ: "Creative Quotient — Innovation & Creative Problem-Solving"
    };
    const whyMatters: Record<string, string> = {
      IQ: "IQ measures your capacity for logical reasoning, abstract thinking, and problem-solving. It indicates how quickly you process complex information and identify patterns.",
      EQ: "EQ measures your ability to recognize, understand, and manage your own emotions, as well as recognize and influence the emotions of others. High EQ is the strongest predictor of leadership effectiveness.",
      AQ: "AQ measures your resilience — how you respond to adversity, setbacks, and change. It determines whether you see obstacles as threats or opportunities.",
      CQ: "CQ measures your capacity for creative thinking, innovation, and generating novel solutions. It reflects your ability to think outside conventional frameworks.",
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
  y = explanation(doc, "Learning style theory, based on the VAK model, identifies three primary channels: Visual (seeing and reading), Auditory (hearing and discussing), and Kinesthetic (touching and doing). Your dominant style indicates the channel most efficient for you.", y);
  y += 2;

  // ★ PIE CHART: Learning Style Distribution
  y = ensureSpace(doc, y, 75);
  const lsLabels = Object.keys(results.learningStyle.percentages);
  const lsValues = Object.values(results.learningStyle.percentages);
  drawPieChart(doc, pw / 4, y + 28, 22, lsLabels, lsValues, {
    title: "Learning Style Distribution",
    colors: [[59, 130, 246], [34, 197, 94], [245, 158, 11]]
  });

  // ★ RADAR alongside
  drawRadarChart(doc, pw * 3 / 4, y + 28, 22, lsLabels, lsValues, {
    title: "Learning Style Radar",
    fillColor: [...GREEN] as [number, number, number]
  });
  y += 72;

  y = subTitle(doc, `Your Dominant Style: ${results.learningStyle.dominant}`, y);
  y = para(doc, `You are primarily a ${results.learningStyle.dominant} learner, scoring ${results.learningStyle.percentages[results.learningStyle.dominant]}%. This means ${lsInfo.howLearns}`, MARGIN, y, CONTENT_W);
  y += 3;

  y = subTitle(doc, "Why This Matters", y);
  y = para(doc, `Understanding your learning style directly impacts how efficiently you absorb and retain information. When methods align with your ${results.learningStyle.dominant} preference, you learn faster and perform better.`, MARGIN, y, CONTENT_W);
  y += 3;

  y = subTitle(doc, `How ${user.name} Learns Best`, y);
  y = para(doc, lsInfo.howLearns, MARGIN, y, CONTENT_W);
  y += 3;

  y = subTitle(doc, "Best Learning Methods for You", y);
  y = bullets(doc, lsInfo.bestMethods.map(m => `${m} — highly effective for your ${results.learningStyle.dominant} style`), MARGIN + 3, y, CONTENT_W - 6);
  y += 3;

  y = subTitle(doc, "Methods to Avoid", y);
  y = bullets(doc, lsInfo.avoid.map(m => `${m} — conflicts with your natural preference`), MARGIN + 3, y, CONTENT_W - 6);
  y += 3;

  y = subTitle(doc, "Practical Techniques for Daily Use", y);
  y = bullets(doc, lsInfo.techniques, MARGIN + 3, y, CONTENT_W - 6);
  y += 3;

  y = subTitle(doc, "Your Secondary Learning Channels", y);
  const otherStyles = Object.entries(results.learningStyle.percentages).filter(([k]) => k !== results.learningStyle.dominant).sort((a, b) => b[1] - a[1]);
  otherStyles.forEach(([style, pct]) => {
    const info = learningStyleDetails[style];
    y = ensureSpace(doc, y, 20);
    doc.setFont("helvetica", "bold"); doc.text(`${style}: ${pct}%`, MARGIN, y); doc.setFont("helvetica", "normal"); y += 5;
    y = para(doc, `${info.howLearns} Incorporating ${style.toLowerCase()} elements enhances overall learning.`, MARGIN, y, CONTENT_W);
    y += 3;
  });

  // ====================================================================
  // SECTION 5: MULTIPLE INTELLIGENCE (2 pages)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 5, "Multiple Intelligence Analysis", `Top: ${results.intelligence.top2.join(" & ")}`);
  y = 36;

  y = sectionTitle(doc, "Howard Gardner's Theory of Multiple Intelligences", y);
  y = explanation(doc, "Developed by Harvard psychologist Howard Gardner in 1983, this framework identifies 8 distinct types of intelligence beyond traditional IQ. Every person has all 8, but each person's unique profile creates their competitive advantage.", y);
  y += 2;

  // ★ HORIZONTAL BAR CHART: All Intelligences
  y = ensureSpace(doc, y, 85);
  const sortedIntel = Object.entries(results.intelligence.percentages).sort((a, b) => b[1] - a[1]);
  const intelLabels = sortedIntel.map(([k]) => k);
  const intelValues = sortedIntel.map(([, v]) => v);
  y = drawHBarChart(doc, MARGIN, y, CONTENT_W, intelLabels, intelValues, {
    title: "Multiple Intelligence Scores",
    colors: sortedIntel.map(([k]) => results.intelligence.top2.includes(k) ? [...PURPLE] as [number, number, number] : [...GRAY] as [number, number, number])
  }) || y + 75;
  y += 5;

  // ★ RADAR CHART: Intelligence Radar
  y = ensureSpace(doc, y, 75);
  drawRadarChart(doc, pw / 2, y + 32, 28, intelLabels.slice(0, 8), intelValues.slice(0, 8), {
    title: "Intelligence Radar Profile",
    fillColor: [...PURPLE] as [number, number, number]
  });
  y += 75;

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
    y = para(doc, `Your strong ${intel} intelligence (${results.intelligence.percentages[intel]}%) combined with your ${results.learningStyle.dominant} learning style and ${results.mbti.type} personality creates a powerful foundation for career success.`, MARGIN, y, CONTENT_W);
    y += 4;
  });

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
  y = explanation(doc, "Developed by psychologist John Holland, the RIASEC model categorizes personalities and work environments into 6 types: R = Realistic (practical), I = Investigative (analytical), A = Artistic (creative), S = Social (helping), E = Enterprising (leading), C = Conventional (organizing).", y);
  y += 2;

  // ★ HORIZONTAL BAR CHART: Career Types
  y = ensureSpace(doc, y, 65);
  const careerSorted = Object.entries(results.career.percentages).sort((a, b) => b[1] - a[1]);
  const careerLabels = careerSorted.map(([k]) => k);
  const careerValues = careerSorted.map(([, v]) => v);
  y = drawHBarChart(doc, MARGIN, y, CONTENT_W, careerLabels, careerValues, {
    title: "RIASEC Career Type Scores",
    colors: careerSorted.map(([k]) => results.career.top2.includes(k) ? [...TEAL] as [number, number, number] : [...GRAY] as [number, number, number])
  }) || y + 60;
  y += 3;

  // ★ RADAR CHART: Career Fit Radar
  y = ensureSpace(doc, y, 75);
  drawRadarChart(doc, pw / 2, y + 30, 26, careerLabels, careerValues, {
    title: "Career Fit Radar",
    fillColor: [...TEAL] as [number, number, number]
  });
  y += 70;

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
    y = para(doc, `Your ${discKey} (${birdName}) DISC personality and ${results.mbti.type} MBTI type align well with ${career} career environments.`, MARGIN, y, CONTENT_W);
    y += 2;

    y = subSubTitle(doc, "Suitable Industries", y);
    y = bullets(doc, info.industries.map(ind => `${ind} — matches your profile`), MARGIN + 3, y, CONTENT_W - 6);
    y += 2;

    y = subSubTitle(doc, "Recommended Job Roles", y);
    y = bullets(doc, info.roles, MARGIN + 3, y, CONTENT_W - 6);
    y += 2;

    y = subSubTitle(doc, "Career Growth Path", y);
    y = para(doc, info.growthPath, MARGIN, y, CONTENT_W);
    y += 4;
  });

  // ====================================================================
  // SECTION 7: SWOT ANALYSIS (2 pages)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 7, "SWOT Analysis", "Strengths, Weaknesses, Opportunities & Threats");
  y = 36;

  y = sectionTitle(doc, "Understanding SWOT", y);
  y = explanation(doc, "SWOT stands for Strengths, Weaknesses, Opportunities, and Threats. Strengths and Weaknesses are internal factors (within your control), while Opportunities and Threats are external factors.", y);
  y += 3;

  const swotColors: Record<string, readonly [number, number, number]> = {
    "STRENGTHS": GREEN, "WEAKNESSES": RED, "OPPORTUNITIES": BLUE, "THREATS": AMBER
  };

  // ★ PIE CHART: SWOT Distribution
  y = ensureSpace(doc, y, 70);
  const swotCounts = [results.swot.strengths.length, results.swot.weaknesses.length, results.swot.opportunities.length, results.swot.threats.length];
  drawPieChart(doc, pw / 2, y + 28, 22, ["Strengths", "Weaknesses", "Opportunities", "Threats"], swotCounts, {
    title: "SWOT Factor Distribution",
    colors: [[34, 197, 94], [239, 68, 68], [59, 130, 246], [245, 158, 11]]
  });
  y += 68;

  const swotData = [
    { title: "STRENGTHS — Core Competencies", items: results.swot.strengths, color: GREEN, detail: "These are your natural advantages — leverage them for career growth." },
    { title: "WEAKNESSES — Areas for Development", items: results.swot.weaknesses, color: RED, detail: "These areas need focused development. Weaknesses are growth opportunities." },
    { title: "OPPORTUNITIES — Growth Pathways", items: results.swot.opportunities, color: BLUE, detail: "Pathways for advancement aligned with your personality and career mapping." },
    { title: "THREATS — Risks to Manage", items: results.swot.threats, color: AMBER, detail: "Risks that could undermine progress if left unaddressed." },
  ];

  swotData.forEach(section => {
    y = ensureSpace(doc, y, 40);
    y = sectionTitle(doc, section.title, y, section.color as [number, number, number]);
    y = para(doc, section.detail, MARGIN, y, CONTENT_W);
    y += 2;
    section.items.forEach(item => {
      y = ensureSpace(doc, y, 18);
      const itemLines = doc.splitTextToSize(`•  ${item}`, CONTENT_W - 6);
      doc.setFont("helvetica", "bold");
      doc.text(itemLines, MARGIN + 3, y);
      doc.setFont("helvetica", "normal");
      y += itemLines.length * 5;
      let itemExplanation = "";
      if (item.includes("Analytical")) itemExplanation = "Your analytical capability lets you break down complex problems — highly valued across industries.";
      else if (item.includes("Emotional")) itemExplanation = "Emotional intelligence is the strongest predictor of leadership success.";
      else if (item.includes("Creative")) itemExplanation = "Creative thinking enables innovation — one of the most in-demand skills.";
      else if (item.includes("Resilience") || item.includes("Adaptability")) itemExplanation = "Resilience ensures consistent long-term performance in changing environments.";
      else itemExplanation = `This factor influences your development trajectory and should be considered in your growth strategy.`;
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
  y = explanation(doc, "Individual dimensions tell only part of the story. The real power comes from combining DISC + MBTI + Quotients + Intelligence + Learning Style into a holistic profile.", y);
  y += 3;

  // ★ RADAR CHART: Combined Profile
  y = ensureSpace(doc, y, 80);
  const combinedLabels = ["DISC", "MBTI", "IQ", "EQ", "AQ", "CQ", "Learning", "Career"];
  const combinedValues = [
    Math.max(...Object.values(results.disc.percentages)),
    Math.max(...Object.values(results.mbti.scores)),
    results.quotients.IQ, results.quotients.EQ, results.quotients.AQ, results.quotients.CQ,
    Math.max(...Object.values(results.learningStyle.percentages)),
    Math.max(...Object.values(results.career.percentages))
  ];
  drawRadarChart(doc, pw / 2, y + 35, 30, combinedLabels, combinedValues, {
    title: "Combined Profile Radar — All Dimensions",
    fillColor: [...PURPLE] as [number, number, number]
  });
  y += 80;

  y = subTitle(doc, "Who You Are — Integrated Personality Portrait", y);
  y = para(doc, corr.whoTheyAre, MARGIN, y, CONTENT_W);
  y += 2;
  y = para(doc, `This portrait emerges from combining your ${discKey} (${birdName}) DISC personality with your ${results.mbti.type} MBTI type.`, MARGIN, y, CONTENT_W);
  y += 4;

  y = subTitle(doc, "How You Behave — Behavioural Patterns", y);
  y = para(doc, corr.howTheyBehave, MARGIN, y, CONTENT_W);
  y += 2;
  y = para(doc, `Your behavioral patterns are shaped by your EQ (${results.quotients.EQ}%). ${results.quotients.EQ >= 70 ? "With strong emotional awareness, you naturally read social cues and maintain productive relationships." : "As your emotional awareness develops, you'll navigate social dynamics more skillfully."}`, MARGIN, y, CONTENT_W);
  y += 4;

  y = subTitle(doc, "Where You Perform Best — Optimal Environments", y);
  y = para(doc, corr.whereTheyPerformBest, MARGIN, y, CONTENT_W);
  y += 4;

  y = sectionTitle(doc, "Correlation Analysis — Connecting the Dots", y, PURPLE);

  // ★ PIE CHART: Quotient Balance
  y = ensureSpace(doc, y, 70);
  drawPieChart(doc, pw / 2, y + 28, 22,
    ["IQ", "EQ", "AQ", "CQ"],
    [results.quotients.IQ, results.quotients.EQ, results.quotients.AQ, results.quotients.CQ],
    { title: "Quotient Balance Distribution", colors: [[59, 130, 246], [34, 197, 94], [245, 158, 11], [139, 92, 246]] }
  );
  y += 68;

  const correlations = [
    { title: `DISC (${discKey}/${birdName}) + MBTI (${results.mbti.type})`, content: `Your ${discKey} personality combined with ${results.mbti.type} creates a ${discKey === "D" ? "driven, strategic" : discKey === "I" ? "enthusiastic, people-oriented" : discKey === "S" ? "supportive, patient" : "analytical, methodical"} behavioral pattern.` },
    { title: `IQ (${results.quotients.IQ}%) + AQ (${results.quotients.AQ}%) -> Performance`, content: `IQ measures analytical power while AQ measures resilience. Together they determine work performance under pressure. ${results.quotients.IQ >= 70 && results.quotients.AQ >= 70 ? "With both high, you can solve complex problems even under stress." : "Developing the weaker dimension will unlock your full potential."}` },
    { title: `Learning (${results.learningStyle.dominant}) + Intelligence (${results.intelligence.top2[0]})`, content: `Your ${results.learningStyle.dominant} learning preference combined with ${results.intelligence.top2[0]} intelligence creates an optimized learning channel for maximum efficiency.` },
    { title: `EQ (${results.quotients.EQ}%) + CQ (${results.quotients.CQ}%) -> Innovation`, content: `EQ and CQ together determine your innovative teamwork potential. ${results.quotients.EQ >= 70 && results.quotients.CQ >= 70 ? "With both high, you generate creative ideas AND communicate them effectively." : "Developing both will significantly enhance your professional impact."}` },
  ];

  correlations.forEach(c => {
    y = ensureSpace(doc, y, 30);
    y = subTitle(doc, c.title, y);
    y = para(doc, c.content, MARGIN, y, CONTENT_W);
    y += 4;
  });

  y = ensureSpace(doc, y, 25);
  y = insightBox(doc, `${user.name} is a ${results.disc.dominant.split("(")[0].trim().toLowerCase()} personality with ${results.mbti.type} (${mbtiInfo?.title || ""}) cognitive preferences. Their ${results.learningStyle.dominant} style and ${results.intelligence.top2[0]} intelligence position them for ${results.career.top2.join(" and ")} careers. Growth focus: ${lowest.name}.`, y, PURPLE);

  // ====================================================================
  // SECTION 9: ACTION PLAN (2 pages)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 9, "Action Plan", "Short-Term & Long-Term Development Strategies");
  y = 36;

  y = sectionTitle(doc, "Personalized Development Strategy", y);
  y = explanation(doc, "This action plan is generated based on your lowest scores, personality gaps, and career alignment. Each recommendation is specific, measurable, and designed for immediate implementation.", y);
  y += 3;

  // ★ RADAR: Current vs Target
  y = ensureSpace(doc, y, 80);
  const targetVals = allScores.map(s => Math.min(100, s.val + 15));
  drawRadarChart(doc, pw / 4, y + 30, 24,
    ["IQ", "EQ", "AQ", "CQ"], allScores.map(s => s.val),
    { title: "Current Scores", fillColor: [...BLUE] as [number, number, number] }
  );
  drawRadarChart(doc, pw * 3 / 4, y + 30, 24,
    ["IQ", "EQ", "AQ", "CQ"], targetVals,
    { title: "Target Scores (+15%)", fillColor: [...GREEN] as [number, number, number] }
  );
  y += 75;

  y = sectionTitle(doc, "Skill Development Plan", y, GREEN);
  y = bullets(doc, plan.skillDev, MARGIN + 3, y, CONTENT_W - 6);
  y += 2;
  y = para(doc, `As a ${results.learningStyle.dominant} learner, pursue these skills using ${results.learningStyle.dominant === "Visual" ? "video courses and visual tutorials" : results.learningStyle.dominant === "Auditory" ? "podcasts and discussion groups" : "hands-on workshops and practical projects"}.`, MARGIN, y, CONTENT_W);
  y += 5;

  y = sectionTitle(doc, "Daily Improvement Plan", y, BLUE);
  y = bullets(doc, plan.dailyPlan, MARGIN + 3, y, CONTENT_W - 6);
  y += 5;

  y = sectionTitle(doc, "Behaviour Improvement Plan", y, PURPLE);
  y = bullets(doc, plan.behaviourPlan, MARGIN + 3, y, CONTENT_W - 6);
  y += 5;

  y = sectionTitle(doc, "Career Development Strategy", y, TEAL);
  y = subTitle(doc, "Short-Term Actions (Next 3-6 Months)", y);
  y = bullets(doc, [
    `Identify 3-5 ${results.career.top2[0]} roles in your target industry`,
    `Build a portfolio demonstrating your ${results.intelligence.top2[0]} intelligence`,
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

  y = subTitle(doc, "Personalized Recommendations", y);
  y = para(doc, `Given your ${results.disc.dominant} personality and ${results.mbti.type} type, your most effective development approach is ${results.mbti.type.includes("E") ? "social and collaborative — join groups and learn through discussion" : "structured and self-directed — use online courses and focused study"}.`, MARGIN, y, CONTENT_W);

  // ====================================================================
  // SECTION 10: CAREER ROADMAP (2 pages)
  // ====================================================================
  y = forceNewPage(doc);
  addPageHeader(doc, 10, "Career Roadmap", `${results.career.top2.join(" & ")} Career Path`);
  y = 36;

  y = sectionTitle(doc, "Your Personalized Career Trajectory", y);
  y = explanation(doc, "This career roadmap combines your RIASEC mapping, DISC personality, MBTI type, intelligence profile, and quotient scores into a structured pathway.", y);
  y += 3;

  // ★ HORIZONTAL BAR: Career Fit Ranking
  y = ensureSpace(doc, y, 55);
  y = drawHBarChart(doc, MARGIN, y, CONTENT_W,
    results.career.suggestedRoles.slice(0, 5),
    results.career.suggestedRoles.slice(0, 5).map((_, i) => 95 - i * 8),
    { title: "Career Role Fit Ranking", colors: [[20, 184, 166], [59, 130, 246], [139, 92, 246], [34, 197, 94], [245, 158, 11]] }
  ) || y + 50;
  y += 5;

  y = sectionTitle(doc, "Phase 1: Foundation (0-2 Years)", y, GREEN);
  y = bullets(doc, roadmap.shortTerm, MARGIN + 3, y, CONTENT_W - 6);
  y += 2;
  y = para(doc, `Focus on building foundational skills in ${results.career.top2[0]} while exploring ${results.career.top2[1]}. Leverage your ${results.intelligence.top2[0]} intelligence as your competitive advantage.`, MARGIN, y, CONTENT_W);
  y += 5;

  y = sectionTitle(doc, "Phase 2: Growth (2-5 Years)", y, BLUE);
  y = bullets(doc, [
    `Advance to mid-level positions in ${results.career.suggestedRoles[0]} or related roles`,
    `Develop cross-functional skills combining ${results.career.top2[0]} and ${results.career.top2[1]}`,
    `Build leadership capabilities aligned with your ${results.mbti.type} personality`,
    `Create a personal brand as a ${results.intelligence.top2[0]}-focused professional`,
    `Seek project leadership to demonstrate your ${birdName} qualities`,
  ], MARGIN + 3, y, CONTENT_W - 6);
  y += 2;
  y = para(doc, `Your ${discKey} personality will be your greatest asset. As a ${birdName}, you naturally ${discKey === "D" ? "drive results and lead teams" : discKey === "I" ? "build relationships and inspire others" : discKey === "S" ? "create stability and support team growth" : "ensure quality and optimize processes"}.`, MARGIN, y, CONTENT_W);
  y += 5;

  y = sectionTitle(doc, "Phase 3: Leadership (5-10 Years)", y, PURPLE);
  y = bullets(doc, roadmap.longTerm, MARGIN + 3, y, CONTENT_W - 6);
  y += 2;
  y = para(doc, `Long-term, your combination of ${results.disc.dominant} personality, ${results.mbti.type} cognitive style, and ${results.intelligence.top2.join("/")} intelligence positions you for senior roles in ${results.career.top2.join(" or ")} domains.`, MARGIN, y, CONTENT_W);
  y += 5;

  y = sectionTitle(doc, "Industry Path", y, TEAL);
  y = para(doc, roadmap.industryPath, MARGIN, y, CONTENT_W);
  y += 3;
  y = para(doc, `Most promising industries: ${careerTypeDetails[results.career.top2[0]]?.industries?.slice(0, 3).join(", ")} and ${careerTypeDetails[results.career.top2[1]]?.industries?.slice(0, 3).join(", ")}.`, MARGIN, y, CONTENT_W);
  y += 5;

  // Brain Dominance for ALL users
  y = ensureSpace(doc, y, 30);
  y = sectionTitle(doc, "Brain Dominance Analysis", y);

  // ★ PIE CHART: Brain Dominance
  y = ensureSpace(doc, y, 70);
  drawPieChart(doc, pw / 2, y + 25, 20,
    ["Left Brain (Logical)", "Right Brain (Creative)"],
    [results.brainDominance.left, results.brainDominance.right],
    { title: "Brain Hemisphere Dominance", colors: [[59, 130, 246], [236, 72, 153]] }
  );
  y += 60;

  y = boldLabel(doc, "Left Brain (Logical): ", `${results.brainDominance.left}%`, y);
  y = boldLabel(doc, "Right Brain (Creative): ", `${results.brainDominance.right}%`, y);
  y += 2;
  y = para(doc, results.brainDominance.left > results.brainDominance.right
    ? `You are predominantly left-brained (${results.brainDominance.left}%), indicating strong logical, analytical thinking.`
    : `You are predominantly right-brained (${results.brainDominance.right}%), indicating strong creative, intuitive thinking.`, MARGIN, y, CONTENT_W);

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
    const lines = doc.splitTextToSize(`>  ${t}`, pw - 50);
    doc.text(lines, pw / 2, sy, { align: "center" }); sy += lines.length * 6;
  });

  // ── Left vs Right Brain bars (always visible on summary)
  sy += 14;
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
  doc.text("Brain Hemisphere Balance", pw / 2, sy, { align: "center" });
  sy += 8;
  const barW = 120;
  const barX = (pw - barW) / 2;
  const leftPct = results.brainDominance.left;
  const rightPct = results.brainDominance.right;
  // Track
  doc.setFillColor(70, 80, 100); doc.roundedRect(barX, sy, barW, 6, 2, 2, "F");
  // Left fill
  doc.setFillColor(59, 130, 246); doc.roundedRect(barX, sy, (leftPct / 100) * barW, 6, 2, 2, "F");
  sy += 11;
  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text(`Left Brain (Logical): ${leftPct}%`, barX, sy);
  doc.text(`Right Brain (Creative): ${rightPct}%`, barX + barW, sy, { align: "right" });
  sy += 8;
  // Right hemisphere bar
  doc.setFillColor(70, 80, 100); doc.roundedRect(barX, sy, barW, 6, 2, 2, "F");
  doc.setFillColor(236, 72, 153); doc.roundedRect(barX, sy, (rightPct / 100) * barW, 6, 2, 2, "F");
  sy += 12;

  doc.setFontSize(11); doc.setFont("helvetica", "italic");
  doc.text('"Data alone does not create value."', pw / 2, sy, { align: "center" }); sy += 7;
  doc.text('"Interpretation creates understanding."', pw / 2, sy, { align: "center" }); sy += 7;
  doc.text('"Action creates transformation."', pw / 2, sy, { align: "center" }); sy += 15;

  doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text("This report was generated by Perfy's Deep Interpretation System", pw / 2, sy, { align: "center" }); sy += 5;
  doc.text("Powered by Interpretation Engine, Correlation Engine & Recommendation Engine", pw / 2, sy, { align: "center" });

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
