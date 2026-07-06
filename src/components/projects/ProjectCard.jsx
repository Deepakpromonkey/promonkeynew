"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Pencil, Trash2, Loader2,
    Monitor, Smartphone, Users, ShoppingCart,
    TrendingUp, Wrench, Bot, BarChart3, FolderKanban,
} from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES = {
    URGENT: "bg-[#DC2626] text-white",
    HIGH:   "bg-[#DC2626] text-white",
    MED:    "bg-[#E08600] text-white",
    MEDIUM: "bg-[#E08600] text-white",
    LOW:    "bg-[#EEF1F6] text-[#69788C]",
};

const HEALTH_STYLES = {
    AT_RISK:  { dot: "bg-[#DC2626]", label: "At risk",   text: "text-[#DC2626]" },
    ON_TRACK: { dot: "bg-[#16A34A]", label: "On track",  text: "text-[#16A34A]" },
    DELAYED:  { dot: "bg-[#E08600]", label: "Delayed",   text: "text-[#E08600]" },
    BLOCKED:  { dot: "bg-[#DC2626]", label: "Blocked",   text: "text-[#DC2626]" },
};

const STATUS_STYLES = {
    ACTIVE:    { dot: "bg-[#3C80F5]", label: "Active" },
    COMPLETED: { dot: "bg-[#16A34A]", label: "Completed" },
    ON_HOLD:   { dot: "bg-[#E08600]", label: "On hold" },
    CANCELLED: { dot: "bg-[#DC2626]", label: "Cancelled" },
};

const TYPE_ICONS = {
    WEB_APP:           Monitor,
    MOBILE_APP:        Smartphone,
    CRM:               Users,
    E_COMMERCE:        ShoppingCart,
    DIGITAL_MARKETING: TrendingUp,
    MAINTENANCE:       Wrench,
    AI:                Bot,
    DATA:              BarChart3,
    DEFAULT:           FolderKanban,
};

function typeLabel(type = "") {
    return type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// Descriptions come back from the API as HTML (e.g. "<p>text</p>").
// Strip tags and decode entities so the card shows clean plain text.
function stripHtml(html = "") {
    const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (typeof document === "undefined") return text;
    const el = document.createElement("textarea");
    el.innerHTML = text;
    return el.value;
}

function MemberAvatars({ members = [] }) {
    if (!members.length) return null;
    return (
        <div className="flex -space-x-2">
            {members.slice(0, 4).map((m, i) => {
                const name    = m.legalName ?? m.name ?? "?";
                const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                const colors  = ["bg-[#3C80F5]","bg-[#763CF6]","bg-[#16A34A]","bg-[#E08600]","bg-[#DC2626]"];
                return (
                    <div key={i} title={name}
                        className={cn("w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shrink-0", colors[i % colors.length])}>
                        {initials}
                    </div>
                );
            })}
            {members.length > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-[#EEF1F6] flex items-center justify-center text-[10px] font-bold text-[#69788C]">
                    +{members.length - 4}
                </div>
            )}
        </div>
    );
}

export default function ProjectCard({ project, onEdit, onDelete }) {
    const router = useRouter();
    const [open,    setOpen]    = useState(false);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    const p        = project;
    const priority = p.priority ?? "LOW";
    const health   = HEALTH_STYLES[p.health] ?? HEALTH_STYLES.ON_TRACK;
    const status   = STATUS_STYLES[p.status] ?? STATUS_STYLES.ACTIVE;
    const TypeIcon = TYPE_ICONS[p.type] ?? TYPE_ICONS.DEFAULT;
    const isAtRisk = p.health === "AT_RISK";

    const dueDate = p.dueDate
        ? new Date(p.dueDate).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
        : null;

    async function confirmDelete(e) {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            await onDelete(p);
            setOpen(false);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }

    return (
        <>
            <div
                className={cn(
                    "bg-white border rounded-2xl p-5 shadow-[0_1px_2px_rgba(27,35,48,.06),0_4px_16px_rgba(27,35,48,.06)] flex flex-col gap-3 hover:shadow-[0_4px_24px_rgba(27,35,48,.10)] transition-shadow cursor-pointer relative",
                    isAtRisk ? "border-[#F3C9C9]" : "border-[#E7EBF2]"
                )}
                onClick={() => router.push(`/promonkey/projects/${p.id}`)}
            >
                {/* AT RISK banner */}
                {isAtRisk && (
                    <div className="absolute top-0 left-0 right-0 flex">
                        <span className="bg-[#DC2626] text-white text-[10px] font-black px-3 py-1 rounded-tl-2xl rounded-br-xl tracking-wide">
                            AT RISK
                        </span>
                    </div>
                )}

                {/* Top row — code + priority */}
                <div className={cn("flex items-start justify-between", isAtRisk && "mt-5")}>
                    <div>
                        <p className="text-[11px] font-semibold text-[#94A3B5]">
                            {p.code ?? `PRJ-${p.id?.slice(-3).toUpperCase()}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Edit + Delete icons */}
                        <button
                            onClick={e => { e.stopPropagation(); onEdit?.(p); }}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-[#94A3B5] hover:bg-[#EEF3FE] hover:text-[#3C80F5] transition-colors"
                        >
                            <Pencil size={12} />
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); setError(""); setOpen(true); }}
                            className="w-6 h-6 flex items-center justify-center rounded-lg text-[#94A3B5] hover:bg-[#FCEDED] hover:text-[#DC2626] transition-colors"
                        >
                            <Trash2 size={12} />
                        </button>
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-black", PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.LOW)}>
                            {priority === "URGENT" ? "HIGH" : priority}
                        </span>
                    </div>
                </div>

                {/* Project name + client */}
                <div>
                    <h3 className="text-[15px] font-bold text-[#1B2330] leading-snug">{p.name}</h3>
                    <p className="text-[12.5px] text-[#69788C] mt-0.5">{p.client?.companyName?.trim() ?? "—"}</p>
                </div>

                {/* Type tag */}
                {p.type && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EEF1F6] text-[11.5px] font-semibold text-[#69788C] w-fit">
                        <TypeIcon size={13} className="shrink-0" />
                        {typeLabel(p.type)}
                    </span>
                )}

                {/* Description */}
                {p.description && (
                    <p className="text-[12.5px] text-[#69788C] leading-snug line-clamp-2">
                        {stripHtml(p.description)}
                    </p>
                )}

                {/* Progress bar */}
                <div>
                    <div className="w-full h-1.5 bg-[#EEF1F6] rounded-full overflow-hidden">
                        <div
                            className={cn("h-full rounded-full", isAtRisk
                                ? "bg-gradient-to-r from-[#F87171] to-[#DC2626]"
                                : "bg-gradient-to-r from-[#3C80F5] to-[#763CF6]"
                            )}
                            style={{ width: `${p.progressPercentage ?? 0}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[12px] text-[#69788C]">{p.progressPercentage ?? 0}% complete</span>
                        {dueDate && <span className="text-[12px] text-[#69788C]">Due {dueDate}</span>}
                    </div>
                </div>

                {/* Bottom row — status + health + avatars */}
                <div className="flex items-center justify-between pt-1 border-t border-[#EEF1F6]">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#69788C]">
                            <span className={cn("w-2 h-2 rounded-full", status.dot)} />
                            {status.label}
                        </span>
                        <span className={cn("flex items-center gap-1.5 text-[12px] font-semibold", health.text)}>
                            <span className={cn("w-2 h-2 rounded-full", health.dot)} />
                            {health.label}
                        </span>
                    </div>
                    <MemberAvatars members={p.members ?? []} />
                </div>
            </div>

            {/* Delete confirm */}
            <AlertDialog open={open} onOpenChange={o => { if (!o) { setOpen(false); setError(""); } }}>
                <AlertDialogContent className="rounded-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">"{p.name}"</span>? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {error && <p className="text-xs text-destructive font-medium px-1 -mt-2">{error}</p>}
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl cursor-pointer" disabled={loading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={loading}
                            className="rounded-xl bg-destructive hover:bg-red-700 cursor-pointer">
                            {loading ? <span className="flex items-center gap-2"><Loader2 size={13} className="animate-spin" />Deleting...</span> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}