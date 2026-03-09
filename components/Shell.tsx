"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarProvider,
    SidebarTrigger,
    SidebarInset,
} from "@/components/ui/sidebar";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";

const NAV_ITEMS = [
    { href: "/", label: "Projects" },
];

export function Shell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    function isActive(href: string) {
        return href === "/" ? pathname === "/" : pathname.startsWith(href);
    }

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    return (
        <SidebarProvider
            style={{ "--sidebar-width": "13rem" } as React.CSSProperties}
        >
            <Sidebar>
                <SidebarHeader className="px-5 py-5">
                    <h1 className="font-mono text-sm font-bold text-sidebar-primary tracking-tight">
                        content.
                    </h1>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup className="py-0">
                        <SidebarMenu>
                            {NAV_ITEMS.map((item) => (
                                <SidebarMenuItem key={item.href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={isActive(item.href)}
                                    >
                                        <Link href={item.href}>
                                            {item.label}
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>

                <SidebarFooter className="p-4">
                    <button
                        onClick={handleLogout}
                        className="text-xs text-sidebar-foreground/70 hover:text-sidebar-primary transition-colors text-left"
                    >
                        Sign out
                    </button>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <header className="flex items-center justify-between border-b px-4 py-3 lg:px-8">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="-ml-1" />
                    </div>
                    <div className="flex items-center gap-1">
                        <ThemeTogglerButton
                            variant="ghost"
                            size="sm"
                            modes={["dark", "light"]}
                        />
                    </div>
                </header>
                <main className="p-4 lg:p-8">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
