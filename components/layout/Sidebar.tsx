
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, PlusCircle, ShieldAlert, List, Globe, Crosshair } from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Events", href: "/events", icon: List },
    { name: "Threat Actors", href: "/threat-actors", icon: ShieldAlert },
    { name: "Sectors", href: "/sectors", icon: Crosshair },
    { name: "Countries", href: "/countries", icon: Globe },
    { name: "Add Article", href: "/add", icon: PlusCircle },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
            <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
                <ShieldAlert className="h-8 w-8 text-primary mr-2" />
                <span className="text-xl font-bold tracking-tight text-primary">TΞLΞMΞTRY</span>
            </div>
            <nav className="flex-1 space-y-1 px-4 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                isActive
                                    ? "bg-sidebar-accent text-primary border-l-2 border-primary"
                                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-white",
                                "group flex items-center px-3 py-2 text-sm font-medium transition-all duration-200"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors"
                                )}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/20">
                <p className="text-xs text-muted-foreground font-mono">SYSTEM: ONLINE</p>
                <p className="text-xs text-primary/50 font-mono mt-1">t3l3m3try</p>
            </div>
        </div>
    );
}
