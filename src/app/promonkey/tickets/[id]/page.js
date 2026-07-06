"use client";
import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES = {
    URGENT: "bg-[#FCEDED] text-[#DC2626] border border-[#F3C9C9]",
    HIGH:   "bg-[#FCEDED] text-[#DC2626] border border-[#F3C9C9]",
    MEDIUM: "bg-[#FDF3E2] text-[#E08600] border border-[#FDE68A]",
    LOW:    "bg-[#EEF1F6] text-[#69788C] border border-[#E7EBF2]",
};

const STATUS_LABELS = {
    OPEN: "Open",
    IN_PROGRESS: "In progress",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
};

function fmtAgo(d) {
    if (!d) return "—";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
}

function MetaBlock({ label, children }) {
    return (
        <div>
            <p className="text-[10px] tracking-[1.2px] font-bold text-[#94A3B5] mb-2 uppercase">{label}</p>
            <div className="text-[13.5px] font-semibold text-[#1B2330]">{children}</div>
        </div>
    );
}

function Avatar({ name, color = "bg-[#763CF6]" }) {
    const initials = (name ?? "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
    return (
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0", color)}>
            {initials}
        </div>
    );
}

export default function TicketDetailPage({ params }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const resolvedParams = typeof params?.then === "function" ? use(params) : params;
    const id = resolvedParams?.id;
    const projectId = searchParams.get("projectId");

    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    
    // Form and interaction state
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [updatingMeta, setUpdatingMeta] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState(null);

    async function loadTicket() {
        try {
            const json = await apiFetch(`/api/tickets/${id}`);
            setTicket(json.data ?? json);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (id) loadTicket();
    }, [id]);

    const handleStatusOrAssigneeChange = async (field, value) => {
        if (!ticket) return;
        setUpdatingMeta(true);
        try {
            const updatedData = { [field]: value };
            const json = await apiFetch(`/api/tickets/${id}`, {
                method: "PUT",
                body: JSON.stringify(updatedData)
            });
            setTicket(json.data ?? json);
        } catch (e) {
            alert(`Failed to update ticket: ${e.message}`);
        } finally { setUpdatingMeta(false); }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setSubmittingComment(true);
        try {
            await apiFetch(`/api/tickets/${id}/comments`, {
                method: "POST",
                body: JSON.stringify({ text: commentText })
            });
            setCommentText("");
            // Re-fetch ticket to accurately populate nested creator fields inside comments
            await loadTicket();
        } catch (e) {
            alert(`Failed to post comment: ${e.message}`);
        } finally { setSubmittingComment(false); }
    };

    const handleDeleteComment = async (commentId) => {
        if (!confirm("Are you sure you want to delete this comment?")) return;
        setDeletingCommentId(commentId);
        try {
            await apiFetch(`/api/tickets/comments/${commentId}`, {
                method: "DELETE"
            });
            // Update UI by filtering out the deleted comment locally
            setTicket(prev => ({
                ...prev,
                comments: (prev.comments ?? []).filter(c => c.id !== commentId)
            }));
        } catch (e) {
            alert(`Failed to delete comment: ${e.message}`);
        } finally { setDeletingCommentId(null); }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-32 gap-3 text-[#94A3B5]">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[13px]">Loading ticket data...</span>
        </div>
    );

    if (error || !ticket) return (
        <div className="max-w-[1100px] mx-auto pt-6">
            <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[13px] font-medium">{error || "Ticket lookup failed."}</p>
                <button onClick={() => router.back()} className="ml-auto text-[12.5px] font-bold underline">
                    Go Back
                </button>
            </div>
        </div>
    );

    const t = ticket;
    const priority = t.priority ?? "LOW";
    
    const creatorName = t.creator?.employeeProfile?.legalName 
        ?? t.creator?.clientProfile?.companyName 
        ?? t.creator?.email 
        ?? "System User";

    const assigneeName = t.assignee?.legalName 
        ?? t.assignee?.email 
        ?? "Unassigned";

    return (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            
            {/* Back Arrow */}
            <button 
                onClick={() => projectId ? router.push(`/promonkey/projects/${projectId}`) : router.back()}
                className="flex items-center gap-2 text-[13px] font-semibold text-[#69788C] hover:text-[#1B2330] mb-5 transition-colors"
            >
                <ArrowLeft size={14} /> Back to {t.project?.name ?? "project"}
            </button>

            {/* Layout Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">
                
                {/* Left primary information column */}
                <div className="space-y-4">
                    
                    {/* Ticket Header Metadata Card */}
                    <div className="bg-white border border-[#E7EBF2] rounded-2xl p-6 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                        <p className="text-[12px] text-[#94A3B5] font-semibold mb-1">
                            {t.ticketNumber} · {t.project?.name}
                        </p>
                        <h1 className="text-[22px] font-black text-[#1B2330] tracking-[-0.4px] mb-6">
                            {t.subject}
                        </h1>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 pt-2">
                            <MetaBlock label="Status">
                                <span className={cn(
                                    "inline-flex px-2 py-0.5 rounded-lg text-[11.5px] font-bold",
                                    t.status === "IN_PROGRESS" ? "bg-[#FDF3E2] text-[#E08600]" : "bg-[#EEF1F6] text-[#69788C]"
                                )}>
                                    {STATUS_LABELS[t.status] ?? t.status}
                                </span>
                            </MetaBlock>
                            
                            <MetaBlock label="Priority">
                                <span className={cn("inline-flex px-2 py-0.5 rounded-lg text-[11.5px] font-bold", PRIORITY_STYLES[priority])}>
                                    {priority === "URGENT" ? "HIGH" : priority}
                                </span>
                            </MetaBlock>

                            <MetaBlock label="Project">
                                <span className="text-[#1B2330] font-medium truncate block max-w-[140px]">
                                    {t.project?.name}
                                </span>
                            </MetaBlock>

                            <MetaBlock label="Raised By">
                                <span className="text-[#1B2330] font-medium">{creatorName}</span>
                            </MetaBlock>

                            <MetaBlock label="Age">
                                <span className="text-[#1B2330] font-medium">{fmtAgo(t.createdAt)}</span>
                            </MetaBlock>
                        </div>

                        {/* Description field */}
                        <div className="mt-8 pt-6 border-t border-[#EEF1F6]">
                            <p className="text-[10px] tracking-[1.2px] font-bold text-[#94A3B5] mb-2">DESCRIPTION</p>
                            <p className="text-[13.5px] text-[#1B2330] leading-relaxed whitespace-pre-wrap">
                                {t.details || "No descriptive payload text provided."}
                            </p>
                        </div>
                    </div>

                    {/* Conversation thread timeline card */}
                    <div className="bg-white border border-[#E7EBF2] rounded-2xl p-6 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                        <p className="text-[10px] tracking-[1.2px] font-bold text-[#94A3B5] mb-6">CONVERSATION</p>
                        
                        {/* Comments rendering list loop */}
                        <div className="space-y-6 mb-6">
                            {(t.comments ?? []).map((comment) => {
                                const commentAuthor = comment.user?.legalName 
                                    ?? comment.user?.employeeProfile?.legalName 
                                    ?? comment.user?.email 
                                    ?? "Team Member";
                                    
                                const isDeleting = deletingCommentId === comment.id;

                                return (
                                    <div key={comment.id} className="flex items-start gap-3 group">
                                        <Avatar name={commentAuthor} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] font-bold text-[#1B2330]">{commentAuthor}</span>
                                                    <span className="text-[11.5px] text-[#94A3B5]">{fmtAgo(comment.createdAt)}</span>
                                                </div>
                                                
                                                {/* Delete Button (Visible on Hover) */}
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    disabled={isDeleting}
                                                    className="opacity-0 group-hover:opacity-100 text-[#94A3B5] hover:text-[#DC2626] transition-all p-1 rounded-md hover:bg-[#FCEDED]"
                                                    title="Delete Comment"
                                                >
                                                    {isDeleting ? (
                                                        <Loader2 size={13} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={13} />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-[13.5px] text-[#69788C] leading-relaxed whitespace-pre-wrap">
                                                {comment.text}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Reply Text Submission workflow Area */}
                        <form onSubmit={handleAddComment} className="flex gap-3 items-end border border-[#E7EBF2] rounded-xl p-2 bg-white focus-within:border-[#3C80F5] transition-colors">
                            <input 
                                type="text"
                                placeholder="Write a reply..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                disabled={submittingComment}
                                className="flex-1 bg-transparent px-3 py-2 text-[13.5px] text-[#1B2330] outline-none placeholder-[#94A3B5]"
                            />
                            <button
                                type="submit"
                                disabled={submittingComment || !commentText.trim()}
                                className="px-4 py-2 bg-gradient-to-r from-[#3C80F5] to-[#763CF6] text-white text-[13px] font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 shrink-0"
                            >
                                {submittingComment ? "Sending..." : "Send"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right sidebar context panel */}
                <div className="space-y-4">
                    
                    {/* Management Controls Box */}
                    <div className="bg-white border border-[#E7EBF2] rounded-2xl p-5 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                        <p className="text-[10px] tracking-[1.2px] font-bold text-[#94A3B5] mb-4">MANAGE</p>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11.5px] text-[#69788C] font-semibold mb-1.5">Status</label>
                                <select
                                    value={t.status}
                                    disabled={updatingMeta}
                                    onChange={(e) => handleStatusOrAssigneeChange("status", e.target.value)}
                                    className="w-full h-10 px-3 border border-[#E7EBF2] bg-white text-[13px] rounded-xl outline-none focus:border-[#3C80F5] font-semibold text-[#1B2330] transition-colors"
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11.5px] text-[#69788C] font-semibold mb-1.5">Assignee</label>
                                <select
                                    value={t.assigneeId ?? ""}
                                    disabled={updatingMeta}
                                    onChange={(e) => handleStatusOrAssigneeChange("assigneeId", e.target.value || null)}
                                    className="w-full h-10 px-3 border border-[#E7EBF2] bg-white text-[13px] rounded-xl outline-none focus:border-[#3C80F5] font-semibold text-[#1B2330] transition-colors"
                                >
                                    <option value="">Unassigned</option>
                                    {t.assigneeId && (
                                        <option value={t.assigneeId}>{assigneeName}</option>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Immutable stats specs */}
                    <div className="bg-white border border-[#E7EBF2] rounded-2xl p-5 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                        <p className="text-[10px] tracking-[1.2px] font-bold text-[#94A3B5] mb-4">DETAILS</p>
                        
                        <div className="space-y-3 text-[13px]">
                            <div className="flex justify-between py-1.5 border-b border-[#EEF1F6]">
                                <span className="text-[#69788C]">Ticket ID</span>
                                <span className="font-bold text-[#1B2330] select-all">{t.ticketNumber}</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-[#69788C]">Replies</span>
                                <span className="font-bold text-[#1B2330]">{t.comments?.length ?? 0}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}