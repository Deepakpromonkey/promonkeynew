"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    const isDark = theme === "dark";

    return (
        <button onClick={() => setTheme(isDark ? "light" : "dark")} className="flex items-center gap-2 cursor-pointer select-none">
            <Sun size={16} className="text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">
                {isDark ? "Dark" : "Light"}
            </span>
            <div className={cn("w-11 h-6 rounded-full relative transition-colors duration-300","bg-primary"  )}>
                <div className={cn( "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300", isDark ? "left-6" : "left-1"
                )} />
            </div>
            {isDark && <Moon size={16} className="text-muted-foreground" />}
        </button>
    );
}