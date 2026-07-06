"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES = {
    HIGH:   "bg-[#FCEDED] text-[#DC2626] border border-[#F3C9C9]",
    URGENT: "bg-[#FCEDED] text-[#DC2626] border border-[#F3C9C9]",
    MEDIUM: "bg-[#FDF3E2] text-[#E08600] border border-[#FDE68A]",
    MED:    "bg-[#FDF3E2] text-[#E08600] border border-[#FDE68A]",
    LOW:    "bg-[#EEF1F6] text-[#69788C] border border-[#E7EBF2]",
};

const STATUS_STYLES = {
    COMPLETED:   "bg-[#EAF7EE] text-[#16A34A]",
    IN_PROGRESS: "bg-[#EEF3FE] text-[#3C80F5]",
    UPCOMING:    "bg-[#EEF1F6] text-[#69788C]",
};

const STATUS_LABELS = {
    COMPLETED:   "Completed",
    IN_PROGRESS: "In progress",
    UPCOMING:    "Upcoming",
};

function Avatar({ name, color = "from-[#3C80F5] to-[#763CF6]" }) {
    const initials = (name ?? "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div className={cn("w-6 h-6 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0 text-[10px]", color)}>
            {initials}
        </div>
    );
}

export default function PhaseCard({ phase, projectId, onEdit, onDelete }) {
    const router = useRouter();
    const [open,    setOpen]    = useState(false);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    const status   = phase.status   ?? "UPCOMING";
    const priority = phase.priority ?? "MED";
    const tasksTotal = phase.tasksTotal ?? 0;
    const tasksDone  = phase.tasksDone  ?? 0;
    const pct = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;

    async function confirmDelete(e) {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            await onDelete?.(phase);
            setOpen(false);
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }

    return (
        <>
            <div
                onClick={() => router.push(`/promonkey/phases/${phase.id}`)}
                className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06)] hover:shadow-[0_4px_20px_rgba(27,35,48,.08)] transition-shadow cursor-pointer flex flex-col"
            >
                {/* Top row */}
                <div className="flex items-start justify-between mb-2">
                    <p className="text-[10px] tracking-[1px] font-bold text-[#94A3B5]">PHASE {phase.number}</p>
                    <div className="flex items-center gap-2">
                        {/* Edit + Delete icons */}
                        <button
                            onClick={e => { e.stopPropagation(); onEdit?.(phase); }}
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
                        <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold", PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.LOW)}>
                            {priority === "URGENT" ? "HIGH" : priority}
                        </span>
                    </div>
                </div>

                {/* Name + dates */}
                <h3 className="text-[16px] font-black text-[#1B2330] leading-snug mb-0.5">{phase.name}</h3>
                <p className="text-[12.5px] text-[#94A3B5] mb-3">{phase.dates}</p>

                {/* Lead */}
                {phase.lead && (
                    <div className="flex items-center gap-2 mb-3">
                        <Avatar name={phase.lead.name} color={phase.lead.color} />
                        <span className="text-[12.5px] text-[#69788C]">
                            Lead: <span className="font-semibold text-[#1B2330]">{phase.lead.name}</span>
                        </span>
                    </div>
                )}

                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-[#EEF1F6] overflow-hidden mb-2.5">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[#3C80F5] to-[#763CF6]"
                        style={{ width: `${pct}%` }}
                    />
                </div>

                {/* Tasks / hours row */}
                <div className="flex items-center justify-between text-[12.5px] text-[#69788C] mb-4">
                    <span>{tasksDone}/{tasksTotal} tasks · {pct}%</span>
                    <span>{phase.hoursLogged ?? 0}/{phase.hoursEst ?? "—"} hrs</span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#EEF1F6]">
                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold", STATUS_STYLES[status] ?? STATUS_STYLES.UPCOMING)}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {STATUS_LABELS[status] ?? status}
                    </span>
                    <span className="text-[12.5px] font-bold text-[#3C80F5]">Open phase →</span>
                </div>
            </div>

            {/* Delete confirm */}
            <AlertDialog open={open} onOpenChange={o => { if (!o) { setOpen(false); setError(""); } }}>
                <AlertDialogContent className="rounded-2xl bg-white" onClick={e => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Phase</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">"{phase.name}"</span>? This cannot be undone.
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