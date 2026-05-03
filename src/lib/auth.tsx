import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Company {
  id: string;
  name: string;
  code: string;
  industry: string;
  location: string;
  seatsPurchased?: number;
  pricePerSeat?: number;
  active?: boolean;
}

export interface TrialAccess {
  id: string;
  email: string;
  name?: string;
  days: number;
  createdAt: string;   // ISO
  expiresAt: string;   // ISO
  note?: string;
  role?: "student" | "employee";
}

export type InstitutionType = "School" | "College" | "Coaching" | "Training" | "NGO" | "Other";
export type InstitutionPlan = "Starter" | "Standard" | "Pro" | "Enterprise";

export interface Institution {
  id: string;
  name: string;
  code: string;            // students/reps use this code at signup
  type: InstitutionType;
  location: string;
  plan: InstitutionPlan;
  seatsPurchased: number;  // total seats paid for
  pricePerSeat: number;    // last per-seat price (₹)
  active: boolean;         // suspend/activate
  createdAt: string;       // ISO
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "employee" | "admin" | "company" | "institution";
  companyCode?: string;
  companyName?: string;
  institutionCode?: string;
  institutionName?: string;
  phone?: string;
  department?: string;
  school?: string;
  designation?: string; // for company / institution reps
  grade?: string;       // for institution students (Class / Year)
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (data: RegisterData) => boolean;
  logout: () => void;
  // Companies
  getCompanies: () => Company[];
  addCompany: (company: Omit<Company, "id">) => Company;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  addCompanySeats: (id: string, seats: number, pricePerSeat?: number) => void;
  getCompanyUsage: (code: string) => { used: number; purchased: number; remaining: number };
  findCompanyByCode: (code: string) => Company | undefined;
  // Institutions
  getInstitutions: () => Institution[];
  addInstitution: (i: Omit<Institution, "id" | "createdAt" | "active"> & { active?: boolean }) => Institution;
  updateInstitution: (id: string, patch: Partial<Institution>) => void;
  deleteInstitution: (id: string) => void;
  addInstitutionSeats: (id: string, seats: number, pricePerSeat?: number) => void;
  // Trial access
  getTrialAccesses: () => TrialAccess[];
  createTrialAccess: (data: Omit<TrialAccess, "id" | "createdAt" | "expiresAt"> & { days: number }) => TrialAccess;
  revokeTrialAccess: (id: string) => void;
  // Helpers
  getInstitutionUsage: (code: string) => { used: number; purchased: number; remaining: number };
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "student" | "employee" | "company" | "institution";
  phone?: string;
  companyCode?: string;
  institutionCode?: string;
  department?: string;
  school?: string;
  designation?: string;
  grade?: string;
  // Self-serve org creation (for company/institution reps without a pre-issued code)
  newOrgName?: string;
  newOrgIndustry?: string;
  newOrgLocation?: string;
  newInstType?: InstitutionType;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("mm_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // ---------------- Companies ----------------
  const getCompanies = (): Company[] => JSON.parse(localStorage.getItem("mm_companies") || "[]");
  const saveCompanies = (list: Company[]) =>
    localStorage.setItem("mm_companies", JSON.stringify(list));

  const findCompanyByCode = (code: string) =>
    getCompanies().find(c => c.code.toLowerCase() === (code || "").toLowerCase());

  const addCompany: AuthContextType["addCompany"] = (company) => {
    const cs = getCompanies();
    const created: Company = {
      id: crypto.randomUUID(),
      seatsPurchased: company.seatsPurchased ?? 0,
      pricePerSeat: company.pricePerSeat ?? 0,
      active: company.active ?? true,
      ...company,
    };
    cs.push(created);
    saveCompanies(cs);
    return created;
  };
  const updateCompany = (id: string, patch: Partial<Company>) => {
    saveCompanies(getCompanies().map(c => (c.id === id ? { ...c, ...patch } : c)));
  };
  const deleteCompany = (id: string) => {
    saveCompanies(getCompanies().filter(c => c.id !== id));
  };
  const addCompanySeats = (id: string, seats: number, pricePerSeat?: number) => {
    saveCompanies(
      getCompanies().map(c =>
        c.id === id
          ? {
              ...c,
              seatsPurchased: (c.seatsPurchased || 0) + Math.max(0, seats),
              pricePerSeat: pricePerSeat ?? c.pricePerSeat,
            }
          : c
      )
    );
  };
  const getCompanyUsage = (code: string) => {
    const company = findCompanyByCode(code);
    const purchased = company?.seatsPurchased || 0;
    const users: User[] = JSON.parse(localStorage.getItem("mm_users") || "[]");
    const used = users.filter(u => u.role === "employee" && u.companyCode === code).length;
    return { used, purchased, remaining: Math.max(0, purchased - used) };
  };

  // ---------------- Trial Access ----------------
  const getTrialAccesses = (): TrialAccess[] =>
    JSON.parse(localStorage.getItem("mm_trial_access") || "[]");
  const saveTrials = (list: TrialAccess[]) =>
    localStorage.setItem("mm_trial_access", JSON.stringify(list));
  const createTrialAccess: AuthContextType["createTrialAccess"] = (data) => {
    const list = getTrialAccesses();
    const now = new Date();
    const expires = new Date(now.getTime() + Math.max(1, data.days) * 86400_000);
    const trial: TrialAccess = {
      id: crypto.randomUUID(),
      email: data.email.toLowerCase(),
      name: data.name,
      days: data.days,
      role: data.role || "student",
      note: data.note,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    // Replace any existing trial for the same email
    const filtered = list.filter(t => t.email !== trial.email);
    filtered.push(trial);
    saveTrials(filtered);
    return trial;
  };
  const revokeTrialAccess = (id: string) => {
    saveTrials(getTrialAccesses().filter(t => t.id !== id));
  };

  // ---------------- Institutions ----------------
  const getInstitutions = (): Institution[] =>
    JSON.parse(localStorage.getItem("mm_institutions") || "[]");

  const saveInstitutions = (list: Institution[]) =>
    localStorage.setItem("mm_institutions", JSON.stringify(list));

  const addInstitution: AuthContextType["addInstitution"] = (i) => {
    const list = getInstitutions();
    const inst: Institution = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      active: i.active ?? true,
      ...i,
    };
    list.push(inst);
    saveInstitutions(list);
    return inst;
  };

  const updateInstitution = (id: string, patch: Partial<Institution>) => {
    const list = getInstitutions().map(i => (i.id === id ? { ...i, ...patch } : i));
    saveInstitutions(list);
  };

  const deleteInstitution = (id: string) => {
    saveInstitutions(getInstitutions().filter(i => i.id !== id));
  };

  const addInstitutionSeats = (id: string, seats: number, pricePerSeat?: number) => {
    const list = getInstitutions().map(i =>
      i.id === id
        ? {
            ...i,
            seatsPurchased: i.seatsPurchased + Math.max(0, seats),
            pricePerSeat: pricePerSeat ?? i.pricePerSeat,
          }
        : i
    );
    saveInstitutions(list);
  };

  const getInstitutionUsage = (code: string) => {
    const inst = getInstitutions().find(i => i.code === code);
    if (!inst) return { used: 0, purchased: 0, remaining: 0 };
    const users: User[] = JSON.parse(localStorage.getItem("mm_users") || "[]");
    const used = users.filter(u => u.role === "student" && u.institutionCode === code).length;
    return { used, purchased: inst.seatsPurchased, remaining: Math.max(0, inst.seatsPurchased - used) };
  };

  // ---------------- Auth ----------------
  const login = (email: string, _password: string): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem("mm_users") || "[]");
    if (email === "admin@admin.com") {
      const admin: User = { id: "admin", name: "Admin", email, role: "admin" };
      setUser(admin);
      localStorage.setItem("mm_user", JSON.stringify(admin));
      return true;
    }
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      localStorage.setItem("mm_user", JSON.stringify(found));
      return true;
    }
    // Try trial-access link (admin-issued, no payment, time-bound)
    const trial = getTrialAccesses().find(t => t.email.toLowerCase() === email.toLowerCase());
    if (trial) {
      if (new Date(trial.expiresAt).getTime() < Date.now()) return false;
      // Auto-create a temporary student account, marked as trial + auto-paid.
      const newUser: User = {
        id: crypto.randomUUID(),
        name: trial.name || email.split("@")[0],
        email: trial.email,
        role: trial.role || "student",
      };
      users.push(newUser);
      localStorage.setItem("mm_users", JSON.stringify(users));
      // Auto-unlock report (trial bypass)
      localStorage.setItem(`pia_unlocked_${newUser.id}`, "1");
      localStorage.setItem(`mm_trial_user_${newUser.id}`, trial.expiresAt);
      setUser(newUser);
      localStorage.setItem("mm_user", JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const register = (data: RegisterData): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem("mm_users") || "[]");
    if (users.find(u => u.email === data.email)) return false;

    let companyName: string | undefined;
    let resolvedCompanyCode = data.companyCode;

    // Self-serve company creation: rep provided a custom company name (no code) -> create org
    if (data.role === "company" && !data.companyCode && data.newOrgName) {
      const slug = data.newOrgName.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6) || "ORG";
      let code = `${slug}${Math.floor(100 + Math.random() * 900)}`;
      while (findCompanyByCode(code)) code = `${slug}${Math.floor(100 + Math.random() * 900)}`;
      const created = addCompany({
        name: data.newOrgName,
        code,
        industry: data.newOrgIndustry || "—",
        location: data.newOrgLocation || "—",
        seatsPurchased: 0,
        pricePerSeat: 0,
        active: true,
      });
      resolvedCompanyCode = created.code;
      companyName = created.name;
    } else if ((data.role === "employee" || data.role === "company") && data.companyCode) {
      const company = findCompanyByCode(data.companyCode);
      if (!company) return false;
      if (company.active === false) return false;
      companyName = company.name;
      // Enforce seats for employees joining a paid company plan
      if (data.role === "employee" && (company.seatsPurchased || 0) > 0) {
        const { remaining } = getCompanyUsage(company.code);
        if (remaining <= 0) return false;
      }
    }

    let institutionName: string | undefined;
    let resolvedInstitutionCode = data.institutionCode;

    // Self-serve institution creation
    if (data.role === "institution" && !data.institutionCode && data.newOrgName) {
      const slug = data.newOrgName.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6) || "INST";
      let code = `${slug}${Math.floor(100 + Math.random() * 900)}`;
      while (getInstitutions().find(i => i.code === code)) code = `${slug}${Math.floor(100 + Math.random() * 900)}`;
      const created = addInstitution({
        name: data.newOrgName,
        code,
        type: data.newInstType || "School",
        location: data.newOrgLocation || "—",
        plan: "Starter",
        seatsPurchased: 0,
        pricePerSeat: 0,
        active: true,
      });
      resolvedInstitutionCode = created.code;
      institutionName = created.name;
    } else if (data.institutionCode || data.role === "institution") {
      if (!data.institutionCode) return false;
      const inst = getInstitutions().find(i => i.code === data.institutionCode);
      if (!inst) return false;
      if (!inst.active) return false;
      institutionName = inst.name;
      if (data.role === "student") {
        const { remaining } = getInstitutionUsage(inst.code);
        if (remaining <= 0) return false;
      }
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      role: data.role,
      phone: data.phone,
      companyCode: data.companyCode,
      companyName,
      institutionCode: data.institutionCode,
      institutionName,
      department: data.department,
      school: data.school || institutionName,
      designation: data.designation,
      grade: data.grade,
    };
    users.push(newUser);
    localStorage.setItem("mm_users", JSON.stringify(users));

    // BULK PAID AUTO-UNLOCK: members of a paid company / institution don't pay again.
    const companyForUser = data.companyCode ? findCompanyByCode(data.companyCode) : undefined;
    const isCompanyPaid = !!(companyForUser && (companyForUser.seatsPurchased || 0) > 0);
    const instForUser = data.institutionCode ? getInstitutions().find(i => i.code === data.institutionCode) : undefined;
    const isInstPaid = !!(instForUser && instForUser.seatsPurchased > 0);
    if (isCompanyPaid || isInstPaid) {
      localStorage.setItem(`pia_unlocked_${newUser.id}`, "1");
    }

    setUser(newUser);
    localStorage.setItem("mm_user", JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mm_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user, login, register, logout,
        getCompanies, addCompany, updateCompany, deleteCompany,
        addCompanySeats, getCompanyUsage, findCompanyByCode,
        getInstitutions, addInstitution, updateInstitution, deleteInstitution,
        addInstitutionSeats, getInstitutionUsage,
        getTrialAccesses, createTrialAccess, revokeTrialAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
