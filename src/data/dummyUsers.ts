import type { User, Company } from "@/lib/auth";
import type { Responses } from "@/lib/scoring";

function randomAnswer(): number {
  return Math.floor(Math.random() * 5) + 1;
}

function biasedAnswer(bias: number): number {
  const offset = Math.floor(Math.random() * 3) - 1;
  return Math.max(1, Math.min(5, bias + offset));
}

function generateResponses(profile: Record<string, number>): Responses {
  const responses: Responses = {};
  for (let i = 1; i <= 199; i++) {
    if (i <= 6) responses[i] = biasedAnswer(profile.D || 3);
    else if (i <= 12) responses[i] = biasedAnswer(profile.I || 3);
    else if (i <= 18) responses[i] = biasedAnswer(profile.S || 3);
    else if (i <= 24) responses[i] = biasedAnswer(profile.C || 3);
    else if (i <= 29) responses[i] = biasedAnswer(profile.E || 3);
    else if (i <= 34) responses[i] = biasedAnswer(profile.Iv || 3);
    else if (i <= 39) responses[i] = biasedAnswer(profile.Se || 3);
    else if (i <= 44) responses[i] = biasedAnswer(profile.N || 3);
    else if (i <= 49) responses[i] = biasedAnswer(profile.T || 3);
    else if (i <= 54) responses[i] = biasedAnswer(profile.F || 3);
    else if (i <= 59) responses[i] = biasedAnswer(profile.J || 3);
    else if (i <= 64) responses[i] = biasedAnswer(profile.P || 3);
    else responses[i] = randomAnswer();
  }
  return responses;
}

const defaultCompanies: Omit<Company, "id">[] = [
  { name: "TechCorp Solutions", code: "TECH001", industry: "Technology", location: "New York" },
  { name: "Global Finance Ltd", code: "GFL002", industry: "Finance", location: "London" },
  { name: "HealthFirst Inc", code: "HF003", industry: "Healthcare", location: "San Francisco" },
];

const dummyProfiles: { user: Omit<User, "id">; profile: Record<string, number> }[] = [
  { user: { name: "John Smith", email: "john@example.com", role: "student", school: "Springfield High School" }, profile: { D: 2, I: 3, S: 5, C: 3, E: 4, Iv: 2, Se: 3, N: 4, T: 2, F: 5, J: 4, P: 2 } },
  { user: { name: "Sarah Johnson", email: "sarah@example.com", role: "student", school: "MIT" }, profile: { D: 4, I: 5, S: 2, C: 2, E: 5, Iv: 1, Se: 2, N: 5, T: 2, F: 4, J: 2, P: 5 } },
  { user: { name: "Michael Chen", email: "michael@example.com", role: "employee", companyCode: "TECH001", companyName: "TechCorp Solutions", department: "Engineering" }, profile: { D: 5, I: 3, S: 2, C: 4, E: 3, Iv: 4, Se: 4, N: 3, T: 5, F: 2, J: 5, P: 1 } },
  { user: { name: "Emily Davis", email: "emily@example.com", role: "student", school: "Stanford University" }, profile: { D: 2, I: 4, S: 4, C: 3, E: 4, Iv: 3, Se: 2, N: 5, T: 3, F: 4, J: 3, P: 4 } },
  { user: { name: "David Wilson", email: "david@example.com", role: "employee", companyCode: "GFL002", companyName: "Global Finance Ltd", department: "Analytics" }, profile: { D: 3, I: 2, S: 3, C: 5, E: 2, Iv: 5, Se: 5, N: 2, T: 5, F: 1, J: 5, P: 1 } },
  { user: { name: "Lisa Anderson", email: "lisa@example.com", role: "student", school: "Harvard University" }, profile: { D: 3, I: 5, S: 3, C: 2, E: 5, Iv: 2, Se: 3, N: 4, T: 2, F: 5, J: 2, P: 5 } },
  { user: { name: "James Brown", email: "james@example.com", role: "employee", companyCode: "TECH001", companyName: "TechCorp Solutions", department: "Product" }, profile: { D: 4, I: 4, S: 2, C: 3, E: 4, Iv: 3, Se: 3, N: 4, T: 4, F: 3, J: 4, P: 3 } },
  { user: { name: "Maria Garcia", email: "maria@example.com", role: "student", school: "Oxford Academy" }, profile: { D: 2, I: 3, S: 5, C: 4, E: 2, Iv: 5, Se: 4, N: 3, T: 3, F: 4, J: 4, P: 3 } },
  { user: { name: "Robert Taylor", email: "robert@example.com", role: "employee", companyCode: "HF003", companyName: "HealthFirst Inc", department: "Research" }, profile: { D: 5, I: 4, S: 1, C: 2, E: 5, Iv: 2, Se: 2, N: 5, T: 3, F: 4, J: 2, P: 5 } },
  { user: { name: "Jennifer Lee", email: "jennifer@example.com", role: "employee", companyCode: "GFL002", companyName: "Global Finance Ltd", department: "Risk" }, profile: { D: 3, I: 3, S: 4, C: 4, E: 3, Iv: 4, Se: 4, N: 3, T: 4, F: 3, J: 4, P: 3 } },
];

export function initializeDummyData() {
  if (localStorage.getItem("mm_dummy_v3")) return;

  // Clear old data
  localStorage.removeItem("mm_dummy_initialized");
  localStorage.removeItem("mm_dummy_v2");

  // Initialize companies
  const companies: Company[] = defaultCompanies.map(c => ({ ...c, id: crypto.randomUUID() }));
  localStorage.setItem("mm_companies", JSON.stringify(companies));

  const users: User[] = [];
  dummyProfiles.forEach((dp) => {
    const user: User = { id: crypto.randomUUID(), ...dp.user };
    users.push(user);
    const responses = generateResponses(dp.profile);
    localStorage.setItem(`mm_responses_${user.id}`, JSON.stringify(responses));
    localStorage.setItem(`mm_completed_${user.id}`, "true");
  });

  const existing: User[] = JSON.parse(localStorage.getItem("mm_users") || "[]");
  // Remove old dummy users
  const nonDummy = existing.filter(e => !dummyProfiles.some(dp => dp.user.email === e.email));
  localStorage.setItem("mm_users", JSON.stringify([...nonDummy, ...users]));
  localStorage.setItem("mm_dummy_v2", "true");
}
