"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Loader2, AlertCircle, Filter, X, ChevronLeft, ChevronRight,
    FileText, Trash2, Pencil, CheckSquare, CheckCircle2, MessageSquare,
    XCircle, Ticket, Lock, Flag, UserPlus, UserMinus, Rocket, Circle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ── Action icon + colour map ── */
const ACTION_META = {
    CREATED_PHASE:    { icon: FileText,      color: "bg-[#EEF3FE] text-[#3C80F5]" },
    DELETED_PHASE:    { icon: Trash2,        color: "bg-[#FCEDED] text-[#DC2626]" },
    UPDATED_PHASE:    { icon: Pencil,        color: "bg-[#FDF3E2] text-[#E08600]" },
    CREATED_TASK:     { icon: CheckSquare,   color: "bg-[#EAF7EE] text-[#16A34A]" },
    DELETED_TASK:     { icon: Trash2,        color: "bg-[#FCEDED] text-[#DC2626]" },
    UPDATED_TASK:     { icon: Pencil,        color: "bg-[#FDF3E2] text-[#E08600]" },
    COMPLETED_TASK:   { icon: CheckCircle2,  color: "bg-[#EAF7EE] text-[#16A34A]" },
    POSTED_UPDATE:    { icon: MessageSquare, color: "bg-[#EEF3FE] text-[#3C80F5]" },
    APPROVED_UPDATE:  { icon: CheckCircle2,  color: "bg-[#EAF7EE] text-[#16A34A]" },
    REJECTED_UPDATE:  { icon: XCircle,       color: "bg-[#FCEDED] text-[#DC2626]" },
    RAISED_TICKET:    { icon: Ticket,        color: "bg-[#EEF3FE] text-[#3C80F5]" },
    CLOSED_TICKET:    { icon: Lock,          color: "bg-[#EEF1F6] text-[#69788C]" },
    FLAGGED_HEALTH:   { icon: Flag,          color: "bg-[#FCEDED] text-[#DC2626]" },
    ADDED_MEMBER:     { icon: UserPlus,      color: "bg-[#EAF7EE] text-[#16A34A]" },
    REMOVED_MEMBER:   { icon: UserMinus,     color: "bg-[#FCEDED] text-[#DC2626]" },
    CREATED_PROJECT:  { icon: Rocket,        color: "bg-[#EEF3FE] text-[#3C80F5]" },
    DEFAULT:          { icon: Circle,        color: "bg-[#EEF1F6] text-[#69788C]" },
};

function getAction(action = "") {
    return ACTION_META[action] ?? ACTION_META.DEFAULT;
}

/* ── Helpers ── */
const COLORS = [
    "from-[#3C80F5] to-[#763CF6]","from-[#763CF6] to-[#3C80F5]",
    "from-[#16A34A] to-[#3C80F5]","from-[#E08600] to-[#763CF6]",
    "from-[#DC2626] to-[#E08600]","from-[#0891B2] to-[#3C80F5]",
];
function colorFor(name = "") {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return COLORS[h % COLORS.length];
}
function initials(name = "") {
    return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}
function fmtAgo(d) {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 2)   return "just now";
    if (mins < 60)  return `${mins} minutes ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)   return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    if (days < 7)   return `${days} days ago`;
    return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDate(d) {
    return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}
function isSameDay(a, b) {
    const da = new Date(a), db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}
/* "2026-07-13" (from <input type="date">) -> compare against an ISO datetime string's local day */
function matchesDate(isoString, dateStr) {
    if (!dateStr) return true;
    const d = new Date(isoString);
    const [y, m, day] = dateStr.split("-").map(Number);
    return d.getFullYear() === y && d.getMonth() + 1 === m && d.getDate() === day;
}

/* ── Avatar ── */
function Avatar({ name, photoUrl }) {
    const [imgErr, setImgErr] = useState(false);
    if (photoUrl && !imgErr) {
        return (
            <img src={photoUrl} alt={name} onError={() => setImgErr(true)}
                className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
        );
    }
    return (
        <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[12px] font-bold shrink-0 border-2 border-white shadow-sm", colorFor(name))}>
            {initials(name)}
        </div>
    );
}

/* ── Date separator ── */
function DateSeparator({ date }) {
    return (
        <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-[#EEF1F6]" />
            <span className="text-[11.5px] font-semibold text-[#94A3B5] px-2">{fmtDate(date)}</span>
            <div className="flex-1 h-px bg-[#EEF1F6]" />
        </div>
    );
}

const PAGE_SIZE = 10;

/* ════════════════════ Main ════════════════════ */
export default function ActivityTab({ projectId }) {
    const [logs,    setLogs]    = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");

    /* filter — single specific date, e.g. "2026-07-13" */
    const [filterDate, setFilterDate] = useState("");
    const [page,        setPage]      = useState(1);

    /* fetch */
    const fetch = useCallback(async () => {
        if (!projectId) return;
        setLoading(true); setError("");
        try {
            const json = await apiFetch(`/api/projects/${projectId}/activity`);
            setLogs(json.data ?? []);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, [projectId]);

    useEffect(() => { fetch(); }, [fetch]);

    /* client-side single-date filter */
    const filtered = useMemo(() => {
        if (!filterDate) return logs;
        return logs.filter(l => matchesDate(l.createdAt, filterDate));
    }, [logs, filterDate]);

    /* client-side pagination */
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    function clearFilters() { setFilterDate(""); setPage(1); }
    const hasFilter = !!filterDate;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            <div>
                {/* Card */}
                <div className="bg-white border border-[#E7EBF2] rounded-2xl shadow-[0_1px_2px_rgba(27,35,48,.06)] overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#EEF1F6]">
                        <p className="text-[10.5px] tracking-[1.4px] font-bold text-[#94A3B5]">PROJECT ACTIVITY LOG</p>
                        <div className="flex items-center gap-2">
                            {hasFilter && (
                                <button onClick={clearFilters}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FCEDED] text-[11.5px] font-semibold text-[#DC2626] hover:bg-[#F3C9C9] transition-colors">
                                    <X size={11} /> Clear filter
                                </button>
                            )}
                            {/* Single date filter */}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC]">
                                <Filter size={12} className="text-[#94A3B5]" />
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={e => { setFilterDate(e.target.value); setPage(1); }}
                                    className="text-[12px] text-[#1B2330] bg-transparent outline-none cursor-pointer w-[130px]"
                                    placeholder="Filter by date"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-3">

                        {/* Loading */}
                        {loading && (
                            <div className="flex items-center justify-center py-16 gap-3 text-[#94A3B5]">
                                <Loader2 size={18} className="animate-spin" />
                                <span className="text-[13px]">Loading activity...</span>
                            </div>
                        )}

                        {/* Error */}
                        {!loading && error && (
                            <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-xl px-4 py-3 text-[#DC2626] my-3">
                                <AlertCircle size={15} className="shrink-0" />
                                <p className="text-[12.5px] font-medium">{error}</p>
                                <button onClick={fetch} className="ml-auto text-[12px] font-bold underline">Retry</button>
                            </div>
                        )}

                        {/* Empty */}
                        {!loading && !error && filtered.length === 0 && (
                            <div className="text-center py-16 text-[#94A3B5]">
                                <p className="text-[14px] font-semibold">No activity found</p>
                                <p className="text-[12.5px] mt-1">{hasFilter ? "No activity on this date." : "Activity will appear here as the project progresses."}</p>
                            </div>
                        )}

                        {/* Activity list with date separators */}
                        {!loading && !error && paged.length > 0 && (
                            <div className="py-2">
                                {paged.map((log, i) => {
                                    const prev   = paged[i - 1];
                                    const newDay = !prev || !isSameDay(log.createdAt, prev.createdAt);
                                    const { icon: ActionIcon, color } = getAction(log.action);

                                    return (
                                        <div key={log.id}>
                                            {newDay && <DateSeparator date={log.createdAt} />}

                                            <div className="flex items-start gap-3 py-3 border-b border-[#EEF1F6] last:border-0 group">
                                                {/* Avatar */}
                                                <Avatar name={log.actorName} photoUrl={log.actorPhoto} />

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start gap-2 flex-wrap">
                                                        {/* Action icon badge */}
                                                        <span className={cn("inline-flex items-center justify-center w-5 h-5 rounded-md shrink-0 mt-0.5", color)}>
                                                            <ActionIcon size={11} strokeWidth={2.5} />
                                                        </span>
                                                        <p className="text-[13px] text-[#1B2330] leading-snug flex-1">
                                                            {log.details}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[12px] font-semibold text-[#69788C]">{log.actorName}</span>
                                                        <span className="text-[#D1D9E6]">·</span>
                                                        <span className="text-[11.5px] text-[#94A3B5]">{fmtAgo(log.createdAt)}</span>
                                                        {log.actorRole && (
                                                            <>
                                                                <span className="text-[#D1D9E6]">·</span>
                                                                <span className={cn("inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold",
                                                                    log.actorRole === "ADMIN"    ? "bg-[#EEF3FE] text-[#3C80F5]" :
                                                                    log.actorRole === "EMPLOYEE" ? "bg-[#EEF1F6] text-[#69788C]" :
                                                                    "bg-[#FDF3E2] text-[#E08600]"
                                                                )}>
                                                                    {log.actorRole}
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Pagination footer */}
                    {!loading && !error && totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-[#EEF1F6] bg-[#F7F9FC]">
                            <p className="text-[12px] text-[#69788C]">
                                Showing <span className="font-semibold text-[#1B2330]">{(page - 1) * PAGE_SIZE + 1}</span>–
                                <span className="font-semibold text-[#1B2330]">{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
                                <span className="font-semibold text-[#1B2330]">{filtered.length}</span> activities
                            </p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                                    className={cn("w-7 h-7 flex items-center justify-center rounded-lg border border-[#E7EBF2] transition-colors",
                                        page === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-white hover:shadow-sm text-[#69788C]")}>
                                    <ChevronLeft size={13} />
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button key={i} onClick={() => setPage(i + 1)}
                                        className={cn("w-7 h-7 flex items-center justify-center rounded-lg text-[12px] font-semibold border transition-colors",
                                            page === i + 1
                                                ? "bg-[#3C80F5] border-[#3C80F5] text-white"
                                                : "border-transparent text-[#69788C] hover:bg-white hover:shadow-sm"
                                        )}>
                                        {i + 1}
                                    </button>
                                ))}
                                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                                    className={cn("w-7 h-7 flex items-center justify-center rounded-lg border border-[#E7EBF2] transition-colors",
                                        page === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-white hover:shadow-sm text-[#69788C]")}>
                                    <ChevronRight size={13} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right sidebar slot */}
            <div className="hidden lg:block" />
        </div>
    );
}