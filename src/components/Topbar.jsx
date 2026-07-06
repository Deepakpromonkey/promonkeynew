"use client";
import { useEffect, useState } from "react";
import { Bell, MessageSquare, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
}

function useDateTime() {
    const [dt, setDt] = useState({ date: "", time: "" });
    useEffect(() => {
        function tick() {
            const now = new Date();
            setDt({
                date: now.toLocaleDateString("en-US", {
                    weekday: "short", day: "2-digit",
                    month: "short",   year: "numeric",
                }),
                time: now.toLocaleTimeString("en-US", {
                    hour: "2-digit", minute: "2-digit",
                }),
            });
        }
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);
    return dt;
}

export default function Topbar() {
    const { user }       = useAuth();
    const { date, time } = useDateTime();
    const [search, setSearch] = useState("");

    return (
        <header className="h-[60px] shrink-0 bg-card border-b border-border flex items-center px-6 gap-4">

            {/* ── Left: Greeting ── */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-tight truncate">
                    {getGreeting()}, {user?.name ?? "there"} 👋
                </p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                    Here's what's happening in your company today.
                </p>
            </div>

            {/* ── Center: Search ── */}
            <div className="relative w-72 shrink-0">
                <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search projects, tasks, employees..."
                    className="pl-9 h-9 text-xs rounded-full bg-muted/50 border-border focus-visible:ring-primary"
                />
            </div>

            {/* ── Right: Icons + Date/Time ── */}
            <div className="flex items-center gap-3 shrink-0">

                {/* Bell */}
                <button className="relative w-8 h-8 flex items-center justify-center cursor-pointer rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Bell size={17} />
                    <Badge className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] p-0 flex items-center justify-center text-[9px] font-bold bg-red-500 text-white rounded-full border-2 border-card">
                        12
                    </Badge>
                </button>

                {/* Message */}
                <button className="w-8 h-8 flex items-center justify-center cursor-pointer rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <MessageSquare size={17} />
                </button>

                {/* Calendar */}
                <button className="w-8 h-8 flex items-center justify-center cursor-pointer rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                    <Calendar size={17} />
                </button>

                {/* Divider */}
                <div className="w-px h-5 bg-border" />

                {/* Date & Time */}
                <div className="text-right">
                    <p className="text-xs font-semibold text-foreground leading-tight whitespace-nowrap">
                        {date}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                        {time}
                    </p>
                </div>

            </div>
        </header>
    );
}