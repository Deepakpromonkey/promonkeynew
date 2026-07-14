"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, Check, Clock, CalendarDays, MessageSquare } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

/* ---------------- Styles (kept consistent with the phase detail page) ---------------- */

const TASK_STATUS_STYLES = {
    TO_DO:       "bg-[#EEF1F6] text-[#69788C]",
    IN_PROGRESS: "bg-[#EEF3FE] text-[#3C80F5]",
    BLOCKED:     "bg-[#FCEDED] text-[#DC2626]",
    DONE:        "bg-[#EAF7EE] text-[#16A34A]",
};
const TASK_STATUS_LABELS = { TO_DO: "To do", IN_PROGRESS: "In progress", BLOCKED: "Blocked", DONE: "Done" };

const PRIORITY_STYLES = {
    HIGH:   "bg-[#FCEDED] text-[#DC2626] border border-[#F3C9C9]",
    URGENT: "bg-[#FCEDED] text-[#DC2626] border border-[#F3C9C9]",
    MEDIUM: "bg-[#FDF3E2] text-[#E08600] border border-[#FDE68A]",
    LOW:    "bg-[#EEF1F6] text-[#69788C] border border-[#E7EBF2]",
};
const PRIORITY_LABEL = (p) => (p === "MEDIUM" ? "MED" : p ?? "—");

function fmt(d) {
    return d ? new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}
function fmtDateTime(d) {
    if (!d) return "";
    return new Date(d).toLocaleString("en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function fmtISODate(d) {
    return d ? new Date(d).toISOString().slice(0, 10) : "";
}

function Avatar({ name, size = "md" }) {
    const initials = (name ?? "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const sz = size === "sm" ? "w-8 h-8 text-[11px]" : "w-10 h-10 text-[12px]";
    return (
        <div className={cn("rounded-full bg-gradient-to-br from-[#3C80F5] to-[#763CF6] flex items-center justify-center text-white font-bold shrink-0", sz)}>
            {initials}
        </div>
    );
}

function MetaItem({ label, children }) {
    return (
        <div>
            <p className="text-[10px] tracking-[1.2px] font-bold text-[#94A3B5] mb-1">{label}</p>
            <div>{children}</div>
        </div>
    );
}

function StatCard({ value, label }) {
    return (
        <div className="bg-[#F7F9FC] rounded-xl px-5 py-4 flex-1 min-w-[140px]">
            <p className="text-[22px] font-black text-[#1B2330] leading-none">{value}</p>
            <p className="text-[10.5px] tracking-[0.6px] font-bold text-[#94A3B5] mt-1.5">{label}</p>
        </div>
    );
}

function InfoCard({ title, children }) {
    return (
        <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
            <p className="text-[10px] tracking-[1.4px] font-bold text-[#94A3B5] mb-4">{title}</p>
            {children}
        </div>
    );
}

/*
 * Renders the task's rich-text `description` (HTML produced by
 * RichTextEditor/Jodit — see components/ui/RichTextEditor.jsx). This is the
 * only place on the page rendering arbitrary HTML via
 * dangerouslySetInnerHTML, so it's isolated in its own component.
 *
 * NOTE ON SANITIZATION: this assumes `description` only ever comes from
 * this app's own RichTextEditor (authenticated users on tasks they have
 * access to), the same trust boundary the phase/description views already
 * rely on elsewhere. If task descriptions can ever come from an
 * untrusted/external source, run them through a sanitizer (e.g. DOMPurify)
 * before rendering here.
 */
function DescriptionCard({ html }) {
    const hasContent = html && html.replace(/<[^>]*>/g, "").trim().length > 0;

    return (
        <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06)] mb-4">
            <p className="text-[10px] tracking-[1.4px] font-bold text-[#94A3B5] mb-3">DESCRIPTION</p>
            {hasContent ? (
                <>
                    {/*
                      Mirrors the heading/list/table rules from
                      RichTextEditor's own <style jsx global> block, scoped
                      to .task-description instead of .jodit-wysiwyg, since
                      Tailwind's preflight reset strips h1-h6 down to
                      inherited size/weight here too.
                    */}
                    <style jsx global>{`
                        .task-description h1 { font-size: 2em; font-weight: 700; margin: 0.67em 0; line-height: 1.2; }
                        .task-description h2 { font-size: 1.5em; font-weight: 700; margin: 0.75em 0; line-height: 1.25; }
                        .task-description h3 { font-size: 1.25em; font-weight: 600; margin: 0.83em 0; line-height: 1.3; }
                        .task-description h4 { font-size: 1.1em; font-weight: 600; margin: 1em 0; }
                        .task-description h5 { font-size: 1em; font-weight: 600; margin: 1.1em 0; }
                        .task-description h6 { font-size: 0.9em; font-weight: 600; margin: 1.2em 0; }
                        .task-description p { margin: 0.5em 0; }
                        .task-description ul, .task-description ol { padding-left: 1.5em; margin: 0.5em 0; }
                        .task-description table { border-collapse: collapse; }
                        .task-description table td, .task-description table th { border: 1px solid #E7EBF2; padding: 6px 8px; }
                        .task-description img, .task-description video, .task-description iframe { max-width: 100%; height: auto; border-radius: 8px; }
                        .task-description a { color: #3C80F5; text-decoration: underline; }
                    `}</style>
                    <div
                        className="task-description text-[13.5px] text-[#1B2330] leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: html }}
                    />
                </>
            ) : (
                <p className="text-[13.5px] text-[#94A3B5]">No description provided.</p>
            )}
        </div>
    );
}

/* ---------------- API <-> UI mapping ---------------- */
/*
  Actual /api/phases/task/:id response shape:
  {
    id, title, description, startDate, dueDate, priority, status,
    estimatedHours, loggedHours, phaseId, subPhaseId,
    assigneeId, createdAt, updatedAt,
    assignee: { legalName, profilePhotoUrl },
    phase: { name, project: { name } }
  }
  Note: no top-level `project`, no `phase.id`, no `project.id`,
  no `assignee.id`/`role`/`designation`, no `code`/`taskCode`.
  We fall back to route/query params where the API doesn't provide an id.
*/

function mapTaskDetail(t) {
    return {
        id:             t.id,
        code:           t.code ?? t.taskCode ?? null,
        title:          t.title,
        description:    t.description ?? "",
        status:         t.status ?? "TO_DO",
        priority:       t.priority ?? "LOW",
        startDate:      t.startDate,
        dueDate:        t.dueDate,
        createdAt:      t.createdAt,
        estimatedHours: t.estimatedHours ?? t.allottedHours ?? 0,
        loggedHours:    t.loggedHours ?? 0,
        assignee: t.assignee ? {
            id:   t.assigneeId ?? t.assignee.id ?? null,
            name: t.assignee.legalName ?? t.assignee.name ?? "Team Member",
            role: t.assignee.designation ?? t.assignee.role ?? "",
            avatar: t.assignee.profilePhotoUrl ?? null,
        } : null,
        project: t.phase?.project
            ? { id: t.projectId ?? null, name: t.phase.project.name, code: t.phase.project.code ?? null }
            : null,
        phase: t.phase
            ? { id: t.phaseId ?? null, name: t.phase.name }
            : null,
    };
}

function mapReply(r) {
    return {
        id:        r.id,
        author:    r.user?.legalName ?? r.author?.legalName ?? r.createdBy?.legalName ?? "Team Member",
        text:      r.text,
        createdAt: r.createdAt,
    };
}

function mapPost(u) {
    return {
        id:        u.id,
        author:    u.user?.legalName ?? u.author?.legalName ?? u.createdBy?.legalName ?? "Team Member",
        type:      (u.type ?? "UPDATE").toUpperCase() === "QUESTION" ? "question" : "update",
        text:      u.content,
        createdAt: u.createdAt,
        replies:   (u.replies ?? []).map(mapReply),
    };
}

function mapLog(l) {
    return {
        id:     l.id,
        hours:  l.hours,
        note:   l.note,
        date:   l.date ? fmtISODate(l.date) : "",
        author: l.user?.legalName ?? l.author?.legalName ?? l.loggedBy?.legalName ?? null,
    };
}

/* ---------------- Page ---------------- */

export default function TaskDetailPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const taskId = params?.id;
    const queryProjectId = searchParams.get("projectId");

    const [task, setTask]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");
    const [savingStatus, setSavingStatus] = useState(false);

    const [activeTab, setActiveTab] = useState("updates"); // "updates" | "logs"

    const [posts, setPosts]             = useState([]);
    const [postsLoading, setPostsLoading] = useState(true);
    const [postMode, setPostMode]       = useState("update"); // "update" | "question"
    const [postText, setPostText]       = useState("");
    const [postSubmitting, setPostSubmitting] = useState(false);
    const [replyDrafts, setReplyDrafts] = useState({});
    const [replyingId, setReplyingId]   = useState(null);

    const [logs, setLogs]         = useState([]);
    const [logsLoading, setLogsLoading] = useState(true);
    const [logHours, setLogHours] = useState("");
    const [logDate, setLogDate]   = useState(fmtISODate(new Date()));
    const [logNote, setLogNote]   = useState("");
    const [logSubmitting, setLogSubmitting] = useState(false);

    async function loadTask() {
        if (!taskId) return;
        setLoading(true); setError("");
        try {
            // FIX: correct endpoint is /api/phases/task/:id (was /api/task/:id)
            const json = await apiFetch(`/api/phases/task/${taskId}`);
            setTask(mapTaskDetail(json.data ?? json));
        } catch (e) {
            setError(e.message);
        } finally { setLoading(false); }
    }

    const loadUpdates = useCallback(async () => {
        if (!taskId) return;
        setPostsLoading(true);
        try {
            const json = await apiFetch(`/api/phases/task/${taskId}/updates`);
            const list = json.data ?? json;
            setPosts((Array.isArray(list) ? list : []).map(mapPost));
        } catch (e) {
            toast.error({ title: "Failed to load updates", message: e.message });
        } finally { setPostsLoading(false); }
    }, [taskId]);

    const loadLogs = useCallback(async () => {
        if (!taskId) return;
        setLogsLoading(true);
        try {
            const json = await apiFetch(`/api/phases/task/${taskId}/time-logs`);
            const list = json.data ?? json;
            setLogs((Array.isArray(list) ? list : []).map(mapLog));
        } catch (e) {
            toast.error({ title: "Failed to load time logs", message: e.message });
        } finally { setLogsLoading(false); }
    }, [taskId]);

    useEffect(() => { loadTask(); }, [taskId]);
    useEffect(() => { loadUpdates(); }, [loadUpdates]);
    useEffect(() => { loadLogs(); }, [loadLogs]);

    async function toggleDone() {
        if (!task) return;
        const nextStatus = task.status === "DONE" ? "TO_DO" : "DONE";
        setSavingStatus(true);
        try {
            await apiFetch(`/api/phases/task/${task.id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
            setTask(t => ({ ...t, status: nextStatus }));
        } catch (e) {
            toast.error({ title: "Update failed", message: e.message });
        } finally { setSavingStatus(false); }
    }

    async function submitPost() {
        if (!postText.trim() || postSubmitting) return;
        setPostSubmitting(true);
        try {
            await apiFetch(`/api/phases/task/${taskId}/updates`, {
                method: "POST",
                body: JSON.stringify({ content: postText.trim(), type: postMode === "question" ? "QUESTION" : "UPDATE" }),
            });
            setPostText("");
            toast.success({ title: postMode === "question" ? "Question posted" : "Update posted" });
            loadUpdates();
        } catch (e) {
            toast.error({ title: "Failed to post", message: e.message });
        } finally { setPostSubmitting(false); }
    }

    async function submitReply(postId) {
        const text = (replyDrafts[postId] ?? "").trim();
        if (!text || replyingId === postId) return;
        setReplyingId(postId);
        try {
            await apiFetch(`/api/phases/task/updates/${postId}/reply`, {
                method: "POST",
                body: JSON.stringify({ text }),
            });
            setReplyDrafts(d => ({ ...d, [postId]: "" }));
            toast.success({ title: "Reply added" });
            loadUpdates();
        } catch (e) {
            toast.error({ title: "Failed to reply", message: e.message });
        } finally { setReplyingId(null); }
    }

    async function addTimeLog() {
        const hrs = parseFloat(logHours);
        if (!hrs || hrs <= 0 || logSubmitting) return;
        setLogSubmitting(true);
        try {
            await apiFetch(`/api/phases/task/${taskId}/time-logs`, {
                method: "POST",
                body: JSON.stringify({
                    hours: hrs,
                    date: new Date(logDate).toISOString(),
                    note: logNote.trim() || "Logged time",
                }),
            });
            setLogHours(""); setLogNote("");
            toast.success({ title: "Time logged", message: `${hrs}h added.` });
            loadLogs();
            loadTask(); // refresh consumed/remaining hours on the task
        } catch (e) {
            toast.error({ title: "Failed to log time", message: e.message });
        } finally { setLogSubmitting(false); }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-32 gap-3 text-[#94A3B5]">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[13px]">Loading task...</span>
        </div>
    );

    if (error) return (
        <div className="max-w-[1100px] mx-auto pt-6">
            <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[13px] font-medium">{error}</p>
            </div>
        </div>
    );

    if (!task) return (
        <div className="max-w-[1100px] mx-auto pt-6">
            <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[13px] font-medium">Task not found.</p>
            </div>
        </div>
    );

    const remaining = Math.max((task.estimatedHours ?? 0) - (task.loggedHours ?? 0), 0);
    const loggedTotal = logs.reduce((sum, l) => sum + (l.hours ?? 0), 0);
    const pct = task.estimatedHours ? Math.min(100, Math.round(((task.loggedHours ?? 0) / task.estimatedHours) * 100)) : 0;

    // FIX: API doesn't return project.id / phase.id, so prefer the query param
    // for navigation, falling back to whatever mapTaskDetail could resolve.
    const backProjectId = queryProjectId || task.project?.id;

    return (
        <div className="max-w-[1200px] mx-auto">

            {/* Back */}
            <button
                onClick={() => backProjectId ? router.push(`/promonkey/projects/${backProjectId}`) : router.back()}
                className="flex items-center gap-2 text-[13px] font-semibold text-[#69788C] hover:text-[#1B2330] mb-5 transition-colors"
            >
                <ArrowLeft size={14} /> Back
            </button>

            {/* Header card */}
            <div className="bg-white border border-[#E7EBF2] rounded-2xl p-6 shadow-[0_1px_2px_rgba(27,35,48,.06),0_4px_16px_rgba(27,35,48,.06)] mb-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[12px] text-[#94A3B5] font-semibold mb-1 tracking-[0.4px]">
                            TASK{task.code ? ` · ${task.code}` : ""}
                        </p>
                        <h1 className="text-[24px] font-black text-[#1B2330] tracking-[-0.4px]">{task.title}</h1>
                    </div>
                    <button
                        onClick={toggleDone}
                        disabled={savingStatus}
                        title={task.status === "DONE" ? "Mark as not done" : "Mark as done"}
                        className={cn(
                            "w-9 h-9 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors disabled:opacity-50",
                            task.status === "DONE" ? "bg-[#16A34A] border-[#16A34A]" : "border-[#D1D9E6] hover:border-[#3C80F5]"
                        )}
                    >
                        {task.status === "DONE" && <Check size={18} className="text-white" strokeWidth={3} />}
                    </button>
                </div>

                {/* Meta row */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-5 mt-6 pb-5 border-b border-[#EEF1F6]">
                    <MetaItem label="STATUS">
                        <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[12px] font-semibold", TASK_STATUS_STYLES[task.status] ?? TASK_STATUS_STYLES.TO_DO)}>
                            {TASK_STATUS_LABELS[task.status] ?? task.status}
                        </span>
                    </MetaItem>
                    <MetaItem label="PRIORITY">
                        <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[12px] font-bold", PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.LOW)}>
                            {PRIORITY_LABEL(task.priority)}
                        </span>
                    </MetaItem>
                    <MetaItem label="ASSIGNEE">
                        {task.assignee ? (
                            <div className="flex items-center gap-2">
                                <Avatar name={task.assignee.name} size="sm" />
                                <span className="text-[13px] font-semibold text-[#1B2330]">{task.assignee.name}</span>
                            </div>
                        ) : <span className="text-[13px] text-[#94A3B5]">Unassigned</span>}
                    </MetaItem>
                    <MetaItem label="PROJECT">
                        <span className="text-[13px] font-semibold text-[#1B2330]">{task.project?.name ?? "—"}</span>
                    </MetaItem>
                    <MetaItem label="PHASE">
                        <span className="text-[13px] font-semibold text-[#1B2330]">{task.phase?.name ?? "—"}</span>
                    </MetaItem>
                    <MetaItem label="DUE">
                        <span className="text-[13px] font-semibold text-[#1B2330]">{fmt(task.dueDate)}</span>
                    </MetaItem>
                </div>

                {/* Stat cards */}
                <div className="flex flex-wrap gap-4 mt-5">
                    <StatCard value={`${task.estimatedHours ?? 0}h`} label="TIME ALLOTTED" />
                    <StatCard value={`${task.loggedHours ?? 0}h`} label="TIME CONSUMED" />
                    <StatCard value={`${remaining}h`} label="REMAINING" />
                </div>
            </div>

            {/* Description */}
            <DescriptionCard html={task.description} />

            {/* Body grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

                {/* Left: tabs */}
                <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                    <div className="flex items-center gap-6 border-b border-[#EEF1F6] mb-4">
                        <button
                            onClick={() => setActiveTab("updates")}
                            className={cn("flex items-center gap-2 pb-3 text-[13.5px] font-bold transition-colors",
                                activeTab === "updates" ? "text-[#3C80F5] border-b-2 border-[#3C80F5]" : "text-[#69788C] hover:text-[#1B2330]")}
                        >
                            Updates & Questions
                            <span className="px-1.5 py-0.5 rounded-full bg-[#EEF1F6] text-[#69788C] text-[11px] font-bold">{posts.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("logs")}
                            className={cn("flex items-center gap-2 pb-3 text-[13.5px] font-bold transition-colors",
                                activeTab === "logs" ? "text-[#3C80F5] border-b-2 border-[#3C80F5]" : "text-[#69788C] hover:text-[#1B2330]")}
                        >
                            Time Logs
                            <span className="px-1.5 py-0.5 rounded-full bg-[#EEF1F6] text-[#69788C] text-[11px] font-bold">{logs.length}</span>
                        </button>
                    </div>

                    {activeTab === "updates" && (
                        <div className="space-y-4">
                            <div className="border border-[#E7EBF2] rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <button
                                        onClick={() => setPostMode("update")}
                                        className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold transition-colors",
                                            postMode === "update" ? "bg-[#1B2330] text-white" : "bg-[#F7F9FC] text-[#69788C] hover:bg-[#EEF1F6]")}
                                    >
                                        Update
                                    </button>
                                    <button
                                        onClick={() => setPostMode("question")}
                                        className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold transition-colors",
                                            postMode === "question" ? "bg-[#1B2330] text-white" : "bg-[#F7F9FC] text-[#69788C] hover:bg-[#EEF1F6]")}
                                    >
                                        Question
                                    </button>
                                </div>
                                <textarea
                                    value={postText}
                                    onChange={e => setPostText(e.target.value)}
                                    placeholder={postMode === "update" ? "Post a progress update..." : "Ask a question..."}
                                    rows={3}
                                    className="w-full rounded-xl border border-[#E7EBF2] px-3.5 py-3 text-[13.5px] outline-none focus:border-[#3C80F5] resize-none"
                                />
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={submitPost}
                                        disabled={postSubmitting || !postText.trim()}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-60"
                                    >
                                        {postSubmitting && <Loader2 size={13} className="animate-spin" />}
                                        {postMode === "update" ? "Post update" : "Post question"}
                                    </button>
                                </div>
                            </div>

                            {postsLoading ? (
                                <div className="py-10 flex items-center justify-center gap-2 text-[#94A3B5]">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-[13px]">Loading updates...</span>
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="py-10 text-center text-[#94A3B5]">
                                    <MessageSquare size={22} className="mx-auto mb-2" />
                                    <p className="text-[13px] font-semibold">No updates or questions yet</p>
                                </div>
                            ) : posts.map(post => (
                                <div key={post.id} className="border border-[#E7EBF2] rounded-2xl p-4">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <Avatar name={post.author} size="sm" />
                                        <span className="text-[13px] font-bold text-[#1B2330]">{post.author}</span>
                                        {post.type === "question" && (
                                            <span className="px-2 py-0.5 rounded-full bg-[#EEF3FE] text-[#3C80F5] text-[10.5px] font-bold">QUESTION</span>
                                        )}
                                        <span className="text-[11.5px] text-[#94A3B5]">{fmtDateTime(post.createdAt)}</span>
                                    </div>
                                    <p className="text-[13.5px] text-[#1B2330] mb-3">{post.text}</p>
                                    {post.replies.map(r => (
                                        <div key={r.id} className="flex items-center gap-2.5 mt-2 pl-2">
                                            <Avatar name={r.author} size="sm" />
                                            <p className="text-[13px] text-[#1B2330]">{r.text}</p>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2.5 mt-2">
                                        <Avatar name="You" size="sm" />
                                        <input
                                            value={replyDrafts[post.id] ?? ""}
                                            onChange={e => setReplyDrafts(d => ({ ...d, [post.id]: e.target.value }))}
                                            onKeyDown={e => e.key === "Enter" && submitReply(post.id)}
                                            placeholder="Reply..."
                                            disabled={replyingId === post.id}
                                            className="flex-1 h-9 px-3 rounded-lg border border-[#E7EBF2] text-[12.5px] outline-none focus:border-[#3C80F5] disabled:opacity-60"
                                        />
                                        <button
                                            onClick={() => submitReply(post.id)}
                                            disabled={replyingId === post.id || !(replyDrafts[post.id] ?? "").trim()}
                                            className="h-9 px-3.5 rounded-lg text-[12px] font-bold text-[#1B2330] bg-[#F7F9FC] hover:bg-[#EEF1F6] transition-colors disabled:opacity-60"
                                        >
                                            {replyingId === post.id ? <Loader2 size={13} className="animate-spin" /> : "Reply"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "logs" && (
                        <div className="space-y-4">
                            <div className="border border-[#E7EBF2] rounded-2xl p-4">
                                <p className="text-[14px] font-bold text-[#1B2330] mb-3">Log working hours</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[12px] font-semibold text-[#69788C] mb-1.5">Hours worked</p>
                                        <input
                                            type="number" min="0" step="0.5"
                                            value={logHours}
                                            onChange={e => setLogHours(e.target.value)}
                                            placeholder="e.g. 3"
                                            className="w-full h-10 px-3 rounded-xl border border-[#E7EBF2] text-[13.5px] outline-none focus:border-[#3C80F5]"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-semibold text-[#69788C] mb-1.5">Date</p>
                                        <input
                                            type="date"
                                            value={logDate}
                                            onChange={e => setLogDate(e.target.value)}
                                            className="w-full h-10 px-3 rounded-xl border border-[#E7EBF2] text-[13.5px] outline-none focus:border-[#3C80F5]"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <p className="text-[12px] font-semibold text-[#69788C] mb-1.5">Note</p>
                                    <input
                                        value={logNote}
                                        onChange={e => setLogNote(e.target.value)}
                                        placeholder="What did you work on?"
                                        className="w-full h-10 px-3 rounded-xl border border-[#E7EBF2] text-[13.5px] outline-none focus:border-[#3C80F5]"
                                    />
                                </div>
                                <div className="flex justify-end mt-3">
                                    <button
                                        onClick={addTimeLog}
                                        disabled={logSubmitting || !logHours}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-60"
                                    >
                                        {logSubmitting && <Loader2 size={13} className="animate-spin" />}
                                        + Add time log
                                    </button>
                                </div>
                                <p className="text-[11.5px] text-[#94A3B5] mt-3">
                                    Date defaults to today.
                                </p>
                            </div>

                            {logsLoading ? (
                                <div className="py-6 flex items-center justify-center gap-2 text-[#94A3B5]">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-[13px]">Loading time logs...</span>
                                </div>
                            ) : logs.length === 0 ? (
                                <div className="py-6 text-center text-[#94A3B5]">
                                    <p className="text-[13px] font-semibold">No time logged yet</p>
                                </div>
                            ) : (
                                <div className="border border-[#E7EBF2] rounded-2xl p-4">
                                    <p className="text-[10px] tracking-[1.2px] font-bold text-[#94A3B5] mb-3">
                                        LOGGED ENTRIES · {loggedTotal}H TOTAL
                                    </p>
                                    {logs.map(l => (
                                        <div key={l.id} className="flex items-start gap-4 py-2.5 border-b border-[#EEF1F6] last:border-0">
                                            <span className="text-[15px] font-black text-[#3C80F5] w-10 shrink-0">{l.hours}h</span>
                                            <div>
                                                <p className="text-[13.5px] font-semibold text-[#1B2330]">{l.note}</p>
                                                <p className="text-[11.5px] text-[#94A3B5]">{fmt(l.date)} · {l.author ?? task.assignee?.name ?? "You"}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right sidebar */}
                <div className="space-y-4">
                    <InfoCard title="TIME TRACKING">
                        <div className="space-y-3">
                            <div>
                                <p className="text-[10px] tracking-[1.2px] font-bold text-[#94A3B5] mb-1">ALLOTTED</p>
                                <p className="text-[15px] font-bold text-[#1B2330]">{task.estimatedHours ?? 0}h</p>
                            </div>
                            <div>
                                <p className="text-[10px] tracking-[1.2px] font-bold text-[#94A3B5] mb-1">CONSUMED</p>
                                <p className="text-[15px] font-bold text-[#1B2330]">{task.loggedHours ?? 0}h</p>
                            </div>
                            <div>
                                <p className="text-[10px] tracking-[1.2px] font-bold text-[#94A3B5] mb-1">REMAINING</p>
                                <p className="text-[15px] font-bold text-[#1B2330]">{remaining}h</p>
                            </div>
                            <div className="h-1.5 rounded-full bg-[#EEF1F6] overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-[#3C80F5] to-[#763CF6]" style={{ width: `${pct}%` }} />
                            </div>
                        </div>
                    </InfoCard>

                    <InfoCard title="ASSIGNEE">
                        {task.assignee ? (
                            <div className="flex items-center gap-3">
                                <Avatar name={task.assignee.name} />
                                <div>
                                    <p className="text-[13px] font-semibold text-[#1B2330]">{task.assignee.name}</p>
                                    {task.assignee.role && <p className="text-[12px] text-[#94A3B5]">{task.assignee.role}</p>}
                                </div>
                            </div>
                        ) : <p className="text-[13px] text-[#94A3B5]">Unassigned</p>}
                    </InfoCard>

                    <InfoCard title="DATES">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[13px] text-[#1B2330]">
                                <Clock size={13} className="text-[#94A3B5]" /> Added {fmt(task.createdAt)}
                            </div>
                            <div className="flex items-center gap-2 text-[13px] text-[#1B2330]">
                                <CalendarDays size={13} className="text-[#94A3B5]" /> Due {fmt(task.dueDate)}
                            </div>
                        </div>
                    </InfoCard>
                </div>
            </div>
        </div>
    );
}