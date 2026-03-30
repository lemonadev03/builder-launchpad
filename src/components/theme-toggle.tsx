"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuItem
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="mr-2 h-4 w-4 dark:hidden" />
      <Moon className="mr-2 hidden h-4 w-4 dark:block" />
      Toggle theme
    </DropdownMenuItem>
  );
}
