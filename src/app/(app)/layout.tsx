import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SessionProvider } from "@/features/auth/session-context";
import { getSessionUser } from "@/lib/server/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/signout");

  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <SessionProvider user={user}>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AppSidebar />
        <SidebarInset className="min-w-0">
          <AppHeader />
          <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SessionProvider>
  );
}
