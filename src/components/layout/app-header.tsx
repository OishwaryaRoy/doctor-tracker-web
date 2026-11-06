"use client";

import { useIsFetching } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { activeNavItem } from "./nav-items";
import { ThemeToggle } from "./theme-toggle";

export function AppHeader() {
  const pathname = usePathname();
  const section = activeNavItem(pathname);
  const isFetching = useIsFetching() > 0;

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <SidebarTrigger className="-ml-1.5" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <span className="truncate text-sm font-medium">{section?.title ?? "Doctor Tracker"}</span>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 overflow-hidden"
      >
        <div
          className={`h-full w-1/3 rounded-full bg-primary transition-opacity duration-300 ${
            isFetching ? "animate-[loading-bar_1.1s_ease-in-out_infinite] opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </header>
  );
}
