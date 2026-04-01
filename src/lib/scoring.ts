import { allQuestions } from "@/data/questions";

export interface Responses {
  [questionId: number]: number; // 1-5
}

export interface DISCResult {
  D: number; I: number; S: number; C: number;
  dominant: string;
  bird: string;
  percentages: { D: number; I: number; S: number; C: number };
}

export interface MBTIResult {
  type: string;
  scores: { E: number; I: number; S: number; N: number; T: number; F: number; J: number; P: number };
}

export interface IntelligenceResult {
  scores: Record<string, number>;
  percentages: Record<string, number>;
  top2: string[];
}

export interface LearningStyleResult {
  scores: Record<string, number>;
  dominant: string;
  percentages: Record<string, number>;
}

export interface QuotientResult {
  IQ: number; EQ: number; AQ: number; CQ: number;
}

export interface CareerResult {
  scores: Record<string, number>;
  percentages: Record<string, number>;
  top2: string[];
  suggestedRoles: string[];
}

export interface BrainDominanceResult {
  left: number;
  right: number;
}

export interface SWOTResult {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface AssessmentResults {
  disc: DISCResult;
  mbti: MBTIResult;
  intelligence: IntelligenceResult;
  learningStyle: LearningStyleResult;
  quotients: QuotientResult;
  career: CareerResult;
  brainDominance: BrainDominanceResult;
  swot: SWOTResult;
}

function calcSubcategoryScore(responses: Responses, category: string, subcategory: string): number {
  return allQuestions
    .filter(q => q.category === category && q.subcategory === subcategory)
    .reduce((sum, q) => sum + (responses[q.id] || 3), 0);
}

function calcSubcategoryMax(category: string, subcategory: string): number {
  return allQuestions.filter(q => q.category === category && q.subcategory === subcategory).length * 5;
}

export function calculateDISC(responses: Responses): DISCResult {
  const subs = ["D", "I", "S", "C"] as const;
  const scores = {} as Record<string, number>;
  const percentages = {} as Record<string, number>;
  subs.forEach(s => {
    scores[s] = calcSubcategoryScore(responses, "DISC", s);
    percentages[s] = Math.round((scores[s] / calcSubcategoryMax("DISC", s)) * 100);
  });
  const dominant = subs.reduce((a, b) => scores[a] > scores[b] ? a : b);
  const birdMap: Record<string, string> = { D: "Eagle", I: "Parrot", S: "Dove", C: "Owl" };
  const nameMap: Record<string, string> = { D: "Dominant", I: "Influential", S: "Steady", C: "Compliant" };
  return {
    D: scores.D, I: scores.I, S: scores.S, C: scores.C,
    dominant: `${nameMap[dominant]} (${birdMap[dominant]})`,
    bird: birdMap[dominant],
    percentages: percentages as any,
  };
}

export function calculateMBTI(responses: Responses): MBTIResult {
  const pairs = [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]];
  const scores: Record<string, number> = {};
  pairs.flat().forEach(s => {
    scores[s] = calcSubcategoryScore(responses, "MBTI", s);
  });
  const type = pairs.map(([a, b]) => scores[a] >= scores[b] ? a : b).join("");
  return { type, scores };
}

export function calculateIntelligence(responses: Responses): IntelligenceResult {
  const types = ["Linguistic", "Logical", "Musical", "Spatial", "Kinesthetic", "Interpersonal", "Intrapersonal", "Naturalist"];
  const scores: Record<string, number> = {};
  const percentages: Record<string, number> = {};
  types.forEach(t => {
    scores[t] = calcSubcategoryScore(responses, "Intelligence", t);
    percentages[t] = Math.round((scores[t] / calcSubcategoryMax("Intelligence", t)) * 100);
  });
  const sorted = [...types].sort((a, b) => scores[b] - scores[a]);
  return { scores, percentages, top2: sorted.slice(0, 2) };
}

export function calculateLearningStyle(responses: Responses): LearningStyleResult {
  const types = ["Visual", "Auditory", "Kinesthetic"];
  const scores: Record<string, number> = {};
  const percentages: Record<string, number> = {};
  types.forEach(t => {
    scores[t] = calcSubcategoryScore(responses, "LearningStyle", t);
    percentages[t] = Math.round((scores[t] / calcSubcategoryMax("LearningStyle", t)) * 100);
  });
  const dominant = types.reduce((a, b) => scores[a] > scores[b] ? a : b);
  return { scores, dominant, percentages };
}

export function calculateQuotients(responses: Responses): QuotientResult {
  const types = ["IQ", "EQ", "AQ", "CQ"];
  const result: Record<string, number> = {};
  types.forEach(t => {
    const score = calcSubcategoryScore(responses, "Quotient", t);
    const max = calcSubcategoryMax("Quotient", t);
    result[t] = Math.round((score / max) * 100);
  });
  return result as QuotientResult;
}

export function calculateCareer(responses: Responses): CareerResult {
  const types = ["Realistic", "Investigative", "Artistic", "Social", "Enterprising", "Conventional"];
  const scores: Record<string, number> = {};
  const percentages: Record<string, number> = {};
  types.forEach(t => {
    scores[t] = calcSubcategoryScore(responses, "Career", t);
    percentages[t] = Math.round((scores[t] / calcSubcategoryMax("Career", t)) * 100);
  });
  const sorted = [...types].sort((a, b) => scores[b] - scores[a]);
  const top2 = sorted.slice(0, 2);

  const roleMap: Record<string, string[]> = {
    Realistic: ["Engineer", "Mechanic", "Architect", "Farmer"],
    Investigative: ["Scientist", "Researcher", "Data Analyst", "Doctor"],
    Artistic: ["Designer", "Writer", "Musician", "Film Director"],
    Social: ["Teacher", "Counselor", "HR Manager", "Social Worker"],
    Enterprising: ["CEO", "Sales Manager", "Entrepreneur", "Lawyer"],
    Conventional: ["Accountant", "Administrator", "Bank Officer", "Auditor"],
  };
  const suggestedRoles = [...(roleMap[top2[0]] || []).slice(0, 2), ...(roleMap[top2[1]] || []).slice(0, 2)];
  return { scores, percentages, top2, suggestedRoles };
}

export function calculateBrainDominance(responses: Responses): BrainDominanceResult {
  const quotients = calculateQuotients(responses);
  const disc = calculateDISC(responses);
  const left = Math.round((quotients.IQ + disc.percentages.C + calcSubcategoryScore(responses, "Intelligence", "Logical") / calcSubcategoryMax("Intelligence", "Logical") * 100) / 3);
  const right = Math.round((quotients.EQ + quotients.CQ + calcSubcategoryScore(responses, "Career", "Artistic") / calcSubcategoryMax("Career", "Artistic") * 100) / 3);
  const total = left + right;
  return { left: Math.round((left / total) * 100), right: Math.round((right / total) * 100) };
}

export function calculateSWOT(results: Omit<AssessmentResults, "swot">): SWOTResult {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];

  // Strengths from high quotients
  if (results.quotients.IQ >= 75) strengths.push("Strong Analytical Thinking");
  if (results.quotients.EQ >= 75) strengths.push("High Emotional Intelligence");
  if (results.quotients.CQ >= 75) strengths.push("Creative Problem Solving");
  if (results.quotients.AQ >= 75) strengths.push("Resilience & Adaptability");

  // Strengths from intelligence
  results.intelligence.top2.forEach(t => strengths.push(`${t} Intelligence`));

  // Weaknesses from low quotients
  if (results.quotients.IQ < 50) weaknesses.push("Needs Analytical Development");
  if (results.quotients.EQ < 50) weaknesses.push("Needs Emotional Awareness");
  if (results.quotients.CQ < 50) weaknesses.push("Limited Creative Thinking");
  if (results.quotients.AQ < 50) weaknesses.push("Low Risk Tolerance");
  if (weaknesses.length === 0) weaknesses.push("Moderate areas identified for growth");

  // Opportunities from career mapping
  results.career.top2.forEach(t => opportunities.push(`${t} career paths`));
  results.career.suggestedRoles.slice(0, 2).forEach(r => opportunities.push(`Role: ${r}`));

  // Threats
  if (results.quotients.AQ < 60) threats.push("Low Adversity Quotient");
  if (results.quotients.EQ < 60) threats.push("Emotional Management Challenges");
  if (threats.length === 0) threats.push("No significant threats identified");

  return { strengths, weaknesses, opportunities, threats };
}

export function calculateAllResults(responses: Responses, isEmployee: boolean = false): AssessmentResults {
  const disc = calculateDISC(responses);
  const mbti = calculateMBTI(responses);
  const intelligence = calculateIntelligence(responses);
  const learningStyle = calculateLearningStyle(responses);
  const quotients = calculateQuotients(responses);
  const career = calculateCareer(responses);
  const brainDominance = isEmployee ? calculateBrainDominance(responses) : { left: 50, right: 50 };

  const partial = { disc, mbti, intelligence, learningStyle, quotients, career, brainDominance };
  const swot = calculateSWOT(partial);

  return { ...partial, swot };
}
