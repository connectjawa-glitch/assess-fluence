// 14-Page Deep Interpretation PDF Report Generator
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

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pw, subtitle ? 32 : 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(title, pw / 2, 14, { align: "center" });
  if (subtitle) {
    doc.setFontSize(9);
    doc.text(subtitle, pw / 2, 24, { align: "center" });
  }
  doc.setTextColor(0, 0, 0);
}

function addSectionTitle(doc: jsPDF, title: string, y: number, color = BLUE): number {
  doc.setFontSize(13);
  doc.setTextColor(...color);
  doc.text(title, 20, y);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  return y + 8;
}

function wrapText(doc: jsPDF, text: string, x: number, y: number, maxW: number, lineH = 5): number {
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, x, y);
  return y + lines.length * lineH;
}

function checkPage(doc: jsPDF, y: number, needed = 30): number {
  if (y > doc.internal.pageSize.getHeight() - needed) {
    doc.addPage();
    return 20;
  }
  return y;
}

function addBullets(doc: jsPDF, items: string[], x: number, y: number, maxW: number): number {
  items.forEach(item => {
    y = checkPage(doc, y, 12);
    const lines = doc.splitTextToSize(`• ${item}`, maxW);
    doc.text(lines, x, y);
    y += lines.length * 5 + 1;
  });
  return y;
}

export function generateDeepReport(user: User, results: AssessmentResults) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const maxW = pw - 40;

  // ============ PAGE 1: PROFILE SUMMARY ============
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pw, 55, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("Mind Mapping Assessment", pw / 2, 18, { align: "center" });
  doc.setFontSize(14);
  doc.text("Deep Interpretation Report", pw / 2, 28, { align: "center" });
  doc.setFontSize(11);
  doc.text(`${user.name} • ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`, pw / 2, 38, { align: "center" });
  const extra = [user.companyName, user.department, (user as any).school].filter(Boolean).join(" • ");
  if (extra) doc.text(extra, pw / 2, 46, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pw / 2, 52, { align: "center" });

  doc.setTextColor(0, 0, 0);
  let y = 65;

  // Profile summary table
  const discKey = results.disc.bird === "Eagle" ? "D" : results.disc.bird === "Parrot" ? "I" : results.disc.bird === "Dove" ? "S" : "C";
  const profileItems = [
    ["DISC Personality", results.disc.dominant],
    ["MBTI Type", `${results.mbti.type} — ${mbtiInterpretations[results.mbti.type]?.title || ""}`],
    ["Learning Style", results.learningStyle.dominant],
    ["Top Intelligence", results.intelligence.top2.join(" & ")],
    ["IQ / EQ / AQ / CQ", `${results.quotients.IQ}% / ${results.quotients.EQ}% / ${results.quotients.AQ}% / ${results.quotients.CQ}%`],
    ["Career Mapping", `${results.career.top2.join(" & ")} → ${results.career.suggestedRoles.slice(0, 2).join(", ")}`],
  ];
  if (user.role === "employee") {
    profileItems.push(["Brain Dominance", `Left ${results.brainDominance.left}% / Right ${results.brainDominance.right}%`]);
  }

  doc.setFontSize(10);
  profileItems.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 20, y);
    doc.setFont("helvetica", "normal");
    const valLines = doc.splitTextToSize(value, maxW - 55);
    doc.text(valLines, 75, y);
    y += Math.max(valLines.length * 5, 7);
  });

  y += 5;
  y = addSectionTitle(doc, "Overall Summary", y);
  const mbtiInfo = mbtiInterpretations[results.mbti.type];
  const summaryParagraph = `${user.name} is a ${results.disc.dominant} personality (DISC) with ${results.mbti.type} ${mbtiInfo ? `(${mbtiInfo.title})` : ""} MBTI type. As a ${results.learningStyle.dominant} learner with strong ${results.intelligence.top2.join(" and ")} intelligence, they demonstrate ${results.quotients.EQ >= 70 ? "strong emotional awareness" : "developing emotional skills"} and ${results.quotients.IQ >= 70 ? "solid analytical capability" : "growing analytical ability"}. Their career aptitude aligns with ${results.career.top2.join(" and ")} domains, suggesting roles in ${results.career.suggestedRoles.slice(0, 2).join(" and ")}.`;
  y = wrapText(doc, summaryParagraph, 20, y, maxW);

  // ============ PAGE 2: OVERALL PROFILE SNAPSHOT ============
  doc.addPage();
  addHeader(doc, "Overall Profile Snapshot", "Combined Scores & Analysis");
  y = 42;

  const allScores = [
    { name: "IQ", val: results.quotients.IQ },
    { name: "EQ", val: results.quotients.EQ },
    { name: "AQ", val: results.quotients.AQ },
    { name: "CQ", val: results.quotients.CQ },
    { name: "DISC Max", val: Math.max(results.disc.percentages.D, results.disc.percentages.I, results.disc.percentages.S, results.disc.percentages.C) },
    { name: "Career Max", val: Math.max(...Object.values(results.career.percentages)) },
  ];

  allScores.forEach(s => {
    doc.setFont("helvetica", "bold");
    doc.text(`${s.name}:`, 20, y);
    doc.setFont("helvetica", "normal");
    doc.text(`${s.val}%`, 55, y);
    // Progress bar
    doc.setFillColor(230, 230, 230);
    doc.rect(70, y - 4, 110, 5, "F");
    doc.setFillColor(...BLUE);
    doc.rect(70, y - 4, Math.max(1, (s.val / 100) * 110), 5, "F");
    y += 9;
  });

  y += 5;
  const highest = allScores.reduce((a, b) => a.val > b.val ? a : b);
  const lowest = allScores.reduce((a, b) => a.val < b.val ? a : b);
  y = addSectionTitle(doc, "Score Analysis", y);
  y = wrapText(doc, `Highest: ${highest.name} at ${highest.val}% — This indicates a strong natural aptitude in this area.`, 20, y, maxW);
  y += 3;
  y = wrapText(doc, `Lowest: ${lowest.name} at ${lowest.val}% — This represents the primary growth opportunity.`, 20, y, maxW);

  y += 8;
  y = addSectionTitle(doc, "Three-Line Insight", y);
  const corr = generateCorrelationInsight(results.disc.dominant, results.mbti.type, results.quotients.IQ, results.quotients.EQ, results.quotients.AQ, results.quotients.CQ, results.learningStyle.dominant, results.intelligence.top2);
  y = wrapText(doc, `Behaviour: ${corr.howTheyBehave}`, 20, y, maxW);
  y += 3;
  y = wrapText(doc, `Strength Pattern: ${corr.whoTheyAre}`, 20, y, maxW);
  y += 3;
  y = wrapText(doc, `Growth Area: Focus on building ${lowest.name} capability through targeted development.`, 20, y, maxW);

  // ============ PAGE 3-4: DISC PERSONALITY ============
  doc.addPage();
  addHeader(doc, "DISC Personality — Detailed Analysis");
  y = 36;

  const discInfo = discInterpretations[discKey];
  y = addSectionTitle(doc, `Your Dominant Type: ${discKey} — ${results.disc.dominant}`, y);
  y = wrapText(doc, discInfo.meaning, 20, y, maxW);
  y += 5;

  y = addSectionTitle(doc, "Behaviour Traits", y);
  y = addBullets(doc, discInfo.traits, 25, y, maxW - 5);
  y += 3;

  y = addSectionTitle(doc, "Strengths", y);
  y = addBullets(doc, discInfo.strengths, 25, y, maxW - 5);
  y += 3;

  y = checkPage(doc, y, 50);
  y = addSectionTitle(doc, "Risks & Limitations", y);
  y = addBullets(doc, discInfo.risks, 25, y, maxW - 5);
  y += 3;

  y = checkPage(doc, y, 30);
  y = addSectionTitle(doc, "Work / Study Fit", y);
  y = wrapText(doc, discInfo.workFit, 20, y, maxW);
  y += 8;

  // All DISC scores brief
  y = checkPage(doc, y, 50);
  y = addSectionTitle(doc, "All DISC Scores", y);
  (["D", "I", "S", "C"] as const).forEach(k => {
    y = checkPage(doc, y, 15);
    doc.setFont("helvetica", "bold");
    doc.text(`${k} (${results.disc.percentages[k]}%):`, 20, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    y = wrapText(doc, discInterpretations[k].brief, 25, y, maxW - 5);
    y += 3;
  });

  // ============ PAGE 5-6: MBTI PERSONALITY ============
  doc.addPage();
  addHeader(doc, `MBTI Personality — ${results.mbti.type}`, mbtiInfo?.title || "");
  y = 40;

  if (mbtiInfo) {
    y = addSectionTitle(doc, "Core Personality Description", y);
    y = wrapText(doc, mbtiInfo.description, 20, y, maxW);
    y += 5;

    y = checkPage(doc, y, 20);
    y = addSectionTitle(doc, "Work Style", y);
    y = wrapText(doc, mbtiInfo.workStyle, 20, y, maxW);
    y += 5;

    y = checkPage(doc, y, 20);
    y = addSectionTitle(doc, "Strengths in Teams", y);
    y = wrapText(doc, mbtiInfo.teamStrengths, 20, y, maxW);
    y += 5;

    y = checkPage(doc, y, 20);
    y = addSectionTitle(doc, "Weakness Patterns", y);
    y = wrapText(doc, mbtiInfo.weaknesses, 20, y, maxW);
    y += 5;

    y = checkPage(doc, y, 20);
    y = addSectionTitle(doc, "Leadership Style", y);
    y = wrapText(doc, mbtiInfo.leadership, 20, y, maxW);
    y += 5;

    y = checkPage(doc, y, 20);
    y = addSectionTitle(doc, "Communication Style", y);
    y = wrapText(doc, mbtiInfo.communication, 20, y, maxW);
    y += 5;

    y = checkPage(doc, y, 30);
    y = addSectionTitle(doc, "Ideal Career Directions", y);
    y = addBullets(doc, mbtiInfo.careers, 25, y, maxW - 5);
  }

  // MBTI Scores
  y = checkPage(doc, y, 50);
  y += 5;
  y = addSectionTitle(doc, "MBTI Dimension Scores", y);
  const pairs = [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]] as const;
  pairs.forEach(([a, b]) => {
    y = checkPage(doc, y, 12);
    const aScore = results.mbti.scores[a];
    const bScore = results.mbti.scores[b];
    const winner = aScore >= bScore ? a : b;
    doc.text(`${a} vs ${b}: ${a}=${aScore}, ${b}=${bScore} → ${winner}`, 25, y);
    y += 7;
  });

  // ============ PAGE 7: QUOTIENT ANALYSIS ============
  doc.addPage();
  addHeader(doc, "Quotient Analysis", "IQ • EQ • AQ • CQ");
  y = 40;

  (["IQ", "EQ", "AQ", "CQ"] as const).forEach(q => {
    y = checkPage(doc, y, 50);
    const score = results.quotients[q];
    const interp = quotientInterpretations[q](score);
    y = addSectionTitle(doc, `${q}: ${score}%`, y);
    doc.setFont("helvetica", "bold");
    doc.text("Meaning:", 20, y); y += 5;
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, interp.meaning, 25, y, maxW - 5);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Impact:", 20, y); y += 5;
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, interp.impact, 25, y, maxW - 5);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Improvement Steps:", 20, y); y += 5;
    doc.setFont("helvetica", "normal");
    y = addBullets(doc, interp.improvement, 25, y, maxW - 5);
    y += 5;
  });

  // ============ PAGE 8: LEARNING STYLE ============
  doc.addPage();
  addHeader(doc, "Learning Style Analysis", results.learningStyle.dominant);
  y = 40;

  const lsInfo = learningStyleDetails[results.learningStyle.dominant];
  y = addSectionTitle(doc, `How ${user.name} Learns Best`, y);
  y = wrapText(doc, lsInfo.howLearns, 20, y, maxW);
  y += 8;

  y = addSectionTitle(doc, "Best Learning Methods", y);
  y = addBullets(doc, lsInfo.bestMethods, 25, y, maxW - 5);
  y += 5;

  y = addSectionTitle(doc, "Methods to Avoid", y);
  y = addBullets(doc, lsInfo.avoid, 25, y, maxW - 5);
  y += 5;

  y = addSectionTitle(doc, "Practical Techniques", y);
  y = addBullets(doc, lsInfo.techniques, 25, y, maxW - 5);

  // All learning style scores
  y += 8;
  y = addSectionTitle(doc, "All Learning Style Scores", y);
  Object.entries(results.learningStyle.percentages).forEach(([k, v]) => {
    doc.text(`${k}: ${v}%`, 25, y);
    doc.setFillColor(230, 230, 230);
    doc.rect(70, y - 4, 100, 5, "F");
    doc.setFillColor(...BLUE);
    doc.rect(70, y - 4, Math.max(1, (v / 100) * 100), 5, "F");
    y += 9;
  });

  // ============ PAGE 9: MULTIPLE INTELLIGENCE ============
  doc.addPage();
  addHeader(doc, "Multiple Intelligence Analysis", `Top: ${results.intelligence.top2.join(" & ")}`);
  y = 40;

  results.intelligence.top2.forEach(intel => {
    y = checkPage(doc, y, 50);
    const info = intelligenceDescriptions[intel];
    y = addSectionTitle(doc, `${intel} Intelligence (${results.intelligence.percentages[intel]}%)`, y);
    doc.setFont("helvetica", "bold");
    doc.text("Meaning:", 20, y); y += 5;
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, info.meaning, 25, y, maxW - 5);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Real-Life Application:", 20, y); y += 5;
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, info.application, 25, y, maxW - 5);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Career Relevance:", 20, y); y += 5;
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, info.careerRelevance, 25, y, maxW - 5);
    y += 10;
  });

  // All intelligence scores
  y = checkPage(doc, y, 70);
  y = addSectionTitle(doc, "All Intelligence Scores", y);
  Object.entries(results.intelligence.percentages).forEach(([k, v]) => {
    y = checkPage(doc, y, 10);
    doc.text(`${k}: ${v}%`, 25, y);
    doc.setFillColor(230, 230, 230);
    doc.rect(80, y - 4, 90, 5, "F");
    doc.setFillColor(...BLUE);
    doc.rect(80, y - 4, Math.max(1, (v / 100) * 90), 5, "F");
    y += 8;
  });

  // ============ PAGE 10: CAREER MAPPING ============
  doc.addPage();
  addHeader(doc, "Career Mapping (RIASEC)", `Top: ${results.career.top2.join(" & ")}`);
  y = 40;

  results.career.top2.forEach(career => {
    y = checkPage(doc, y, 60);
    const info = careerTypeDetails[career];
    y = addSectionTitle(doc, `${career} (${results.career.percentages[career]}%)`, y);
    y = wrapText(doc, info.explanation, 20, y, maxW);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Suitable Industries:", 20, y); y += 5;
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, info.industries.join(", "), 25, y, maxW - 5);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Job Roles:", 20, y); y += 5;
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, info.roles.join(", "), 25, y, maxW - 5);
    y += 3;
    doc.setFont("helvetica", "bold");
    doc.text("Career Growth Path:", 20, y); y += 5;
    doc.setFont("helvetica", "normal");
    y = wrapText(doc, info.growthPath, 25, y, maxW - 5);
    y += 10;
  });

  // ============ PAGE 11: SWOT ANALYSIS ============
  doc.addPage();
  addHeader(doc, "SWOT Analysis — Expanded");
  y = 36;

  const swotSections = [
    { title: "Strengths", items: results.swot.strengths, color: [34, 197, 94] as [number, number, number], detail: "These represent your core competencies and natural advantages." },
    { title: "Weaknesses", items: results.swot.weaknesses, color: [239, 68, 68] as [number, number, number], detail: "These areas require focused development to prevent them from limiting your growth." },
    { title: "Opportunities", items: results.swot.opportunities, color: [59, 130, 246] as [number, number, number], detail: "These are actionable pathways aligned with your strengths and market demand." },
    { title: "Threats", items: results.swot.threats, color: [245, 158, 11] as [number, number, number], detail: "These risks should be actively managed through preventive strategies." },
  ];

  swotSections.forEach(section => {
    y = checkPage(doc, y, 40);
    doc.setFontSize(13);
    doc.setTextColor(...section.color);
    doc.text(section.title, 20, y);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    y += 6;
    y = wrapText(doc, section.detail, 20, y, maxW);
    y += 3;
    section.items.forEach(item => {
      y = checkPage(doc, y, 8);
      doc.text(`• ${item}`, 25, y);
      y += 6;
    });
    y += 6;
  });

  // ============ PAGE 12: COMBINED PERSONALITY INSIGHT ============
  doc.addPage();
  addHeader(doc, "Combined Personality Insight", "Cross-Dimensional Analysis");
  y = 40;

  y = addSectionTitle(doc, "Who This Person Is", y);
  y = wrapText(doc, corr.whoTheyAre, 20, y, maxW);
  y += 8;

  y = addSectionTitle(doc, "How They Behave", y);
  y = wrapText(doc, corr.howTheyBehave, 20, y, maxW);
  y += 8;

  y = addSectionTitle(doc, "Where They Perform Best", y);
  y = wrapText(doc, corr.whereTheyPerformBest, 20, y, maxW);
  y += 10;

  y = addSectionTitle(doc, "Correlation Insights", y);
  const corrInsights = [
    `DISC (${discKey}) + MBTI (${results.mbti.type}) → ${discKey === "D" || discKey === "I" ? "Action-oriented behaviour with strong external focus" : "Reflective behaviour with strong internal processing"}`,
    `IQ (${results.quotients.IQ}%) + AQ (${results.quotients.AQ}%) → ${results.quotients.IQ >= 70 && results.quotients.AQ >= 70 ? "High work capability under pressure" : "Moderate work capability — develop resilience alongside analytics"}`,
    `Learning (${results.learningStyle.dominant}) + Intelligence (${results.intelligence.top2[0]}) → ${results.learningStyle.dominant === "Visual" ? "Visual-spatial processing strength" : results.learningStyle.dominant === "Auditory" ? "Verbal-auditory processing strength" : "Experiential processing strength"}`,
    `EQ (${results.quotients.EQ}%) + DISC → ${results.quotients.EQ >= 70 ? "Strong people management potential" : "Developing interpersonal capabilities"}`,
  ];
  y = addBullets(doc, corrInsights, 25, y, maxW - 5);

  // ============ PAGE 13: ACTION PLAN ============
  doc.addPage();
  addHeader(doc, "Personal Action Plan");
  y = 36;

  const plan = generateActionPlan(results.quotients.IQ, results.quotients.EQ, results.quotients.AQ, results.quotients.CQ, results.learningStyle.dominant, results.career.top2);

  y = addSectionTitle(doc, "Skill Development Plan", y);
  y = addBullets(doc, plan.skillDev, 25, y, maxW - 5);
  y += 5;

  y = addSectionTitle(doc, "Daily Improvement Plan", y);
  y = addBullets(doc, plan.dailyPlan, 25, y, maxW - 5);
  y += 5;

  y = addSectionTitle(doc, "Behaviour Improvement Plan", y);
  y = addBullets(doc, plan.behaviourPlan, 25, y, maxW - 5);

  // ============ PAGE 14: CAREER ROADMAP ============
  doc.addPage();
  addHeader(doc, "Career Roadmap", `${results.career.top2.join(" & ")}`);
  y = 40;

  const roadmap = generateCareerRoadmap(results.career.top2, results.career.suggestedRoles);

  y = addSectionTitle(doc, "Short-Term Goals (0-2 Years)", y);
  y = addBullets(doc, roadmap.shortTerm, 25, y, maxW - 5);
  y += 5;

  y = addSectionTitle(doc, "Long-Term Goals (3-10 Years)", y);
  y = addBullets(doc, roadmap.longTerm, 25, y, maxW - 5);
  y += 5;

  y = addSectionTitle(doc, "Industry Path", y);
  y = wrapText(doc, roadmap.industryPath, 20, y, maxW);

  // ============ FOOTER ON ALL PAGES ============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`Mind Mapping Assessment Report — ${user.name} — Page ${i} of ${totalPages}`, pw / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
  }

  doc.save(`${user.name.replace(/\s+/g, "_")}_Deep_Interpretation_Report.pdf`);
}
