"use client";
import { useRouter } from "next/navigation";
import { Pencil, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES = {
    HIGH:   "bg-[#FCEDED] text-[#DC2626] border border-[#F3C9C9]",
    URGENT: "bg-[#FCEDED] text-[#DC2626] border border-[#F3C9C9]",
    MEDIUM: "bg-[#FDF3E2] text-[#E08600] border border-[#FDE68A]",
    MED:    "bg-[#FDF3E2] text-[#E08600] border border-[#FDE68A]",
    LOW:    "bg-[#EEF1F6] text-[#69788C] border border-[#E7EBF2]",
};

const STATUS_STYLES = {
    OPEN:        "bg-[#EEF3FE] text-[#3C80F5]",
    IN_PROGRESS: "bg-[#FDF3E2] text-[#E08600]",
    RESOLVED:    "bg-[#EAF7EE] text-[#16A34A]",
    CLOSED:      "bg-[#EEF1F6] text-[#94A3B5]",
};

const STATUS_LABELS = {
    OPEN:        "Open",
    IN_PROGRESS: "In progress",
    RESOLVED:    "Resolved",
    CLOSED:      "Closed",
};

function fmtAgo(d) {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function Avatar({ name, size = 24 }) {
    const initials = (name ?? "?").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    return (
        <div
            style={{ width: size, height: size, fontSize: size * 0.42 }}
            className="rounded-full bg-gradient-to-br from-[#3C80F5] to-[#763CF6] flex items-center justify-center text-white font-bold shrink-0"
        >
            {initials}
        </div>
    );
}

export default function TicketCard({ ticket, projectId, onEdit }) {
    const router = useRouter();

    const priority = ticket.priority ?? "LOW";
    const status   = ticket.status   ?? "OPEN";

    // Helper to safely render user display names without rendering objects as children
    const getUserDisplay = (user) => {
        if (!user) return "";
        if (typeof user === "string") return user;
        return user.legalName ?? user.name ?? user.email ?? "Unknown";
    };

    const creator  = ticket.creator ?? ticket.raisedBy;
    const creatorName = getUserDisplay(creator);
    const assigneeName = getUserDisplay(ticket.assignee);

    return (
        <div
            onClick={() => router.push(`/promonkey/tickets/${ticket.id}?projectId=${projectId}`)}
            className="group border border-[#E7EBF2] rounded-2xl px-5 py-4 bg-white hover:shadow-[0_4px_20px_rgba(27,35,48,.08)] hover:border-[#D1D9E6] transition-all cursor-pointer"
        >
            {/* Top row: code + status/priority + edit */}
            <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                    <span className="text-[11.5px] font-bold text-[#94A3B5] tracking-wide">
                        {ticket.ticketNumber ?? ticket.code ?? `TKT-${ticket.id?.slice(-3).toUpperCase()}`}
                    </span>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", STATUS_STYLES[status] ?? STATUS_STYLES.OPEN)}>
                        {STATUS_LABELS[status] ?? status}
                    </span>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10.5px] font-bold", PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.LOW)}>
                        {priority === "URGENT" ? "HIGH" : priority}
                    </span>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onEdit?.(ticket); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B5] hover:bg-[#EEF3FE] hover:text-[#3C80F5] transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    aria-label="Edit ticket"
                >
                    <Pencil size={13} />
                </button>
            </div>

            {/* Subject */}
            <h3 className="text-[15px] font-bold text-[#1B2330] mb-1 leading-snug">
                {ticket.subject}
            </h3>

            {/* Details */}
            {ticket.details && (
                <p className="text-[12.5px] text-[#69788C] line-clamp-2 mb-3 leading-relaxed">
                    {ticket.details}
                </p>
            )}

            {/* Footer row */}
            <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-[#EEF1F6]">
                <div className="flex items-center gap-3 min-w-0 text-[12px] text-[#69788C]">
                    {creatorName && (
                        <span className="flex items-center gap-1.5 min-w-0">
                            <Avatar name={creatorName} />
                            <span className="truncate">{creatorName}</span>
                        </span>
                    )}
                    {ticket.createdAt && (
                        <span className="flex items-center gap-1 text-[#94A3B5] shrink-0">
                            <Clock size={11} /> {fmtAgo(ticket.createdAt)}
                        </span>
                    )}
                    {ticket.replyCount > 0 && (
                        <span className="flex items-center gap-1 text-[#94A3B5] shrink-0">
                            <MessageSquare size={11} /> {ticket.replyCount}
                        </span>
                    )}
                </div>

                {ticket.assignee ? (
                    <span className="flex items-center gap-1.5 shrink-0">
                        <Avatar name={assigneeName} />
                        <span className="text-[12px] font-semibold text-[#3C80F5]">{assigneeName}</span>
                    </span>
                ) : (
                    <span className="text-[12px] text-[#94A3B5] shrink-0">Unassigned</span>
                )}
            </div>
        </div>
    );
}