import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { BrainLogo } from "./BrainLogo";
import { LayoutDashboard, LogIn, LogOut, Sparkles } from "lucide-react";

export default function AppHeader({ transparent = false }: { transparent?: boolean }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Dashboard only shows once the user is signed in (per request: hide it on
  // the public landing page).
  const showDashboard = !!user;

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
        transparent
          ? "bg-background/40 border-transparent"
          : "bg-background/85 border-border"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 group min-w-0"
          aria-label="Home"
        >
          <BrainLogo size={36} />
          <div className="text-left hidden sm:block min-w-0">
            <p className="text-sm font-display font-bold leading-tight truncate">
              Personality &amp; Intelligence
            </p>
            <p className="text-[10px] opacity-70 leading-tight">Assessment Platform</p>
          </div>
        </button>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hover:scale-105 transition-transform shrink-0 gap-1.5"
            onClick={() => navigate("/pricing")}
            aria-current={pathname === "/pricing"}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs sm:text-sm">View Plans</span>
          </Button>

          {showDashboard && (
            <Button
              variant="outline"
              size="sm"
              className="hover:scale-105 transition-transform shrink-0 gap-1.5"
              onClick={() =>
                navigate(user.role === "admin" ? "/admin" : "/dashboard")
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Dashboard</span>
            </Button>
          )}

          {user ? (
            <>
              <Button
                size="sm"
                className="gradient-primary text-primary-foreground hover:scale-105 transition-transform shrink-0 max-w-[7rem] sm:max-w-[10rem] truncate"
                onClick={() => navigate(user.role === "admin" ? "/admin" : "/dashboard")}
              >
                {user.name.split(" ")[0]}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hover:scale-105 transition-transform shrink-0 gap-1.5"
                onClick={() => { logout(); navigate("/"); }}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Logout</span>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground hover:scale-105 transition-transform shrink-0 gap-1.5"
              onClick={() => navigate("/login")}
            >
              <LogIn className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Login</span>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
