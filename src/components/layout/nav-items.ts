import { LayoutDashboard, Stethoscope, UsersRound, type LucideIcon } from "lucide-react";

export type NavItem = { title: string; href: string; icon: LucideIcon; description: string };

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Caseload overview and trends",
  },
  {
    title: "Doctors",
    href: "/doctors",
    icon: Stethoscope,
    description: "Manage doctors and their patients",
  },
  {
    title: "Patients",
    href: "/patients",
    icon: UsersRound,
    description: "Every patient across all doctors",
  },
];

export function activeNavItem(pathname: string) {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
