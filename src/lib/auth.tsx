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
  addCompany: (company: Omit<Company, "id">) => void;
  deleteCompany: (id: string) => void;
  // Institutions
  getInstitutions: () => Institution[];
  addInstitution: (i: Omit<Institution, "id" | "createdAt" | "active"> & { active?: boolean }) => Institution;
  updateInstitution: (id: string, patch: Partial<Institution>) => void;
  deleteInstitution: (id: string) => void;
  addInstitutionSeats: (id: string, seats: number, pricePerSeat?: number) => void;
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
  const addCompany = (company: Omit<Company, "id">) => {
    const cs = getCompanies();
    cs.push({ ...company, id: crypto.randomUUID() });
    localStorage.setItem("mm_companies", JSON.stringify(cs));
  };
  const deleteCompany = (id: string) => {
    const cs = getCompanies().filter(c => c.id !== id);
    localStorage.setItem("mm_companies", JSON.stringify(cs));
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
    return false;
  };

  const register = (data: RegisterData): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem("mm_users") || "[]");
    if (users.find(u => u.email === data.email)) return false;

    let companyName: string | undefined;
    if ((data.role === "employee" || data.role === "company") && data.companyCode) {
      const company = getCompanies().find(c => c.code === data.companyCode);
      if (!company) return false;
      companyName = company.name;
    }

    let institutionName: string | undefined;
    if (data.institutionCode || data.role === "institution") {
      if (!data.institutionCode) return false;
      const inst = getInstitutions().find(i => i.code === data.institutionCode);
      if (!inst) return false;
      if (!inst.active) return false;
      institutionName = inst.name;
      // Seat enforcement only for student role
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
        getCompanies, addCompany, deleteCompany,
        getInstitutions, addInstitution, updateInstitution, deleteInstitution,
        addInstitutionSeats, getInstitutionUsage,
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
