"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import TicketCard from "@/components/tickets/TicketCard";
import TicketForm from "@/components/tickets/TicketForm";

const STATUS_OPTS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const STATUS_STYLES = {
    OPEN:        "bg-[#EEF3FE] text-[#3C80F5]",
    IN_PROGRESS: "bg-[#FDF3E2] text-[#E08600]",
    RESOLVED:    "bg-[#EAF7EE] text-[#16A34A]",
    CLOSED:      "bg-[#EEF1F6] text-[#69788C]",
};

const PRIORITY_STYLES = {
    LOW:    "bg-[#EEF1F6] text-[#69788C]",
    MEDIUM: "bg-[#FDF3E2] text-[#E08600]",
    HIGH:   "bg-[#FCEDED] text-[#DC2626]",
    URGENT: "bg-[#DC2626] text-white",
};

function timeAgo(d) {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

/* ── Inline ticket detail view ── */
function TicketDetail({ ticket, onBack, onUpdated, employees, isAdmin }) {
    const [reply,      setReply]      = useState("");
    const [status,     setStatus]     = useState(ticket.status ?? "OPEN");
    const [assigneeId, setAssigneeId] = useState(ticket.assignee?.id ?? "");
    const [saving,     setSaving]     = useState(false);

    const code          = ticket.code ?? `TKT-${ticket.id?.slice(-3).toUpperCase()}`;
    const raisedBy      = ticket.raisedBy?.legalName  ?? ticket.raisedBy?.name  ?? "Unknown";
    const assigneeName  = ticket.assignee?.legalName   ?? ticket.assignee?.name  ?? "Unassigned";
    const conversations = ticket.conversations ?? ticket.replies ?? [];

    async function saveManage() {
        setSaving(true);
        try {
            const body = { status };
            if (isAdmin && assigneeId) body.assigneeId = assigneeId;
            await apiFetch(`/api/tickets/${ticket.id}`, { method: "PUT", body: JSON.stringify(body) });
            toast.success({ title: "Ticket updated" });
            onUpdated();
        } catch (e) {
            toast.error({ title: "Update failed", message: e.message });
        } finally { setSaving(false); }
    }

    const statusStyle   = STATUS_STYLES[ticket.status]   ?? STATUS_STYLES.OPEN;
    const priorityStyle = PRIORITY_STYLES[ticket.priority] ?? PRIORITY_STYLES.LOW;

    return (
        <div>
            <button onClick={onBack}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-[#69788C] hover:text-[#1B2330] mb-5 transition-colors">
                ← Back to tickets
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">

                {/* Main */}
                <div className="space-y-4">

                    {/* Header card */}
                    <div className="bg-white border border-[#E7EBF2] rounded-2xl px-6 py-5 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                        <p className="text-[11px] font-bold text-[#94A3B5] mb-1">{code}</p>
                        <h2 className="text-[22px] font-black text-[#1B2330] tracking-[-0.3px] mb-4">{ticket.subject}</h2>

                        {/* Meta row */}
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 pb-4 border-b border-[#EEF1F6]">
                            <div>
                                <p className="text-[10px] tracking-[1.1px] font-bold text-[#94A3B5] mb-1">STATUS</p>
                                <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[11.5px] font-semibold", statusStyle)}>
                                    {(ticket.status ?? "OPEN").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] tracking-[1.1px] font-bold text-[#94A3B5] mb-1">PRIORITY</p>
                                <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[11.5px] font-bold", priorityStyle)}>
                                    {ticket.priority}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] tracking-[1.1px] font-bold text-[#94A3B5] mb-1">RAISED BY</p>
                                <span className="text-[13px] font-semibold text-[#1B2330]">{raisedBy}</span>
                            </div>
                            <div>
                                <p className="text-[10px] tracking-[1.1px] font-bold text-[#94A3B5] mb-1">AGE</p>
                                <span className="text-[13px] font-semibold text-[#1B2330]">{timeAgo(ticket.createdAt)}</span>
                            </div>
                            <div>
                                <p className="text-[10px] tracking-[1.1px] font-bold text-[#94A3B5] mb-1">ASSIGNEE</p>
                                <span className="text-[13px] font-semibold text-[#1B2330]">{assigneeName}</span>
                            </div>
                        </div>

                        {/* Description */}
                        {ticket.details && (
                            <div className="mt-4">
                                <p className="text-[10px] tracking-[1.2px] font-bold text-[#94A3B5] mb-2">DESCRIPTION</p>
                                <p className="text-[13.5px] text-[#1B2330] leading-relaxed">{ticket.details}</p>
                            </div>
                        )}
                    </div>

                    {/* Conversation */}
                    <div className="bg-white border border-[#E7EBF2] rounded-2xl px-6 py-5 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                        <p className="text-[10px] tracking-[1.4px] font-bold text-[#94A3B5] mb-4">CONVERSATION</p>

                        {conversations.length === 0 && (
                            <p className="text-[13px] text-[#94A3B5] mb-4">No replies yet. Be the first to respond.</p>
                        )}

                        <div className="space-y-4 mb-5">
                            {conversations.map((c, i) => {
                                const name = c.author?.legalName ?? c.author?.name ?? "Team";
                                const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
                                return (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3C80F5] to-[#763CF6] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                                            {initials}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[13px] font-bold text-[#1B2330]">{name}</span>
                                                <span className="text-[11.5px] text-[#94A3B5]">{timeAgo(c.createdAt)}</span>
                                            </div>
                                            <p className="text-[13px] text-[#69788C]">{c.message ?? c.text}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Reply box */}
                        <div className="flex gap-3">
                            <input
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                placeholder="Write a reply..."
                                className="flex-1 h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none focus:border-[#3C80F5]"
                            />
                            <button
                                onClick={() => { if (reply.trim()) { toast.success({ title: "Reply sent" }); setReply(""); } }}
                                className="px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                        <p className="text-[10px] tracking-[1.4px] font-bold text-[#94A3B5] mb-4">MANAGE</p>
                        <div className="space-y-3">
                            <div>
                                <p className="text-[12px] font-semibold text-[#1B2330] mb-1.5">Status</p>
                                <select value={status} onChange={e => setStatus(e.target.value)}
                                    className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] outline-none focus:border-[#3C80F5]">
                                    {["OPEN","IN_PROGRESS","RESOLVED","CLOSED"].map(o => (
                                        <option key={o} value={o}>{o.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
                                    ))}
                                </select>
                            </div>
                            {isAdmin && (
                                <div>
                                    <p className="text-[12px] font-semibold text-[#1B2330] mb-1.5">Assignee</p>
                                    <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)}
                                        className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] outline-none focus:border-[#3C80F5]">
                                        <option value="">Unassigned</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.legalName ?? emp.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <button onClick={saveManage} disabled={saving}
                                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-60">
                                {saving && <Loader2 size={13} className="animate-spin" />}
                                Save changes
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                        <p className="text-[10px] tracking-[1.4px] font-bold text-[#94A3B5] mb-4">DETAILS</p>
                        <div className="space-y-0">
                            {[
                                { label: "TICKET ID", value: code },
                                { label: "REPLIES",   value: conversations.length },
                                { label: "CREATED",   value: ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                            ].map(d => (
                                <div key={d.label} className="flex items-center justify-between py-2.5 border-b border-[#EEF1F6] last:border-0">
                                    <span className="text-[11px] tracking-[1px] font-bold text-[#94A3B5]">{d.label}</span>
                                    <span className="text-[13px] font-bold text-[#1B2330]">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Main export ── */
export default function ProjectTickets({ projectId }) {
    const [tickets,      setTickets]      = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState("");
    const [showForm,     setShowForm]     = useState(false);
    const [editTicket,   setEditTicket]   = useState(null);
    const [viewTicket,   setViewTicket]   = useState(null);
    const [employees,    setEmployees]    = useState([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [isAdmin,      setIsAdmin]      = useState(false);

    useEffect(() => {
        try {
            const user = JSON.parse(localStorage.getItem("crm_user") ?? "{}");
            setIsAdmin(user.role === "admin" || user.role === "ADMIN");
        } catch {}
    }, []);

    const fetchTickets = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const qs   = statusFilter ? `&status=${statusFilter}` : "";
            const json = await apiFetch(`/api/tickets/project/${projectId}?page=1&limit=50${qs}`);
            setTickets(json.data ?? []);
        } catch (e) {
            setError(e.message);
        } finally { setLoading(false); }
    }, [projectId, statusFilter]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    useEffect(() => {
        apiFetch("/api/employees?limit=100").then(j => setEmployees(j.data ?? [])).catch(() => {});
    }, []);

    function handleDeleted(id) { setTickets(prev => prev.filter(t => t.id !== id)); }

    /* Ticket detail view */
    if (viewTicket) {
        return (
            <TicketDetail
                ticket={viewTicket}
                onBack={() => setViewTicket(null)}
                onUpdated={() => { fetchTickets(); setViewTicket(null); }}
                employees={employees}
                isAdmin={isAdmin}
            />
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] text-[#69788C]">Tickets for this project.</p>
                    <div className="flex gap-1.5 ml-1">
                        {["", ...STATUS_OPTS].map(s => (
                            <button key={s} onClick={() => setStatusFilter(s)}
                                className={cn(
                                    "px-2.5 py-1 rounded-full text-[11.5px] font-semibold transition-colors",
                                    statusFilter === s
                                        ? "bg-[#3C80F5] text-white"
                                        : "bg-[#EEF1F6] text-[#69788C] hover:bg-[#E2E8F0]"
                                )}>
                                {s === "" ? "All" : s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => { setEditTicket(null); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity shadow-sm shadow-[#3C80F5]/25"
                >
                    <Plus size={14} /> Raise a ticket
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-16 gap-3 text-[#94A3B5]">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-[13px]">Loading tickets...</span>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-[13px] font-medium">{error}</p>
                    <button onClick={fetchTickets} className="ml-auto text-[12.5px] font-bold underline">Retry</button>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && tickets.length === 0 && (
                <div className="text-center py-16 text-[#94A3B5]">
                    <p className="text-[14px] font-semibold">No tickets found</p>
                    <p className="text-[12.5px] mt-1">Click "Raise a ticket" to create the first one.</p>
                </div>
            )}

            {/* List */}
            {!loading && !error && tickets.length > 0 && (
                <div className="space-y-3">
                    {tickets.map(ticket => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            isAdmin={isAdmin}
                            onEdit={t  => { setEditTicket(t); setShowForm(true); }}
                            onDelete={handleDeleted}
                            onView={setViewTicket}
                        />
                    ))}
                </div>
            )}

            {/* Form modal */}
            {showForm && (
                <TicketForm
                    projectId={projectId}
                    editData={editTicket}
                    employees={employees}
                    isAdmin={isAdmin}
                    onClose={() => { setShowForm(false); setEditTicket(null); }}
                    onSuccess={fetchTickets}
                />
            )}
        </div>
    );
}