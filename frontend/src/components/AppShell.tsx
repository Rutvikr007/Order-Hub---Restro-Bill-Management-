"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

const NAV_ITEMS = [
  { href: "/", label: "HomePage" },
  { href: "/create-order", label: "New Order" },
  { href: "/orders", label: "Orders" },
  { href: "/food", label: "Food Management" },
  { href: "/invoice", label: "Invoice Management" },
  { href: "/analytics", label: "Analytics" },
];

const STATUS_COPY: Record<string, { label: string; dot: string }> = {
  connected: { label: "Live", dot: "bg-accent" },
  connecting: { label: "Connecting", dot: "bg-amber" },
  disconnected: { label: "Offline", dot: "bg-rust" },
};

function SunMoonIcon({ theme }: { theme: "light" | "dark" }) {
  if (theme === "dark") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const storeId = useAppStore((s) => s.storeId);
  const setStoreId = useAppStore((s) => s.setStoreId);
  const socketStatus = useAppStore((s) => s.socketStatus);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const status = STATUS_COPY[socketStatus];

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("oms-theme");
    const nextTheme: "light" | "dark" =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    setTheme(nextTheme);
  }, [setTheme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("oms-theme", theme);
  }, [theme]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line bg-canvas/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <span className="font-display text-xl font-bold tracking-tight">Order Hub</span>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-ink/60 font-mono">
              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
                    active ? "bg-ink text-canvas" : "text-ink/70 hover:bg-ink/5"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex items-center gap-2 rounded-sm border border-line bg-white px-3 py-1.5 text-sm font-medium hover:bg-ink/5"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              <SunMoonIcon theme={theme} />
              <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
            </button>

            <label className="flex items-center gap-2 text-sm">
              <span className="text-ink/60 font-mono text-xs uppercase tracking-wide">Store</span>
              <select
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="border border-line bg-white rounded-sm px-2 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="store-1">store-1</option>
                <option value="store-2">store-2</option>
                <option value="store-3">store-3</option>
              </select>
            </label>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">{children}</main>

      <footer className="border-t border-line py-6 text-center text-xs text-ink/40 font-mono">
        Order Hub — multi-store order management
      </footer>
    </div>
  );
}
