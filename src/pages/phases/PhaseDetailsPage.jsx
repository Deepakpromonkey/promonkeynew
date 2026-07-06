"use client";
import { useState, useEffect, Fragment } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, Pencil, Clock, CalendarDays, Check, Plus, FileText, ChevronRight, ChevronDown, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import PhaseForm from "@/components/phases/PhaseForm";
import SubPhaseForm from "@/components/phases/SubPhaseForm";
import TaskForm from "@/components/phases/TaskForm";

const STATUS_STYLES = {
    COMPLETED:   "bg-[#EAF7EE] text-[#16A34A] border-[#BBF7D0]",
    IN_PROGRESS: "bg-[#EEF3FE] text-[#3C80F5] border-[#C9DBFB]",
    UPCOMING:    "bg-[#EEF1F6] text-[#69788C] border-[#E7EBF2]",
};
const STATUS_LABELS = { COMPLETED: "Completed", IN_PROGRESS: "In progress", UPCOMING: "Upcoming" };

const PRIORITY_STYLES = {
    HIGH:   "bg-[#FCEDED] text-[#DC2626] border border-[#F3C9C9]",
    URGENT: "bg-[#FCEDED] text-[#DC2626] border border-[#F3C9C9]",
    MEDIUM: "bg-[#FDF3E2] text-[#E08600] border border-[#FDE68A]",
    LOW:    "bg-[#EEF1F6] text-[#69788C] border border-[#E7EBF2]",
};
const PRIORITY_LABEL = (p) => (p === "MEDIUM" ? "MED" : p);

const TASK_STATUS_OPTS = ["TO_DO", "IN_PROGRESS", "BLOCKED", "DONE"];
const TASK_STATUS_LABELS = { TO_DO: "To do", IN_PROGRESS: "In progress", BLOCKED: "Blocked", DONE: "Done" };
const TASK_STATUS_STYLES = {
    TO_DO:       "bg-[#EEF1F6] text-[#69788C]",
    IN_PROGRESS: "bg-[#EEF3FE] text-[#3C80F5]",
    BLOCKED:     "bg-[#FCEDED] text-[#DC2626]",
    DONE:        "bg-[#EAF7EE] text-[#16A34A]",
};

function MetaItem({ label, children }) {
    return (
        <div>
            <p className="text-[10px] tracking-[1.2px] font-bold text-[#94A3B5] mb-1">{label}</p>
            <div>{children}</div>
        </div>
    );
}

function InfoCard({ title, action, children }) {
    return (
        <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] tracking-[1.4px] font-bold text-[#94A3B5]">{title}</p>
                {action}
            </div>
            {children}
        </div>
    );
}

function Avatar({ name, color = "from-[#3C80F5] to-[#763CF6]", size = "md" }) {
    const initials = (name ?? "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const sz = size === "sm" ? "w-8 h-8 text-[11px]" : "w-10 h-10 text-[12px]";
    return (
        <div className={cn("rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0", sz, color)}>
            {initials}
        </div>
    );
}

function notReady() {
    toast.success({ title: "Coming soon", message: "File uploads aren't wired up yet." });
}

function fmt(d) {
    return d ? new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}


function mapTask(t) {
    return {
        id:         t.id,
        title:      t.title,
        priority:   t.priority,
        status:     t.status,
        startDate:  t.startDate,
        dueDate:    t.dueDate,
        phaseId:    t.phaseId,
        subPhaseId: t.subPhaseId,
        assigneeId: t.assigneeId,
        assigneeName: t.assignee?.legalName ?? null,
        createdAt:  t.createdAt,
    };
}

function mapSubPhase(sp) {
    return {
        id:        sp.id,
        name:      sp.name,
        phaseId:   sp.phaseId,
        createdAt: sp.createdAt,
        tasks:     (sp.tasks ?? []).map(mapTask),
    };
}

function mapPhaseDetail(ph) {
    return {
        id:             ph.id,
        name:           ph.name,
        description:    ph.description,
        startDate:      ph.startDate,
        dueDate:        ph.dueDate,
        priority:       ph.priority,
        status:         ph.status,
        estimatedHours: ph.estimatedHours,
        loggedHours:    ph.loggedHours,
        projectId:      ph.projectId,
        leadId:         ph.leadId,
        lead: ph.lead ? { id: ph.lead.id, name: ph.lead.legalName, avatar: ph.lead.profilePhotoUrl } : null,
        deliverables:   ph.deliverables ?? [],
        subPhases:      (ph.subPhases ?? []).map(mapSubPhase),
        tasks:          (ph.tasks ?? []).map(mapTask), // independent tasks, subPhaseId === null
        taskStats:      ph.taskStats ?? { total: 0, done: 0, progress: 0 },
    };
}


function TaskRow({ task, teamOptions, onPatch, onDelete }) {
    const overdue = task.status !== "DONE" && task.dueDate && new Date(task.dueDate) < new Date();

    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-[#EEF1F6] last:border-0 flex-wrap">
            <button
                onClick={() => onPatch(task.id, { status: task.status === "DONE" ? "TO_DO" : "DONE" })}
                className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-colors",
                    task.status === "DONE" ? "bg-[#16A34A] border-[#16A34A]" : "border-[#D1D9E6] hover:border-[#3C80F5]"
                )}
            >
                {task.status === "DONE" && <Check size={13} className="text-white" strokeWidth={3} />}
            </button>

            <div className="min-w-0 flex-1">
                <p className={cn("text-[13.5px] font-semibold", task.status === "DONE" ? "text-[#94A3B5] line-through" : "text-[#1B2330]")}>
                    {task.title}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-[11.5px] text-[#94A3B5]">
                    <span className="flex items-center gap-1"><Clock size={11} /> Added {fmt(task.createdAt)}</span>
                    <span className={cn("flex items-center gap-1 font-semibold", overdue ? "text-[#DC2626]" : "text-[#94A3B5]")}>
                        <CalendarDays size={11} /> Due {fmt(task.dueDate)}
                    </span>
                </div>
            </div>

            <select
                value={task.priority}
                onChange={e => onPatch(task.id, { priority: e.target.value })}
                className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 outline-none cursor-pointer", PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.LOW)}
            >
                {["LOW", "MEDIUM", "HIGH", "URGENT"].map(p => (
                    <option key={p} value={p}>{PRIORITY_LABEL(p)}</option>
                ))}
            </select>

            <select
                value={task.status}
                onChange={e => onPatch(task.id, { status: e.target.value })}
                className={cn("px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold shrink-0 outline-none cursor-pointer", TASK_STATUS_STYLES[task.status] ?? TASK_STATUS_STYLES.TO_DO)}
            >
                {TASK_STATUS_OPTS.map(s => (
                    <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
                ))}
            </select>

            <select
                value={task.assigneeId ?? ""}
                onChange={e => onPatch(task.id, { assigneeId: e.target.value || null })}
                className="h-8 px-3 rounded-lg border border-[#E7EBF2] text-[12px] font-semibold text-[#1B2330] hover:bg-[#F7F9FC] transition-colors shrink-0 outline-none cursor-pointer"
            >
                <option value="">Unassigned</option>
                {teamOptions.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>

            <button
                onClick={() => onDelete(task.id, task.title)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#B8C1D1] hover:bg-[#FCEDED] hover:text-[#DC2626] transition-colors shrink-0"
                title="Delete task"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
}


function SubPhaseGroup({ subPhase, teamOptions, onPatchTask, onAddTask, onDeleteTask, onEditSubPhase, onDeleteSubPhase }) {
    const [open, setOpen] = useState(false);
    const total = subPhase.tasks.length;
    const done  = subPhase.tasks.filter(t => t.status === "DONE").length;

    return (
        <div className="border-b border-[#EEF1F6] last:border-0">
            <div className="w-full flex items-center gap-2 py-2.5">
                <button
                    onClick={() => setOpen(o => !o)}
                    className="flex items-center gap-2 text-left flex-1 min-w-0"
                >
                    {open ? <ChevronDown size={14} className="text-[#94A3B5] shrink-0" /> : <ChevronRight size={14} className="text-[#94A3B5] shrink-0" />}
                    <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-bold text-[#1B2330]">{subPhase.name}</p>
                        <p className="text-[11.5px] text-[#94A3B5] flex items-center gap-1">
                            <Clock size={11} /> Added {fmt(subPhase.createdAt)}
                        </p>
                    </div>
                </button>
                <span className="text-[12.5px] font-semibold text-[#69788C] shrink-0">{done}/{total}</span>
                <button
                    onClick={() => onEditSubPhase(subPhase)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#B8C1D1] hover:bg-[#F7F9FC] hover:text-[#1B2330] transition-colors shrink-0"
                    title="Rename sub-phase"
                >
                    <Pencil size={13} />
                </button>
                <button
                    onClick={() => onDeleteSubPhase(subPhase.id, subPhase.name)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#B8C1D1] hover:bg-[#FCEDED] hover:text-[#DC2626] transition-colors shrink-0"
                    title="Delete sub-phase"
                >
                    <Trash2 size={13} />
                </button>
            </div>

            {open && (
                <div className="pl-6 pb-2">
                    {subPhase.tasks.map(task => (
                        <TaskRow key={task.id} task={task} teamOptions={teamOptions} onPatch={onPatchTask} onDelete={onDeleteTask} />
                    ))}
                    <button
                        onClick={() => onAddTask(subPhase.id)}
                        className="mt-2 px-3 py-1.5 rounded-lg text-[12.5px] font-bold text-[#3C80F5] hover:bg-[#EEF3FE] transition-colors"
                    >
                        + Task
                    </button>
                </div>
            )}
        </div>
    );
}


export default function PhaseDetailPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const phaseId = params?.phaseId;
    const queryProjectId = searchParams.get("projectId");

    const [phase,   setPhase]   = useState(null);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");
    const [showEditForm,    setShowEditForm]    = useState(false);
    
    const [subPhaseFormState, setSubPhaseFormState] = useState(null);
    const [taskFormFor,     setTaskFormFor]     = useState(null); // null = closed, "" = top-level, or subPhaseId

    async function loadPhase() {
        if (!phaseId) return;
        setLoading(true); setError("");
        try {
            const json = await apiFetch(`/api/phases/${phaseId}`);
            setPhase(mapPhaseDetail(json.data ?? json));
        } catch (e) {
            setError(e.message);
        } finally { setLoading(false); }
    }

    useEffect(() => { loadPhase(); }, [phaseId]);

    useEffect(() => {
        const pid = queryProjectId || phase?.projectId;
        if (!pid) return;
        async function load() {
            try {
                const json = await apiFetch(`/api/projects/${pid}`);
                setProject(json.data ?? json);
            } catch (e) {
                
            }
        }
        load();
    }, [queryProjectId, phase?.projectId]);

    async function patchTask(taskId, payload) {
        try {
            await apiFetch(`/api/phases/task/${taskId}`, { method: "PATCH", body: JSON.stringify(payload) });
            // Reconcile from the server so nested sub-phase task lists and taskStats stay correct.
            loadPhase();
        } catch (e) {
            toast.error({ title: "Update failed", message: e.message });
        }
    }

    async function deleteTask(taskId, title) {
        if (!window.confirm(`Delete task "${title}"? This can't be undone.`)) return;
        try {
            await apiFetch(`/api/phases/task/${taskId}`, { method: "DELETE" });
            toast.success({ title: "Task deleted", message: `"${title}" has been removed.` });
            loadPhase();
        } catch (e) {
            toast.error({ title: "Delete failed", message: e.message });
        }
    }

    async function deleteSubPhase(subPhaseId, name) {
        if (!window.confirm(`Delete sub-phase "${name}" and all its tasks? This can't be undone.`)) return;
        try {
            await apiFetch(`/api/phases/sub-phase/${subPhaseId}`, { method: "DELETE" });
            toast.success({ title: "Sub-phase deleted", message: `"${name}" has been removed.` });
            loadPhase();
        } catch (e) {
            toast.error({ title: "Delete failed", message: e.message });
        }
    }

    function openTaskForm(subPhaseId = "") {
        setTaskFormFor(subPhaseId);
    }

    if (loading) return (
        <div className="flex items-center justify-center py-32 gap-3 text-[#94A3B5]">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[13px]">Loading phase...</span>
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

    if (!phase) return (
        <div className="max-w-[1100px] mx-auto pt-6">
            <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[13px] font-medium">Phase not found.</p>
            </div>
        </div>
    );

    const status = phase.status ?? "UPCOMING";
    const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.UPCOMING;
    const { total: tasksTotal = 0, done: tasksDone = 0, progress: pct = 0 } = phase.taskStats;
    const projectId = queryProjectId || phase.projectId;
    const projectName = project?.name ?? "project";

    const teamOptions = (project?.members ?? []).map(m => ({
        id:   m.id,
        name: m.legalName ?? m.name ?? "Team Member",
        role: m.designation ?? m.role ?? "",
    }));

    return (
        <div className="max-w-[1200px] mx-auto">

            {/* Back */}
            <button
                onClick={() => projectId ? router.push(`/promonkey/projects/${projectId}`) : router.back()}
                className="flex items-center gap-2 text-[13px] font-semibold text-[#69788C] hover:text-[#1B2330] mb-5 transition-colors"
            >
                <ArrowLeft size={14} /> Back to {projectName}
            </button>

            {/* Header card */}
            <div className="bg-white border border-[#E7EBF2] rounded-2xl p-6 shadow-[0_1px_2px_rgba(27,35,48,.06),0_4px_16px_rgba(27,35,48,.06)] mb-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[12px] text-[#94A3B5] font-semibold mb-1">
                            {project?.code ?? "PHASE"}
                        </p>
                        <h1 className="text-[24px] font-black text-[#1B2330] tracking-[-0.4px]">{phase.name}</h1>
                        <p className="text-[13.5px] text-[#69788C] mt-0.5">{projectName}</p>
                    </div>
                    <button
                        onClick={() => setShowEditForm(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E7EBF2] text-[12.5px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors shrink-0"
                    >
                        <Pencil size={13} /> Edit
                    </button>
                </div>

                {/* Meta row 1 */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-5 mt-6 pb-5 border-b border-[#EEF1F6]">
                    <MetaItem label="STATUS">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border", statusStyle)}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {STATUS_LABELS[status] ?? status}
                        </span>
                    </MetaItem>
                    <MetaItem label="PRIORITY">
                        <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[12px] font-bold", PRIORITY_STYLES[phase.priority] ?? PRIORITY_STYLES.LOW)}>
                            {PRIORITY_LABEL(phase.priority)}
                        </span>
                    </MetaItem>
                    <MetaItem label="PHASE LEAD">
                        {phase.lead ? (
                            <div className="flex items-center gap-2">
                                <Avatar name={phase.lead.name} size="sm" />
                                <span className="text-[13px] font-semibold text-[#1B2330]">{phase.lead.name}</span>
                            </div>
                        ) : <span className="text-[13px] text-[#94A3B5]">Unassigned</span>}
                    </MetaItem>
                    <MetaItem label="TIMELINE">
                        <span className="text-[13px] font-semibold text-[#1B2330]">{fmt(phase.startDate)} – {fmt(phase.dueDate)}</span>
                    </MetaItem>
                    <MetaItem label="START">
                        <span className="text-[13px] font-semibold text-[#1B2330]">{fmt(phase.startDate)}</span>
                    </MetaItem>
                    <MetaItem label="DUE">
                        <span className="text-[13px] font-semibold text-[#1B2330]">{fmt(phase.dueDate)}</span>
                    </MetaItem>
                </div>

                {/* Meta row 2 */}
                <div className="grid grid-cols-3 gap-5 mt-5 max-w-[520px]">
                    <MetaItem label="HOURS (LOGGED/EST)">
                        <span className="text-[13px] font-semibold text-[#1B2330]">{phase.loggedHours ?? 0} / {phase.estimatedHours ?? "—"}</span>
                    </MetaItem>
                    <MetaItem label="TASKS">
                        <span className="text-[13px] font-semibold text-[#1B2330]">{tasksDone}/{tasksTotal} done</span>
                    </MetaItem>
                    <MetaItem label="PROGRESS">
                        <span className="text-[13px] font-semibold text-[#1B2330]">{pct}%</span>
                    </MetaItem>
                </div>
            </div>

            {/* Description */}
            <div className="mb-4">
                <InfoCard title="DESCRIPTION">
                    <p className="text-[13.5px] text-[#1B2330] leading-relaxed">
                        {phase.description || "No description provided."}
                    </p>
                </InfoCard>
            </div>

            {/* Body grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">

                {/* Sub-phases & tasks */}
                <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[14px] font-bold text-[#1B2330]">Sub-phases & tasks</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setSubPhaseFormState({})}
                                className="px-3.5 py-2 rounded-xl border border-[#E7EBF2] text-[12.5px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors">
                                + Sub-phase
                            </button>
                            <button onClick={() => openTaskForm("")}
                                className="px-3.5 py-2 rounded-xl text-[12.5px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity">
                                + Task
                            </button>
                        </div>
                    </div>

                    {phase.tasks.length === 0 && phase.subPhases.length === 0 ? (
                        <div className="py-10 text-center text-[#94A3B5]">
                            <p className="text-[13px] font-semibold">No tasks yet</p>
                            <p className="text-[12px] mt-1">Tasks and sub-phases added here will show up in this list.</p>
                        </div>
                    ) : (
                        <div>
                            {/* Independent tasks (no sub-phase) */}
                            {phase.tasks.map(task => (
                                <TaskRow key={task.id} task={task} teamOptions={teamOptions} onPatch={patchTask} onDelete={deleteTask} />
                            ))}

                            {/* Sub-phase groups */}
                            {phase.subPhases.map(sp => (
                                <SubPhaseGroup
                                    key={sp.id}
                                    subPhase={sp}
                                    teamOptions={teamOptions}
                                    onPatchTask={patchTask}
                                    onAddTask={openTaskForm}
                                    onDeleteTask={deleteTask}
                                    onEditSubPhase={setSubPhaseFormState}
                                    onDeleteSubPhase={deleteSubPhase}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right sidebar */}
                <div className="space-y-4">
                    <InfoCard title="PHASE PROGRESS">
                        <p className="text-[32px] font-black text-[#1B2330] leading-none mb-3">{pct}%</p>
                        <div className="h-1.5 rounded-full bg-[#EEF1F6] overflow-hidden mb-2.5">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#3C80F5] to-[#763CF6]" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[12px] text-[#69788C]">{tasksDone} of {tasksTotal} tasks complete</p>
                    </InfoCard>

                    <InfoCard title="PHASE LEAD">
                        {phase.lead ? (
                            <div className="flex items-center gap-3">
                                <Avatar name={phase.lead.name} />
                                <div>
                                    <p className="text-[13px] font-semibold text-[#1B2330]">{phase.lead.name}</p>
                                </div>
                            </div>
                        ) : <p className="text-[13px] text-[#94A3B5]">Unassigned</p>}
                    </InfoCard>

                    <InfoCard title="DELIVERABLES">
                        <div className="grid grid-cols-2 gap-3">
                            {(phase.deliverables ?? []).map((d, i) => (
                                <div key={i} className="border border-[#E7EBF2] rounded-xl px-3 py-4 flex flex-col items-center gap-2 text-center">
                                    <FileText size={22} className="text-[#94A3B5]" />
                                    <p className="text-[11.5px] font-medium text-[#69788C] truncate w-full">{d.name}</p>
                                </div>
                            ))}
                            <button
                                onClick={notReady}
                                className="border border-dashed border-[#D1D9E6] rounded-xl px-3 py-4 flex flex-col items-center gap-2 text-center text-[#94A3B5] hover:border-[#3C80F5] hover:text-[#3C80F5] transition-colors"
                            >
                                <Plus size={22} />
                                <p className="text-[11.5px] font-medium">Add file</p>
                            </button>
                        </div>
                    </InfoCard>
                </div>
            </div>

            {showEditForm && (
                <PhaseForm
                    projectId={projectId}
                    editData={phase}
                    teamOptions={teamOptions}
                    onClose={() => setShowEditForm(false)}
                    onSuccess={() => loadPhase()}
                />
            )}

            {subPhaseFormState !== null && (
                <SubPhaseForm
                    phaseId={phase.id}
                    editData={subPhaseFormState.id ? subPhaseFormState : null}
                    onClose={() => setSubPhaseFormState(null)}
                    onSuccess={() => loadPhase()}
                />
            )}

            {taskFormFor !== null && (
                <TaskForm
                    phaseId={phase.id}
                    subPhaseId={taskFormFor || null}
                    teamOptions={teamOptions}
                    onClose={() => setTaskFormFor(null)}
                    onSuccess={() => loadPhase()}
                />
            )}
        </div>
    );
}