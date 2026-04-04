// 10-Section Deep Interpretation PDF Report Generator
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

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pw, subtitle ? 32 : 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text(title, pw / 2, 14, { align: "center" });
  if (subtitle) { doc.setFontSize(9); doc.text(subtitle, pw / 2, 24, { align: "center" }); }
  doc.setTextColor(0, 0, 0);
}

function addSectionTitle(doc: jsPDF, title: string, y: number, color = BLUE): number {
  doc.setFontSize(12); doc.setTextColor(...color); doc.text(title, 20, y);
  doc.setTextColor(0, 0, 0); doc.setFontSize(10); return y + 7;
}

function addSubTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...BLUE);
  doc.text(title, 20, y); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
  return y + 6;
}

function wrapText(doc: jsPDF, text: string, x: number, y: number, maxW: number, lineH = 5): number {
  const lines = doc.splitTextToSize(text, maxW);
  doc.text(lines, x, y); return y + lines.length * lineH;
}

function checkPage(doc: jsPDF, y: number, needed = 30): number {
  if (y > doc.internal.pageSize.getHeight() - needed) { doc.addPage(); return 20; }
  return y;
}

function addBullets(doc: jsPDF, items: string[], x: number, y: number, maxW: number): number {
  items.forEach(item => {
    y = checkPage(doc, y, 12);
    const lines = doc.splitTextToSize(`• ${item}`, maxW);
    doc.text(lines, x, y); y += lines.length * 5 + 1;
  }); return y;
}

function addProgressBar(doc: jsPDF, label: string, value: number, x: number, y: number, barW = 100): number {
  doc.setFont("helvetica", "bold"); doc.text(`${label}:`, x, y);
  doc.setFont("helvetica", "normal"); doc.text(`${value}%`, x + 45, y);
  doc.setFillColor(230, 230, 230); doc.rect(x + 55, y - 4, barW, 5, "F");
  doc.setFillColor(...BLUE); doc.rect(x + 55, y - 4, Math.max(1, (value / 100) * barW), 5, "F");
  return y + 9;
}

export function generateDeepReport(user: User, results: AssessmentResults) {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const maxW = pw - 40;

  const discKey = results.disc.bird === "Eagle" ? "D" : results.disc.bird === "Parrot" ? "I" : results.disc.bird === "Dove" ? "S" : "C";
  const discInfo = discInterpretations[discKey];
  const mbtiInfo = mbtiInterpretations[results.mbti.type];
  const lsInfo = learningStyleDetails[results.learningStyle.dominant];
  const corr = generateCorrelationInsight(results.disc.dominant, results.mbti.type, results.quotients.IQ, results.quotients.EQ, results.quotients.AQ, results.quotients.CQ, results.learningStyle.dominant, results.intelligence.top2);
  const plan = generateActionPlan(results.quotients.IQ, results.quotients.EQ, results.quotients.AQ, results.quotients.CQ, results.learningStyle.dominant, results.career.top2);
  const roadmap = generateCareerRoadmap(results.career.top2, results.career.suggestedRoles);
  const birdEmoji = results.disc.bird === "Eagle" ? "Eagle" : results.disc.bird === "Parrot" ? "Parrot" : results.disc.bird === "Dove" ? "Dove" : "Owl";

  // ====== PAGE 1: PROFILE SUMMARY ======
  doc.setFillColor(...DARK);
  doc.rect(0, 0, pw, 50, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.text("Mind Mapping Assessment", pw / 2, 16, { align: "center" });
  doc.setFontSize(13); doc.text("Deep Interpretation Report", pw / 2, 26, { align: "center" });
  doc.setFontSize(10);
  doc.text(`${user.name} | ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`, pw / 2, 36, { align: "center" });
  const extra = [user.companyName, user.department, (user as any).school].filter(Boolean).join(" | ");
  if (extra) doc.text(extra, pw / 2, 44, { align: "center" });
  doc.setTextColor(0, 0, 0);
  let y = 58;

  y = addSectionTitle(doc, "1. Profile Summary", y);
  const profileItems = [
    ["DISC Personality", `${results.disc.dominant} (${birdEmoji})`],
    ["MBTI Type", `${results.mbti.type} - ${mbtiInfo?.title || ""}`],
    ["Learning Style", results.learningStyle.dominant],
    ["Top Intelligence", results.intelligence.top2.join(" & ")],
    ["IQ / EQ / AQ / CQ", `${results.quotients.IQ}% / ${results.quotients.EQ}% / ${results.quotients.AQ}% / ${results.quotients.CQ}%`],
    ["Career Mapping", `${results.career.top2.join(" & ")} -> ${results.career.suggestedRoles.slice(0, 3).join(", ")}`],
  ];
  if (user.role === "employee") profileItems.push(["Brain Dominance", `Left ${results.brainDominance.left}% / Right ${results.brainDominance.right}%`]);

  doc.setFontSize(10);
  profileItems.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold"); doc.text(`${label}:`, 20, y);
    doc.setFont("helvetica", "normal");
    const valLines = doc.splitTextToSize(value, maxW - 55);
    doc.text(valLines, 75, y);
    y += Math.max(valLines.length * 5, 7);
  });

  y += 5;
  y = addSubTitle(doc, "Overall Summary", y);
  const summaryText = `${user.name} is a ${results.disc.dominant} (${birdEmoji}) personality with ${results.mbti.type} (${mbtiInfo?.title || ""}) MBTI type. As a ${results.learningStyle.dominant} learner with strong ${results.intelligence.top2.join(" and ")} intelligence, they demonstrate ${results.quotients.EQ >= 70 ? "strong emotional awareness" : "developing emotional skills"} (EQ: ${results.quotients.EQ}%) and ${results.quotients.IQ >= 70 ? "solid analytical capability" : "growing analytical ability"} (IQ: ${results.quotients.IQ}%). Their career aptitude aligns with ${results.career.top2.join(" and ")} domains, suggesting roles in ${results.career.suggestedRoles.slice(0, 3).join(", ")}.`;
  y = wrapText(doc, summaryText, 20, y, maxW);

  y += 5;
  y = addSubTitle(doc, "Overall Profile Scores", y);
  const allScores = [
    { name: "IQ", val: results.quotients.IQ }, { name: "EQ", val: results.quotients.EQ },
    { name: "AQ", val: results.quotients.AQ }, { name: "CQ", val: results.quotients.CQ },
    { name: "DISC Max", val: Math.max(results.disc.percentages.D, results.disc.percentages.I, results.disc.percentages.S, results.disc.percentages.C) },
    { name: "Career Max", val: Math.max(...Object.values(results.career.percentages)) },
  ];
  allScores.forEach(s => { y = checkPage(doc, y, 12); y = addProgressBar(doc, s.name, s.val, 20, y); });
  const highest = allScores.reduce((a, b) => a.val > b.val ? a : b);
  const lowest = allScores.reduce((a, b) => a.val < b.val ? a : b);
  y += 3;
  y = wrapText(doc, `Highest: ${highest.name} at ${highest.val}% - strong natural aptitude. Lowest: ${lowest.name} at ${lowest.val}% - primary growth opportunity.`, 20, y, maxW);

  // ====== PAGE 2-3: PERSONALITY INTERPRETATION (DISC + MBTI) ======
  doc.addPage();
  addHeader(doc, "2. Personality Interpretation", "DISC + MBTI Analysis");
  y = 40;

  y = addSectionTitle(doc, `DISC: ${discKey} - ${results.disc.dominant} (${birdEmoji})`, y);
  y = wrapText(doc, discInfo.meaning, 20, y, maxW); y += 3;

  y = addSubTitle(doc, "DISC Scores", y);
  (["D", "I", "S", "C"] as const).forEach(k => {
    y = checkPage(doc, y, 12);
    y = addProgressBar(doc, `${k} (${k === "D" ? "Dominant/Eagle" : k === "I" ? "Influential/Parrot" : k === "S" ? "Steady/Dove" : "Compliant/Owl"})`, results.disc.percentages[k], 20, y);
  });
  y += 2;

  y = checkPage(doc, y, 30);
  y = addSubTitle(doc, "Behaviour Traits", y);
  y = addBullets(doc, discInfo.traits, 25, y, maxW - 5); y += 2;

  y = checkPage(doc, y, 30);
  y = addSubTitle(doc, "Strengths", y);
  y = addBullets(doc, discInfo.strengths, 25, y, maxW - 5); y += 2;

  y = checkPage(doc, y, 30);
  y = addSubTitle(doc, "Risks / Limitations", y);
  y = addBullets(doc, discInfo.risks, 25, y, maxW - 5); y += 2;

  y = checkPage(doc, y, 20);
  y = addSubTitle(doc, "Workplace Fit", y);
  y = wrapText(doc, discInfo.workFit, 20, y, maxW); y += 5;

  // MBTI section
  y = checkPage(doc, y, 80);
  y = addSectionTitle(doc, `MBTI: ${results.mbti.type} - ${mbtiInfo?.title || ""}`, y);

  y = addSubTitle(doc, "MBTI Dimension Scores", y);
  const pairs = [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]] as const;
  pairs.forEach(([a, b]) => {
    y = checkPage(doc, y, 10);
    const aScore = results.mbti.scores[a]; const bScore = results.mbti.scores[b];
    doc.text(`${a} vs ${b}: ${a}=${aScore}, ${b}=${bScore} -> ${aScore >= bScore ? a : b}`, 25, y); y += 7;
  }); y += 3;

  if (mbtiInfo) {
    y = checkPage(doc, y, 20); y = addSubTitle(doc, "Core Personality Description", y);
    y = wrapText(doc, mbtiInfo.description, 20, y, maxW); y += 3;

    y = checkPage(doc, y, 15); y = addSubTitle(doc, "Work Style", y);
    y = wrapText(doc, mbtiInfo.workStyle, 20, y, maxW); y += 3;

    y = checkPage(doc, y, 15); y = addSubTitle(doc, "Strengths in Teams", y);
    y = wrapText(doc, mbtiInfo.teamStrengths, 20, y, maxW); y += 3;

    y = checkPage(doc, y, 15); y = addSubTitle(doc, "Weakness Patterns", y);
    y = wrapText(doc, mbtiInfo.weaknesses, 20, y, maxW); y += 3;

    y = checkPage(doc, y, 15); y = addSubTitle(doc, "Leadership Style", y);
    y = wrapText(doc, mbtiInfo.leadership, 20, y, maxW); y += 3;

    y = checkPage(doc, y, 15); y = addSubTitle(doc, "Communication Style", y);
    y = wrapText(doc, mbtiInfo.communication, 20, y, maxW); y += 3;

    y = checkPage(doc, y, 20); y = addSubTitle(doc, "Ideal Career Directions", y);
    y = addBullets(doc, mbtiInfo.careers, 25, y, maxW - 5);
  }

  // ====== PAGE 4: INTELLIGENCE ANALYSIS ======
  doc.addPage();
  addHeader(doc, "3. Intelligence Analysis", "IQ | EQ | AQ | CQ");
  y = 40;

  y = addSubTitle(doc, "Quotient Scores Overview", y);
  (["IQ", "EQ", "AQ", "CQ"] as const).forEach(q => {
    y = checkPage(doc, y, 12);
    y = addProgressBar(doc, `${q} (${q === "IQ" ? "Intelligence Quotient" : q === "EQ" ? "Emotional Quotient" : q === "AQ" ? "Adversity Quotient" : "Creative Quotient"})`, results.quotients[q], 20, y);
  });
  y += 5;

  (["IQ", "EQ", "AQ", "CQ"] as const).forEach(q => {
    y = checkPage(doc, y, 45);
    const score = results.quotients[q];
    const interp = quotientInterpretations[q](score);
    y = addSectionTitle(doc, `${q}: ${score}% - ${q === "IQ" ? "Intelligence Quotient" : q === "EQ" ? "Emotional Quotient" : q === "AQ" ? "Adversity Quotient" : "Creative Quotient"}`, y);
    doc.setFont("helvetica", "bold"); doc.text("Meaning:", 20, y); y += 5; doc.setFont("helvetica", "normal");
    y = wrapText(doc, interp.meaning, 25, y, maxW - 5); y += 2;
    doc.setFont("helvetica", "bold"); doc.text("Impact on Performance:", 20, y); y += 5; doc.setFont("helvetica", "normal");
    y = wrapText(doc, interp.impact, 25, y, maxW - 5); y += 2;
    doc.setFont("helvetica", "bold"); doc.text("Improvement Steps:", 20, y); y += 5; doc.setFont("helvetica", "normal");
    y = addBullets(doc, interp.improvement, 25, y, maxW - 5); y += 4;
  });

  // ====== PAGE 5: LEARNING STYLE ======
  doc.addPage();
  addHeader(doc, "4. Learning Style Guide", results.learningStyle.dominant);
  y = 40;

  y = addSubTitle(doc, "Learning Style Scores", y);
  Object.entries(results.learningStyle.percentages).forEach(([k, v]) => {
    y = addProgressBar(doc, k, v, 20, y);
  }); y += 5;

  y = addSubTitle(doc, `How ${user.name} Learns Best`, y);
  y = wrapText(doc, lsInfo.howLearns, 20, y, maxW); y += 5;

  y = addSubTitle(doc, "Best Learning Methods", y);
  y = addBullets(doc, lsInfo.bestMethods, 25, y, maxW - 5); y += 3;

  y = checkPage(doc, y, 30);
  y = addSubTitle(doc, "Methods to Avoid", y);
  y = addBullets(doc, lsInfo.avoid, 25, y, maxW - 5); y += 3;

  y = checkPage(doc, y, 30);
  y = addSubTitle(doc, "Practical Techniques", y);
  y = addBullets(doc, lsInfo.techniques, 25, y, maxW - 5);

  // ====== PAGE 6: MULTIPLE INTELLIGENCE ======
  doc.addPage();
  addHeader(doc, "5. Multiple Intelligence Analysis", `Top: ${results.intelligence.top2.join(" & ")}`);
  y = 40;

  y = addSubTitle(doc, "All Intelligence Scores", y);
  Object.entries(results.intelligence.percentages).forEach(([k, v]) => {
    y = checkPage(doc, y, 10);
    y = addProgressBar(doc, k, v, 20, y);
  }); y += 5;

  results.intelligence.top2.forEach(intel => {
    y = checkPage(doc, y, 45);
    const info = intelligenceDescriptions[intel];
    y = addSectionTitle(doc, `${intel} Intelligence (${results.intelligence.percentages[intel]}%)`, y);
    doc.setFont("helvetica", "bold"); doc.text("Meaning:", 20, y); y += 5; doc.setFont("helvetica", "normal");
    y = wrapText(doc, info.meaning, 25, y, maxW - 5); y += 2;
    doc.setFont("helvetica", "bold"); doc.text("Real-Life Application:", 20, y); y += 5; doc.setFont("helvetica", "normal");
    y = wrapText(doc, info.application, 25, y, maxW - 5); y += 2;
    doc.setFont("helvetica", "bold"); doc.text("Career Relevance:", 20, y); y += 5; doc.setFont("helvetica", "normal");
    y = wrapText(doc, info.careerRelevance, 25, y, maxW - 5); y += 8;
  });

  // ====== PAGE 7: CAREER FIT ======
  doc.addPage();
  addHeader(doc, "6. Career Fit Analysis (RIASEC)", `Top: ${results.career.top2.join(" & ")}`);
  y = 40;

  y = addSubTitle(doc, "Career Type Scores", y);
  Object.entries(results.career.percentages).forEach(([k, v]) => {
    y = checkPage(doc, y, 10);
    y = addProgressBar(doc, k, v, 20, y);
  }); y += 3;

  y = addSubTitle(doc, "Suggested Roles", y);
  y = wrapText(doc, results.career.suggestedRoles.join(", "), 20, y, maxW); y += 5;

  results.career.top2.forEach(career => {
    y = checkPage(doc, y, 55);
    const info = careerTypeDetails[career];
    y = addSectionTitle(doc, `${career} (${results.career.percentages[career]}%)`, y);
    y = wrapText(doc, info.explanation, 20, y, maxW); y += 2;
    doc.setFont("helvetica", "bold"); doc.text("Suitable Industries:", 20, y); y += 5; doc.setFont("helvetica", "normal");
    y = wrapText(doc, info.industries.join(", "), 25, y, maxW - 5); y += 2;
    doc.setFont("helvetica", "bold"); doc.text("Job Roles:", 20, y); y += 5; doc.setFont("helvetica", "normal");
    y = wrapText(doc, info.roles.join(", "), 25, y, maxW - 5); y += 2;
    doc.setFont("helvetica", "bold"); doc.text("Career Growth Path:", 20, y); y += 5; doc.setFont("helvetica", "normal");
    y = wrapText(doc, info.growthPath, 25, y, maxW - 5); y += 8;
  });

  // ====== PAGE 8: SWOT ======
  doc.addPage();
  addHeader(doc, "7. SWOT Analysis (Expanded)");
  y = 36;

  const swotSections = [
    { title: "Strengths", items: results.swot.strengths, color: GREEN as [number, number, number], detail: "These represent your core competencies and natural advantages that can be leveraged for career growth." },
    { title: "Weaknesses", items: results.swot.weaknesses, color: RED as [number, number, number], detail: "These areas require focused development to prevent them from limiting your professional and personal growth." },
    { title: "Opportunities", items: results.swot.opportunities, color: BLUE as [number, number, number], detail: "These are actionable pathways aligned with your strengths, career mapping, and market demand." },
    { title: "Threats", items: results.swot.threats, color: AMBER as [number, number, number], detail: "These risks should be actively managed through preventive strategies and continuous development." },
  ];

  swotSections.forEach(section => {
    y = checkPage(doc, y, 40);
    doc.setFontSize(12); doc.setTextColor(...section.color); doc.text(section.title, 20, y);
    doc.setTextColor(0, 0, 0); doc.setFontSize(10); y += 6;
    y = wrapText(doc, section.detail, 20, y, maxW); y += 2;
    section.items.forEach(item => {
      y = checkPage(doc, y, 8); doc.text(`• ${item}`, 25, y); y += 6;
    }); y += 5;
  });

  // ====== PAGE 9: COMBINED PERSONALITY INSIGHT ======
  doc.addPage();
  addHeader(doc, "8. Combined Personality Insight", "Cross-Dimensional Analysis");
  y = 40;

  y = addSubTitle(doc, "Who This Person Is", y);
  y = wrapText(doc, corr.whoTheyAre, 20, y, maxW); y += 5;
  y = addSubTitle(doc, "How They Behave", y);
  y = wrapText(doc, corr.howTheyBehave, 20, y, maxW); y += 5;
  y = addSubTitle(doc, "Where They Perform Best", y);
  y = wrapText(doc, corr.whereTheyPerformBest, 20, y, maxW); y += 8;

  y = addSubTitle(doc, "Correlation Insights", y);
  const corrInsights = [
    `DISC (${discKey}) + MBTI (${results.mbti.type}) -> ${discKey === "D" || discKey === "I" ? "Action-oriented behaviour with strong external focus" : "Reflective behaviour with strong internal processing"}`,
    `IQ (${results.quotients.IQ}%) + AQ (${results.quotients.AQ}%) -> ${results.quotients.IQ >= 70 && results.quotients.AQ >= 70 ? "High work capability under pressure" : "Moderate work capability - develop resilience alongside analytics"}`,
    `Learning (${results.learningStyle.dominant}) + Intelligence (${results.intelligence.top2[0]}) -> Optimized ${results.learningStyle.dominant.toLowerCase()} processing strength`,
    `EQ (${results.quotients.EQ}%) + DISC -> ${results.quotients.EQ >= 70 ? "Strong people management potential" : "Developing interpersonal capabilities"}`,
  ];
  y = addBullets(doc, corrInsights, 25, y, maxW - 5); y += 5;

  y = checkPage(doc, y, 30);
  y = addSubTitle(doc, "Final Personality Insight", y);
  y = wrapText(doc, `${user.name} is a ${results.disc.dominant.split("(")[0].trim().toLowerCase()} leader with ${results.mbti.type} traits, demonstrating ${results.quotients.AQ >= 70 ? "strong resilience" : "developing resilience"} and ${results.quotients.EQ >= 70 ? "high emotional intelligence" : "growing emotional awareness"}. Best suited for ${results.career.top2.join(" and ").toLowerCase()} environments requiring ${results.intelligence.top2[0].toLowerCase()} intelligence. Key growth area: ${lowest.name} development.`, 20, y, maxW);

  // ====== PAGE 10: ACTION PLAN ======
  doc.addPage();
  addHeader(doc, "9. Action Plan", "Short-Term & Long-Term");
  y = 40;

  y = addSubTitle(doc, "Skill Development Plan", y);
  y = addBullets(doc, plan.skillDev, 25, y, maxW - 5); y += 5;

  y = checkPage(doc, y, 40);
  y = addSubTitle(doc, "Daily Improvement Plan", y);
  y = addBullets(doc, plan.dailyPlan, 25, y, maxW - 5); y += 5;

  y = checkPage(doc, y, 40);
  y = addSubTitle(doc, "Behaviour Improvement Plan", y);
  y = addBullets(doc, plan.behaviourPlan, 25, y, maxW - 5);

  // ====== PAGE 11: CAREER ROADMAP ======
  doc.addPage();
  addHeader(doc, "10. Career Roadmap", `${results.career.top2.join(" & ")}`);
  y = 40;

  y = addSubTitle(doc, "Short-Term Goals (0-2 Years)", y);
  y = addBullets(doc, roadmap.shortTerm, 25, y, maxW - 5); y += 5;

  y = addSubTitle(doc, "Long-Term Goals (3-10 Years)", y);
  y = addBullets(doc, roadmap.longTerm, 25, y, maxW - 5); y += 5;

  y = addSubTitle(doc, "Industry Path", y);
  y = wrapText(doc, roadmap.industryPath, 20, y, maxW); y += 8;

  // Career Strategy
  y = checkPage(doc, y, 40);
  y = addSubTitle(doc, "Career Strategy Summary", y);
  y = wrapText(doc, `Based on your ${results.disc.dominant} personality and ${results.mbti.type} type, your optimal career strategy combines ${results.career.top2[0]} stability with ${results.career.top2[1]} growth potential. Short-term: Build skills in ${results.career.suggestedRoles[0]} roles. Long-term: Advance to leadership positions leveraging your ${results.intelligence.top2[0]} intelligence and ${results.learningStyle.dominant} learning style.`, 20, y, maxW); y += 5;

  // Brain Dominance for employees
  if (user.role === "employee") {
    y = checkPage(doc, y, 30);
    y = addSubTitle(doc, "Brain Dominance", y);
    y = wrapText(doc, `Left Brain (Logical): ${results.brainDominance.left}% | Right Brain (Creative): ${results.brainDominance.right}%`, 20, y, maxW); y += 3;
    y = wrapText(doc, results.brainDominance.left > results.brainDominance.right
      ? "You are predominantly left-brained, indicating strong logical, analytical, and systematic thinking."
      : "You are predominantly right-brained, indicating strong creative, intuitive, and artistic thinking.", 20, y, maxW);
  }

  // ====== FINAL NOTE ======
  y = checkPage(doc, y, 40); y += 10;
  doc.setFillColor(...DARK); doc.rect(20, y - 5, maxW, 30, "F");
  doc.setTextColor(255, 255, 255); doc.setFontSize(10);
  doc.text("FINAL NOTE", pw / 2, y + 3, { align: "center" });
  doc.setFontSize(8);
  doc.text("Data alone does not create value. Interpretation creates understanding.", pw / 2, y + 11, { align: "center" });
  doc.text("Action creates transformation. This report aims to guide, improve, and empower.", pw / 2, y + 17, { align: "center" });
  doc.setTextColor(0, 0, 0);

  // ====== FOOTER ON ALL PAGES ======
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(...GRAY);
    doc.text(`Mind Mapping Assessment Report | ${user.name} | Page ${i} of ${totalPages}`, pw / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pw / 2, doc.internal.pageSize.getHeight() - 4, { align: "center" });
  }

  doc.save(`${user.name.replace(/\s+/g, "_")}_Assessment_Report.pdf`);
}
