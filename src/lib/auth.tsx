import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Company {
  id: string;
  name: string;
  code: string;
  industry: string;
  location: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "employee" | "admin";
  companyCode?: string;
  companyName?: string;
  phone?: string;
  department?: string;
  school?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (data: RegisterData) => boolean;
  logout: () => void;
  getCompanies: () => Company[];
  addCompany: (company: Omit<Company, "id">) => void;
  deleteCompany: (id: string) => void;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: "student" | "employee";
  phone?: string;
  companyCode?: string;
  department?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("mm_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const getCompanies = (): Company[] => {
    return JSON.parse(localStorage.getItem("mm_companies") || "[]");
  };

  const addCompany = (company: Omit<Company, "id">) => {
    const companies = getCompanies();
    companies.push({ ...company, id: crypto.randomUUID() });
    localStorage.setItem("mm_companies", JSON.stringify(companies));
  };

  const deleteCompany = (id: string) => {
    const companies = getCompanies().filter(c => c.id !== id);
    localStorage.setItem("mm_companies", JSON.stringify(companies));
  };

  const login = (email: string, _password: string): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem("mm_users") || "[]");
    if (email === "admin@admin.com") {
      const admin: User = { id: "admin", name: "Admin", email, role: "admin" };
      setUser(admin);
      localStorage.setItem("mm_user", JSON.stringify(admin));
      return true;
    }
    const found = users.find(u => u.email === email);
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
    if (data.role === "employee" && data.companyCode) {
      const companies = getCompanies();
      const company = companies.find(c => c.code === data.companyCode);
      if (!company) return false;
      companyName = company.name;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      role: data.role,
      phone: data.phone,
      companyCode: data.companyCode,
      companyName,
      department: data.department,
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
    <AuthContext.Provider value={{ user, login, register, logout, getCompanies, addCompany, deleteCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
