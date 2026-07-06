"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TipLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import {
    Bold, Italic, Underline as UnderlineIcon,
    Link2, List, ListOrdered,
    Video, Paperclip, ChevronDown, Loader2,
    Eye, EyeOff, Lock, Trash2, Send, X, FileText, Play,
} from "lucide-react";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "../ui/Toast";
import { useAuth } from "@/hooks/useAuth";

function useOutsideClick(ref, handler, enabled = true) {
    useEffect(() => {
        if (!enabled) return;
        function onClick(e) {
            if (ref.current && !ref.current.contains(e.target)) handler();
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, [ref, handler, enabled]);
}

function getAuthorName(author) {
    if (!author) return "User";
    return author.employeeProfile?.legalName
        ?? author.clientProfile?.contactName
        ?? author.clientProfile?.legalName
        ?? author.clientProfile?.companyName
        ?? author.name
        ?? (author.role === "ADMIN" ? "Admin" : author.role === "CLIENT" ? "Client" : "User");
}

function getAuthorRole(author) {
    if (!author) return "";
    return author.employeeProfile?.designation ?? author.role ?? "";
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
    return `${days} days ago`;
}

function Avatar({ name = "?", color = "from-[#3C80F5] to-[#763CF6]", size = "md" }) {
    const initials = name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const sz = size === "sm" ? "w-8 h-8 text-[11px]" : "w-10 h-10 text-[12px]";
    return (
        <div className={cn("rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0", sz, color)}>
            {initials}
        </div>
    );
}

const COLORS = ["from-[#3C80F5] to-[#763CF6]","from-[#763CF6] to-[#3C80F5]","from-[#16A34A] to-[#3C80F5]","from-[#E08600] to-[#763CF6]","from-[#DC2626] to-[#E08600]"];

const APPROVAL_STYLES = {
    NONE:              null,
    PENDING:           { label: "Awaiting approval",   bg: "bg-[#FDF3E2] text-[#E08600]"  },
    APPROVED:          { label: "Approved",             bg: "bg-[#EAF7EE] text-[#16A34A]"  },
    REJECTED:          { label: "Rejected",             bg: "bg-[#FCEDED] text-[#DC2626]"  },
    REWORK_REQUESTED:  { label: "Rework requested",     bg: "bg-[#FCEDED] text-[#DC2626]"  },
};

function ToolbarBtn({ active, onClick, children }) {
    return (
        <button type="button" onClick={onClick}
            className={cn("w-7 h-7 flex items-center justify-center rounded transition-colors text-[#69788C]",
                active ? "bg-[#EEF3FE] text-[#3C80F5]" : "hover:bg-[#F7F9FC]")}>
            {children}
        </button>
    );
}

function EditorToolbar({ editor }) {
    if (!editor) return null;
    function addLink() {
        const url = prompt("URL:");
        if (url) editor.chain().focus().setLink({ href: url }).run();
    }
    return (
        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[#EEF1F6]">
            <ToolbarBtn active={editor.isActive("bold")}        onClick={() => editor.chain().focus().toggleBold().run()}>        <Bold size={13} /></ToolbarBtn>
            <ToolbarBtn active={editor.isActive("italic")}      onClick={() => editor.chain().focus().toggleItalic().run()}>      <Italic size={13} /></ToolbarBtn>
            <ToolbarBtn active={editor.isActive("underline")}   onClick={() => editor.chain().focus().toggleUnderline().run()}>   <UnderlineIcon size={13} /></ToolbarBtn>
            <div className="w-px h-4 bg-[#E7EBF2] mx-1" />
            <ToolbarBtn active={editor.isActive("bulletList")}  onClick={() => editor.chain().focus().toggleBulletList().run()}>  <List size={13} /></ToolbarBtn>
            <ToolbarBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}> <ListOrdered size={13} /></ToolbarBtn>
            <div className="w-px h-4 bg-[#E7EBF2] mx-1" />
            <ToolbarBtn active={editor.isActive("link")} onClick={addLink}> <Link2 size={13} /></ToolbarBtn>
        </div>
    );
}

function AttachmentChip({ file, onRemove }) {
    const isVideo = file.type?.startsWith("video/") || file.name?.match(/\.(mp4|mov|avi|webm)$/i);
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#EEF1F6] text-[12px] font-medium text-[#69788C] border border-[#E7EBF2]">
            {isVideo ? <Video size={12} /> : <Paperclip size={12} />}
            <span className="max-w-[120px] truncate">{file.name}</span>
            <button type="button" onClick={onRemove} className="text-[#94A3B5] hover:text-[#DC2626] ml-0.5">
                <X size={11} />
            </button>
        </span>
    );
}

function AttachmentDisplay({ attachment }) {
    const isVideo = attachment.type === "video" || attachment.name?.match(/\.(mp4|mov|avi|webm)$/i);
    return (
        <a href={attachment.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex flex-col w-[140px] rounded-xl overflow-hidden border border-[#E7EBF2] hover:shadow-md transition-shadow">
            {isVideo ? (
                <div className="h-[90px] bg-[#763CF6] flex items-center justify-center">
                    <Play size={24} fill="white" className="text-white" />
                </div>
            ) : (
                <div className="h-[90px] bg-[#F7F9FC] flex items-center justify-center">
                    <FileText size={24} className="text-[#94A3B5]" />
                </div>
            )}
            <div className="px-2 py-1.5 bg-white">
                <p className="text-[11px] text-[#69788C] truncate">{attachment.name}</p>
            </div>
        </a>
    );
}

/* ── Single update card ── */
function UpdateCard({ update, currentUser, projectLead, onDelete, onReply, onStatusChange }) {
    const [replyText, setReplyText] = useState("");
    const [replying,  setReplying]  = useState(false);
    const [showReply, setShowReply] = useState(false);
    const [deleting,  setDeleting]  = useState(false);
    const [deleteOpen,  setDeleteOpen]  = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [approvalOpen, setApprovalOpen] = useState(false);
    const approvalRef = useRef(null);
    useOutsideClick(approvalRef, () => setApprovalOpen(false), approvalOpen);

    const isAdmin  = currentUser?.role?.toLowerCase() === "admin";
    const isMine   = update.authorId === currentUser?.id;

    const authorName = getAuthorName(update.author);
    const authorRole = getAuthorRole(update.author);

    const approval = update.approvalStatus && update.approvalStatus !== "NONE"
        ? APPROVAL_STYLES[update.approvalStatus]
        : null;

    const approverName = update.assignedApprover?.legalName ?? "";

    async function sendReply() {
        if (!replyText.trim()) return;
        setReplying(true);
        try {
            await onReply(update.id, replyText);
            setReplyText("");
            setShowReply(false);
        } finally { setReplying(false); }
    }

    async function confirmDelete(e) {
        e.preventDefault();
        setDeleting(true); setDeleteError("");
        try {
            await onDelete(update.id);
            setDeleteOpen(false);
        } catch (err) { setDeleteError(err.message); }
        finally { setDeleting(false); }
    }

    const APPROVAL_OPTS = ["NONE","PENDING","APPROVED","REJECTED","REWORK_REQUESTED"];

    return (
        <>
        <div className="bg-white border border-[#E7EBF2] rounded-2xl p-5 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                    <Avatar name={authorName} color={COLORS[authorName.charCodeAt(0) % COLORS.length]} />
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[13.5px] font-bold text-[#1B2330]">{authorName}</span>
                            {authorRole && <span className="text-[12px] text-[#94A3B5]">{authorRole}</span>}
                        </div>
                        <p className="text-[11.5px] text-[#94A3B5]">{fmtAgo(update.createdAt)}</p>
                    </div>
                </div>
                {(isMine || isAdmin) && (
                    <button onClick={() => { setDeleteError(""); setDeleteOpen(true); }} disabled={deleting}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B5] hover:bg-[#FCEDED] hover:text-[#DC2626] transition-colors">
                        {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                )}
            </div>

            {/* Content */}
            {update.content && (
                <div className="text-[13.5px] text-[#1B2330] leading-relaxed mb-3 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: update.content }} />
            )}

            {/* Attachments */}
            {update.attachments?.length > 0 && (
                <div className="flex gap-3 flex-wrap mb-3">
                    {update.attachments.map((a, i) => (
                        <AttachmentDisplay key={i} attachment={a} />
                    ))}
                </div>
            )}

            {/* Status row */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-[#EEF1F6]">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Client view badge */}
                    {update.clientView ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EAF7EE] text-[11.5px] font-semibold text-[#16A34A]">
                            <Eye size={11} /> Visible to client
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF1F6] text-[11.5px] font-semibold text-[#69788C]">
                            <Lock size={11} /> Internal only
                        </span>
                    )}

                    {/* Approval badge */}
                    {approval && (
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold", approval.bg)}>
                            {approval.label}{approverName ? ` · ${approverName}` : ""}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Admin approval changer */}
                    {isAdmin && (
                        <div className="relative" ref={approvalRef}>
                            <button type="button" onClick={() => setApprovalOpen(o => !o)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E7EBF2] text-[12px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors">
                                Status <ChevronDown size={12} />
                            </button>
                            {approvalOpen && (
                                <div className="absolute bottom-full right-0 mb-1.5 bg-white border border-[#E7EBF2] rounded-xl shadow-lg z-20 overflow-hidden min-w-[180px]">
                                    {APPROVAL_OPTS.map(opt => (
                                        <button key={opt} type="button"
                                            onClick={() => { onStatusChange(update.id, opt); setApprovalOpen(false); }}
                                            className={cn("w-full text-left px-4 py-2.5 text-[12.5px] transition-colors",
                                                update.approvalStatus === opt ? "bg-[#EEF3FE] text-[#3C80F5] font-semibold" : "text-[#1B2330] hover:bg-[#F7F9FC]"
                                            )}>
                                            {opt === "NONE" ? "No approval" : opt.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Client view toggle (admin) */}
                    {isAdmin && (
                        <button onClick={() => onStatusChange(update.id, update.approvalStatus, !update.clientView)}
                            className="px-3 py-1.5 rounded-lg border border-[#E7EBF2] text-[12px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors">
                            {update.clientView ? "Hide from client" : "Publish to client"}
                        </button>
                    )}
                </div>
            </div>

            {/* Replies */}
            {update.replies?.length > 0 && (
                <div className="mt-3 space-y-3 pt-3 border-t border-[#EEF1F6]">
                    {update.replies.map((r, i) => {
                        const rName = getAuthorName(r.author);
                        return (
                            <div key={i} className="flex items-start gap-2.5">
                                <Avatar name={rName} size="sm" color={COLORS[rName.charCodeAt(0) % COLORS.length]} />
                                <div className="flex-1 min-w-0 bg-[#F7F9FC] rounded-xl px-3 py-2">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[12.5px] font-bold text-[#1B2330]">{rName}</span>
                                        <span className="text-[11px] text-[#94A3B5]">{fmtAgo(r.createdAt)}</span>
                                    </div>
                                    <p className="text-[12.5px] text-[#69788C]">{r.text ?? r.content ?? r.message}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reply box */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#EEF1F6]">
                <Avatar name={currentUser?.name ?? "?"} size="sm" color={COLORS[0]} />
                <input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendReply()}
                    placeholder="Reply..."
                    className="flex-1 h-9 px-3 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[12.5px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none focus:border-[#3C80F5]"
                />
                <button onClick={sendReply} disabled={replying || !replyText.trim()}
                    className="px-3 py-1.5 rounded-xl text-[12.5px] font-semibold text-[#69788C] border border-[#E7EBF2] hover:bg-[#F7F9FC] disabled:opacity-50 transition-colors">
                    {replying ? <Loader2 size={13} className="animate-spin" /> : "Reply"}
                </button>
            </div>
        </div>

        {/* Delete confirm */}
        <AlertDialog open={deleteOpen} onOpenChange={o => { if (!o) { setDeleteOpen(false); setDeleteError(""); } }}>
            <AlertDialogContent className="rounded-2xl bg-white">
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Update</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete this update? This cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {deleteError && <p className="text-xs text-destructive font-medium px-1 -mt-2">{deleteError}</p>}
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl cursor-pointer" disabled={deleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} disabled={deleting}
                        className="rounded-xl bg-destructive hover:bg-red-700 cursor-pointer">
                        {deleting ? <span className="flex items-center gap-2"><Loader2 size={13} className="animate-spin" />Deleting...</span> : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}

/* ── Main UpdatesTab ── */
export default function UpdatesTab({ projectId, projectLead }) {
    const { user } = useAuth();
    const isAdmin  = user?.role?.toLowerCase() === "admin";

    const [updates,      setUpdates]      = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [posting,      setPosting]      = useState(false);
    const [clientView,   setClientView]   = useState(false);
    const [approvalStatus, setApproval]   = useState("PENDING");
    const [approvalOpen, setApprovalOpen] = useState(false);
    const approvalRef = useRef(null);
    useOutsideClick(approvalRef, () => setApprovalOpen(false), approvalOpen);
    const [files,        setFiles]        = useState([]);    /* { file, type } */

    const videoRef = useRef(null);
    const fileRef  = useRef(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TipLink.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder: "Share an update... paste images or links, format text, then post." }),
        ],
    });

    /* fetch updates */
    const fetchUpdates = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const json = await apiFetch(`/api/updates/project/${projectId}`);
            setUpdates(json.data ?? []);
        } catch (e) {
            toast.error({ title: "Failed to load updates", message: e.message });
        } finally { setLoading(false); }
    }, [projectId]);

    useEffect(() => { fetchUpdates(); }, [fetchUpdates]);

    /* add files */
    function handleFiles(e, type) {
        const picked = Array.from(e.target.files ?? []);
        setFiles(prev => [...prev, ...picked.map(f => ({ file: f, type }))]);
        e.target.value = "";
    }
    function removeFile(i) { setFiles(prev => prev.filter((_, idx) => idx !== i)); }

    /* post update */
    async function handlePost() {
        const html = editor?.getHTML() ?? "";
        const text = editor?.getText() ?? "";
        if (!text.trim() && files.length === 0) {
            toast.error({ title: "Nothing to post", message: "Write something or attach a file." });
            return;
        }
        setPosting(true);
        try {
            const formData = new FormData();
            formData.append("content",    html);
            formData.append("projectId",  projectId);
            formData.append("clientView", String(clientView));
            formData.append("approvalStatus", approvalStatus);
            if (isAdmin && projectLead) {
                formData.append("assignedApproverId", projectLead);
            }
            files.forEach(({ file }) => formData.append("files", file));

            await apiFetch("/api/updates/create", { method: "POST", body: formData });
            editor?.commands.clearContent();
            setFiles([]);
            setClientView(false);
            setApproval("PENDING");
            toast.success({ title: "Update posted" });
            fetchUpdates();
        } catch (e) {
            toast.error({ title: "Failed to post update", message: e.message });
        } finally { setPosting(false); }
    }

    /* delete update */
    async function handleDelete(updateId) {
        try {
            await apiFetch(`/api/updates/${updateId}`, { method: "DELETE" });
            setUpdates(prev => prev.filter(u => u.id !== updateId));
            toast.success({ title: "Update deleted" });
        } catch (e) {
            toast.error({ title: "Delete failed", message: e.message });
        }
    }

    /* reply */
    async function handleReply(updateId, text) {
        await apiFetch(`/api/updates/${updateId}/reply`, {
            method: "POST",
            body: JSON.stringify({ text }),
        });
        fetchUpdates();
    }

    /* status / clientView change */
    async function handleStatusChange(updateId, newApproval, newClientView) {
        try {
            const body = {};
            if (newApproval !== undefined) body.approvalStatus = newApproval;
            if (newClientView !== undefined) body.clientView   = newClientView;
            await apiFetch(`/api/updates/${updateId}/status`, {
                method: "PATCH",
                body: JSON.stringify(body),
            });
            fetchUpdates();
        } catch (e) {
            toast.error({ title: "Update failed", message: e.message });
        }
    }

    const APPROVAL_OPTS = [
        { value: "NONE",             label: "— none —" },
        { value: "PENDING",          label: "Pending approval" },
        { value: "APPROVED",         label: "Approved" },
        { value: "REJECTED",         label: "Rejected" },
        { value: "REWORK_REQUESTED", label: "Rework requested" },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            <div className="space-y-4">

                {/* Compose box */}
                <div className="bg-white border border-[#E7EBF2] rounded-2xl shadow-[0_1px_2px_rgba(27,35,48,.06)] overflow-hidden">
                    <div className="flex items-start gap-3 p-4 pb-0">
                        <Avatar name={user?.name ?? "?"} color={COLORS[0]} />
                        <div className="flex-1 min-w-0">
                            <EditorToolbar editor={editor} />
                            <EditorContent editor={editor}
                                className="min-h-[100px] px-1 py-2 text-[13.5px] text-[#1B2330] prose prose-sm max-w-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[80px]" />

                            {/* File chips */}
                            {files.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2 pb-2">
                                    {files.map((f, i) => (
                                        <AttachmentChip key={i} file={f.file} onRemove={() => removeFile(i)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer toolbar */}
                    <div className="flex items-center gap-2 px-4 py-3 border-t border-[#EEF1F6] flex-wrap">
                        {/* Video upload */}
                        <button type="button" onClick={() => videoRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] border border-[#E7EBF2] transition-colors">
                            <Video size={13} /> Video
                        </button>
                        <input ref={videoRef} type="file" accept="video/*" multiple className="sr-only"
                            onChange={e => handleFiles(e, "video")} />

                        {/* File upload */}
                        <button type="button" onClick={() => fileRef.current?.click()}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] border border-[#E7EBF2] transition-colors">
                            <Paperclip size={13} /> File
                        </button>
                        <input ref={fileRef} type="file" multiple className="sr-only"
                            onChange={e => handleFiles(e, "file")} />

                        {/* Approval dropdown */}
                        <div className="relative" ref={approvalRef}>
                            <button type="button" onClick={() => setApprovalOpen(o => !o)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] border border-dashed border-[#C7D5E8] transition-colors">
                                🔖 Approval {approvalStatus !== "NONE" ? `· ${approvalStatus.toLowerCase().replace(/_/g," ")}` : "— none —"}
                                <ChevronDown size={12} />
                            </button>
                            {approvalOpen && (
                                <div className="absolute bottom-full left-0 mb-1.5 bg-white border border-[#E7EBF2] rounded-xl shadow-lg z-20 overflow-hidden min-w-[200px]">
                                    {APPROVAL_OPTS.map(o => (
                                        <button key={o.value} type="button"
                                            onClick={() => { setApproval(o.value); setApprovalOpen(false); }}
                                            className={cn("w-full text-left px-4 py-2.5 text-[12.5px] transition-colors",
                                                approvalStatus === o.value ? "bg-[#EEF3FE] text-[#3C80F5] font-semibold" : "text-[#1B2330] hover:bg-[#F7F9FC]"
                                            )}>
                                            {o.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Client view toggle */}
                        <div className="flex items-center gap-2 ml-1">
                            <button type="button"
                                onClick={() => setClientView(v => !v)}
                                className={cn(
                                    "relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0",
                                    clientView ? "bg-[#3C80F5]" : "bg-[#D1D9E6]"
                                )}>
                                <span className={cn("absolute top-[3px] left-[3px] w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200",
                                    clientView ? "translate-x-4" : "translate-x-0")} />
                            </button>
                            <span className="text-[12.5px] font-semibold text-[#69788C]">
                                Client view {clientView ? "ON" : "OFF"}
                            </span>
                        </div>

                        {/* Post button */}
                        <button type="button" onClick={handlePost} disabled={posting}
                            className="ml-auto flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-60">
                            {posting && <Loader2 size={13} className="animate-spin" />}
                            Post update
                        </button>
                    </div>
                </div>

                {/* Updates list */}
                {loading && (
                    <div className="flex items-center justify-center py-16 gap-3 text-[#94A3B5]">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-[13px]">Loading updates...</span>
                    </div>
                )}

                {!loading && updates.length === 0 && (
                    <div className="text-center py-16 text-[#94A3B5] border border-dashed border-[#E7EBF2] rounded-2xl">
                        <p className="text-[14px] font-semibold">No updates yet</p>
                        <p className="text-[12.5px] mt-1">Post the first update above.</p>
                    </div>
                )}

                {!loading && updates.map(update => (
                    <UpdateCard
                        key={update.id}
                        update={update}
                        currentUser={user}
                        projectLead={projectLead}
                        onDelete={handleDelete}
                        onReply={handleReply}
                        onStatusChange={handleStatusChange}
                    />
                ))}
            </div>

            {/* Right sidebar slot (delivery phases + team injected by parent) */}
            <div className="hidden lg:block" />
        </div>
    );
}