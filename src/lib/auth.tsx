import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "employee" | "admin";
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string, role: "student" | "employee") => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("mm_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

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

  const register = (name: string, email: string, _password: string, role: "student" | "employee"): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem("mm_users") || "[]");
    if (users.find(u => u.email === email)) return false;
    const newUser: User = { id: crypto.randomUUID(), name, email, role };
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
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
