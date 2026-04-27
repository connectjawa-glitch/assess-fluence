import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BrainLogo } from "./BrainLogo";
import { LayoutDashboard, LogIn, Sparkles } from "lucide-react";

export default function AppHeader({ transparent = false }: { transparent?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
        transparent
          ? "bg-background/40 border-transparent text-primary-foreground"
          : "bg-background/80 border-border"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 group"
          aria-label="Home"
        >
          <BrainLogo size={36} />
          <div className="text-left hidden sm:block">
            <p className="text-sm font-display font-bold leading-tight">
              Personality &amp; Intelligence
            </p>
            <p className="text-[10px] opacity-70 leading-tight">Assessment Platform</p>
          </div>
        </button>

        <nav className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="hover:scale-105 transition-transform"
            onClick={() => navigate("/pricing")}
            aria-current={pathname === "/pricing"}
          >
            <Sparkles className="w-4 h-4 mr-1" /> View Plans
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="hover:scale-105 transition-transform"
            onClick={() =>
              navigate(user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login")
            }
          >
            <LayoutDashboard className="w-4 h-4 mr-1" /> Dashboard
          </Button>

          {user ? (
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground hover:scale-105 transition-transform"
              onClick={() => navigate(user.role === "admin" ? "/admin" : "/dashboard")}
            >
              {user.name.split(" ")[0]}
            </Button>
          ) : (
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground hover:scale-105 transition-transform"
              onClick={() => navigate("/login")}
            >
              <LogIn className="w-4 h-4 mr-1" /> Login
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
