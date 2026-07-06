"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, FolderKanban, CheckSquare,
    Shield, ShieldCheck, Users, UserRound,
    ChevronDown, ChevronUp, LogOut, User,
    Gem, Ticket, Calendar, BookOpen, LayoutTemplate,
} from "lucide-react";

const NAV_SECTIONS = {
    internal: [ 
        {
            label: "WORKSPACE",
            items: [
                { icon: LayoutDashboard, label: "Dashboard",   href: "/promonkey/dashboard" }, // No permissions = always visible
                { icon: FolderKanban,    label: "Projects",    href: "/promonkey/projects",   module: "Projects",    action: "viewProjects" },
                { icon: LayoutTemplate,  label: "Templates",   href: "/promonkey/templates",  module: "Projects",    action: "viewProjects" },
                { icon: Gem,             label: "Leads",       href: "/promonkey/leads",      module: "Leads",       action: "viewLeads" },
                { icon: Ticket,          label: "Tickets",     href: "/promonkey/tickets",    module: "Tickets",     action: "viewTickets" },
                { icon: CheckSquare,     label: "My Tasks",    href: "/promonkey/tasks",      module: "Tasks",       action: "viewTasks" },
                { icon: UserRound,       label: "Clients",     href: "/promonkey/clients",    module: "Clients",     action: "viewClients" },
                { icon: BookOpen,        label: "Onboarding",  href: "/promonkey/onboarding", module: "Clients",     action: "viewClients" },
            ],
        },
        {
            label: "OPERATIONS",
            items: [
                { icon: Calendar,        label: "Calendar",    href: "/promonkey/calendar",   module: "Calendar",    action: "viewCalendar" },
                { icon: Users,           label: "Resources",   href: "/promonkey/resources",  module: "Resources",   action: "viewCapacity" },
            ],
        },
        {
            label: "ORGANIZATION",
            items: [
                { icon: Users,           label: "Employees",   href: "/promonkey/employees",  module: "Employees",   action: "viewEmployees" },
                { icon: Shield,          label: "Roles",       href: "/promonkey/roles",      module: "Roles",       action: "viewRoles" },
                { icon: ShieldCheck,     label: "Permissions", href: "/promonkey/permissions",module: "Permissions", action: "viewPermissions" },
            ],
        },
    ],
    client: [ 
        {
            label: "WORKSPACE",
            items: [
                { icon: LayoutDashboard, label: "Dashboard",   href: "/promonkey/dashboard" },
                { icon: FolderKanban,    label: "My Projects", href: "/promonkey/projects"  },
            ],
        },
    ],
};
 
export default function Sidebar() {
    const pathname     = usePathname();
    const router       = useRouter();
    const { user, logout } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef   = useRef(null);
 
    const avatarLetter = user?.name?.[0]?.toUpperCase() ?? "U";

    const isClient = user?.role === "client";
    const rawSections = isClient ? NAV_SECTIONS.client : NAV_SECTIONS.internal;

    const canView = (moduleName, actionName) => {
        if (user?.role === "admin") return true; 
        if (!moduleName || !actionName) return true; 
        
        
        return user?.permissions?.[moduleName]?.[actionName] === true;
    };
 
   
    const visibleSections = rawSections
        .map(section => ({
            ...section,
            
            items: section.items.filter(item => canView(item.module, item.action))
        }))
        
        .filter(section => section.items.length > 0);
 
    useEffect(() => {
        function handleClickOutside(e) {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        }
        if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [profileOpen]);
 
    return (
        <aside className="w-[230px] shrink-0 flex flex-col h-full bg-white border-r border-[#E7EBF2]">
 
            {/* Brand */}
            <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-[#E7EBF2] shrink-0">
                <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-r from-[#3C80F5] to-[#763CF6] flex items-center justify-center text-white font-black text-[17px] shrink-0">
                    P
                </div>
                <div>
                    <b className="block font-black text-[15px] text-[#1B2330] tracking-[-0.2px]">ProMonkey</b>
                    <span className="block text-[10px] text-[#94A3B5] tracking-[1.5px] font-semibold mt-[1px]">OPERATING SYSTEM</span>
                </div>
            </div>
 
            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 py-2.5">
                {visibleSections.map((section) => (
                    <div key={section.label} className="mb-1">
                        <p className="text-[10px] tracking-[1.4px] text-[#94A3B5] font-bold px-3 pt-3 pb-1.5">
                            {section.label}
                        </p>
                        {section.items.map(({ icon: Icon, label, href }) => {
                            const isActive = pathname === href || pathname.startsWith(`${href}/`);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        "flex items-center gap-[11px] px-3 py-2 rounded-[10px] font-semibold text-[13.5px] no-underline mb-0.5 transition-all duration-150",
                                        isActive
                                            ? "bg-[#EEF3FE] text-[#3C80F5]"
                                            : "text-[#69788C] hover:bg-[#F7F9FC] hover:text-[#1B2330]"
                                    )}
                                >
                                    <Icon size={15} strokeWidth={isActive ? 2.5 : 2} className="shrink-0 opacity-85" />
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>
 
            {/* Profile */}
            <div ref={profileRef} className="px-3 py-4 border-t border-[#E7EBF2] shrink-0 relative">
 
                {/* Popup */}
                {profileOpen && (
                    <div className="absolute bottom-[76px] left-3 right-3 bg-white border border-[#E7EBF2] rounded-xl shadow-lg p-1 z-50">
                        <div className="px-3 py-2 border-b border-[#E7EBF2] mb-1">
                            <p className="text-xs font-semibold truncate text-[#1B2330]">{user?.name}</p>
                            <p className="text-[10px] text-[#94A3B5] truncate">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => { setProfileOpen(false); router.push("/promonkey/profile"); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#1B2330] hover:bg-[#F7F9FC] transition-colors"
                        >
                            <User size={14} />
                            View Profile
                        </button>
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#DC2626] hover:bg-[#FCEDED] transition-colors"
                        >
                            <LogOut size={14} />
                            Logout
                        </button>
                    </div>
                )}
 
                {/* Profile row */}
                <button
                    onClick={() => setProfileOpen(o => !o)}
                    className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[#F7F9FC] transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#3C80F5] to-[#763CF6] flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {avatarLetter}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-semibold truncate text-[#1B2330]">{user?.name || "User"}</p>
                        <p className="text-[10px] text-[#94A3B5] capitalize">{user?.role || "Member"}</p>
                    </div>
                    {profileOpen
                        ? <ChevronUp size={13} className="text-[#94A3B5] shrink-0" />
                        : <ChevronDown size={13} className="text-[#94A3B5] shrink-0" />
                    }
                </button>
            </div>
 
            {/* Footer */}
            <div className="px-[14px] py-3 border-t border-[#E7EBF2] text-[11px] text-[#94A3B5]">
                ProMonkey OS · Prototype<br />Agency operating system
            </div>
        </aside>
    );
}
 