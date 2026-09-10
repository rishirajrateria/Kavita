"use client";

import * as React from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const CHANGE_EVENT = "kavita:theme-change";
const ORDER: readonly Theme[] = ["light", "dark", "system"];

function readTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
  try {
    if (theme === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  } catch {
    /* storage unavailable (private mode, blocked) — attribute still applied for this page */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const LABELS: Record<Theme, string> = {
  light: "Light theme",
  dark: "Dark theme",
  system: "System theme",
};

const ICONS: Record<Theme, React.ComponentType<{ className?: string }>> = {
  light: SunIcon,
  dark: MoonIcon,
  system: MonitorIcon,
};

export interface ThemeToggleProps extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  /** Render the current theme name next to the icon. */
  showLabel?: boolean;
}

/**
 * Cycles light → dark → system. Server-renders as "system" and syncs to the
 * stored preference on the client without a hydration mismatch.
 */
export function ThemeToggle({
  className,
  showLabel = false,
  variant = "ghost",
  size,
  ...props
}: ThemeToggleProps) {
  const theme = React.useSyncExternalStore(subscribe, readTheme, () => "system" as Theme);
  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length] ?? "system";
  const Icon = ICONS[theme];

  return (
    <Button
      type="button"
      variant={variant}
      size={size ?? (showLabel ? "sm" : "icon")}
      aria-label={`${LABELS[theme]} active. Switch to ${LABELS[next].toLowerCase()}`}
      title={LABELS[theme]}
      data-theme-value={theme}
      onClick={() => applyTheme(next)}
      className={cn("gap-2", className)}
      {...props}
    >
      <Icon className="size-4" aria-hidden="true" />
      {showLabel ? <span className="text-sm">{LABELS[theme]}</span> : null}
    </Button>
  );
}
