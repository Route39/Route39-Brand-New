import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/panel/LanguageSwitcher";
import { NotificationBell } from "@/components/panel/NotificationBell";
import { PanelSidebarContent } from "@/components/panel/PanelSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/providers/ThemeProvider";

export function PanelHeader() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.userName;

  return (
    <header className="flex h-14 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              className="md:hidden"
            >
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <PanelSidebarContent onNavigate={() => setDrawerOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="text-sm font-medium text-foreground/80">
          {displayName ? `Signed in as ${displayName}` : ""}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
        <LanguageSwitcher />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}
