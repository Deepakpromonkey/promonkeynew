"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, Pencil, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import TicketCard from "@/components/tickets/TicketCard";
import TicketForm from "@/components/tickets/TicketForm";
import PhaseCard from "@/components/phases/PhaseCard";
import PhaseForm from "@/components/phases/PhaseForm";
import UpdatesTab from "@/components/updates/UpdatesTab";
import ActivityTab from "../activity/ActicityTab";
import FilesTab from "@/components/files/FilesTab";
import ChatTab from "./ChatTab";

const HEALTH_STYLES = {
    AT_RISK:  { bg: "bg-[#FCEDED] text-[#DC2626] border-[#F3C9C9]", dot: "bg-[#DC2626]", label: "At risk"  },
    ON_TRACK: { bg: "bg-[#EAF7EE] text-[#16A34A] border-[#BBF7D0]", dot: "bg-[#16A34A]", label: "On track" },
    DELAYED:  { bg: "bg-[#FDF3E2] text-[#E08600] border-[#FDE68A]", dot: "bg-[#E08600]", label: "Delayed"  },
    BLOCKED:  { bg: "bg-[#FCEDED] text-[#DC2626] border-[#F3C9C9]", dot: "bg-[#DC2626]", label: "Blocked"  },
};

const PRIORITY_STYLES = {
    URGENT: "bg-[#DC2626] text-white",
    HIGH:   "bg-[#DC2626] text-white",
    MED:    "bg-[#E08600] text-white",
    MEDIUM: "bg-[#E08600] text-white",
    LOW:    "bg-[#EEF1F6] text-[#69788C]",
};

const STATUS_STYLES = {
    ACTIVE:    "bg-[#EEF3FE] text-[#3C80F5]",
    COMPLETED: "bg-[#EAF7EE] text-[#16A34A]",
    ON_HOLD:   "bg-[#FDF3E2] text-[#E08600]",
    CANCELLED: "bg-[#FCEDED] text-[#DC2626]",
};

const TICKET_STATUS_FILTERS = [
    { value: "",            label: "All" },
    { value: "OPEN",        label: "Open" },
    { value: "IN_PROGRESS", label: "In progress" },
    { value: "RESOLVED",    label: "Resolved" },
    { value: "CLOSED",      label: "Closed" },
];

function MetaItem({ label, children }) {
    return (
        <div>
            <p className="text-[10px] tracking-[1.2px] font-bold text-[#94A3B5] mb-1">{label}</p>
            <div>{children}</div>
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

function Avatar({ name, color = "from-[#3C80F5] to-[#763CF6]", size = "md" }) {
    const initials = (name ?? "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const sz = size === "sm" ? "w-8 h-8 text-[11px]" : "w-10 h-10 text-[12px]";
    return (
        <div className={cn("rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0", sz, color)}>
            {initials}
        </div>
    );
}

function DeliveryPhasesCard({ phasesLoading, phases }) {
    return (
        <InfoCard title="DELIVERY PHASES">
            {phasesLoading ? (
                <div className="flex items-center gap-2 text-[#94A3B5] py-2">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-[12.5px]">Loading...</span>
                </div>
            ) : phases.length === 0 ? (
                <p className="text-[12.5px] text-[#94A3B5]">No phases yet.</p>
            ) : (
                <div className="space-y-3">
                    {phases.slice(0, 4).map((phase) => (
                        <div key={phase.id} className="flex items-start gap-3">
                            <div className={cn(
                                "w-3 h-3 rounded-full mt-0.5 shrink-0 border-2",
                                phase.status === "COMPLETED"   ? "bg-[#3C80F5] border-[#3C80F5]" :
                                phase.status === "IN_PROGRESS" ? "bg-[#763CF6] border-[#763CF6]" :
                                "bg-white border-[#D1D9E6]"
                            )} />
                            <div>
                                <p className="text-[13px] font-bold text-[#1B2330]">{phase.name}</p>
                                <p className="text-[11.5px] text-[#94A3B5]">
                                    {phase.dates} · {phase.status === "COMPLETED" ? "done" : phase.status === "IN_PROGRESS" ? "in progress" : "upcoming"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </InfoCard>
    );
}

const TABS = ["Overview", "Phases", "Project Load", "Project Runway", "Updates", "Activity", "Chat", "Tickets", "Files"];

const CLIENT_TABS = ["Overview", "Project Runway", "Updates", "Tickets"];

const MOCK_TEAM = [
    { id: "dev-gupta",    name: "Dev Gupta",    role: "Frontend Developer", color: "from-[#3C80F5] to-[#763CF6]" },
    { id: "deepak-rana",  name: "Deepak Rana",  role: "Lead Backend",       color: "from-[#763CF6] to-[#3C80F5]" },
    { id: "anshul-verma", name: "Anshul Verma", role: "UI/UX Designer",     color: "from-[#16A34A] to-[#3C80F5]" },
    { id: "shlok-gupta",  name: "Shlok Gupta",  role: "Backend Developer",  color: "from-[#E08600] to-[#763CF6]" },
];

const MOCK_FEEDBACK_TEAM = [
    { name: "Anshul Verma", tag: "TEAM",   time: "2 days ago", text: "Design handoff went smoothly this sprint — fewer back-and-forths.", color: "from-[#16A34A] to-[#3C80F5]" },
];
const MOCK_FEEDBACK_CLIENT = [
    { name: "Ravi Menon",   tag: "CLIENT", time: "3 days ago", text: "Really happy with the new dashboard look. Excited for launch!", color: "from-[#3C80F5] to-[#763CF6]" },
];
const MOCK_REMARKS = [
    { name: "Amit Tanwar",  tag: "REMARK", time: "1 day ago",  text: "Key risk: auth guard review must clear before UAT. Watch the timeline.", color: "from-[#E08600] to-[#763CF6]" },
];

const LEAD_COLORS = [
    "from-[#3C80F5] to-[#763CF6]",
    "from-[#763CF6] to-[#3C80F5]",
    "from-[#16A34A] to-[#3C80F5]",
    "from-[#E08600] to-[#763CF6]",
];

function fmtShort(d) {
    return d ? new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short" }) : "";
}

function mapPhase(ph, index = 0) {
    return {
        id:             ph.id,
        number:         index + 1,
        name:           ph.name,
        description:    ph.description,
        startDate:      ph.startDate,
        dueDate:        ph.dueDate,
        dates:          `${fmtShort(ph.startDate)}–${fmtShort(ph.dueDate)}`,
        priority:       ph.priority,
        status:         ph.status,
        estimatedHours: ph.estimatedHours,
        hoursEst:       ph.estimatedHours,
        loggedHours:    ph.loggedHours,
        hoursLogged:    ph.loggedHours,
        projectId:      ph.projectId,
        leadId:         ph.leadId,
        lead: ph.lead ? {
            id:     ph.lead.id,
            name:   ph.lead.legalName,
            avatar: ph.lead.profilePhotoUrl,
            color:  LEAD_COLORS[index % LEAD_COLORS.length],
        } : null,
        tasksTotal: ph.taskStats?.total ?? (ph.tasks?.length ?? 0),
        tasksDone:  ph.taskStats?.done  ?? (ph.tasks ?? []).filter(t => t.status === "DONE").length,
        tasks:      ph.tasks ?? [],
    };
}

export default function ProjectDetailPage({ params }) {
    const router = useRouter();
    const { user } = useAuth();
    const isAdmin  = user?.role?.toLowerCase() === "admin";
    const isClient = user?.role?.toLowerCase() === "client";

    const visibleTabs = isClient ? CLIENT_TABS : TABS;

    const resolvedParams = typeof params?.then === "function" ? use(params) : params;
    const id = resolvedParams?.id;

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");
    const [tab,     setTab]     = useState("Overview");

    const [tickets,        setTickets]        = useState([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);
    const [ticketsError,   setTicketsError]   = useState("");
    const [ticketStatus,   setTicketStatus]   = useState("");
    const [ticketsTotal,   setTicketsTotal]   = useState(0);
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [editingTicket,  setEditingTicket]  = useState(null);

    const [phases,        setPhases]        = useState([]);
    const [phasesLoading, setPhasesLoading] = useState(false);
    const [phasesError,   setPhasesError]   = useState("");
    const [showPhaseForm, setShowPhaseForm] = useState(false);
    const [editingPhase,  setEditingPhase]  = useState(null);

    useEffect(() => {
        if (!id) return;
        async function load() {
            setLoading(true); setError("");
            try {
                const json = await apiFetch(`/api/projects/${id}`);
                setProject(json.data ?? json);
            } catch (e) {
                setError(e.message);
            } finally { setLoading(false); }
        }
        load();
    }, [id]);

    async function loadTickets() {
        if (!id) return;
        setTicketsLoading(true); setTicketsError("");
        try {
            const qs = new URLSearchParams({ page: "1", limit: "10", ...(ticketStatus && { status: ticketStatus }) });
            const json = await apiFetch(`/api/tickets/project/${id}?${qs.toString()}`);

            const ticketList  = json.data?.tickets ?? json.tickets ?? [];
            const ticketTotal = json.data?.total ?? json.total ?? ticketList.length;

            setTickets(ticketList);
            setTicketsTotal(ticketTotal);
        } catch (e) {
            setTicketsError(e.message);
        } finally { setTicketsLoading(false); }
    }

    useEffect(() => {
        if (tab === "Tickets") loadTickets();
    }, [tab, id, ticketStatus]);

    async function loadPhases() {
        if (!id) return;
        setPhasesLoading(true); setPhasesError("");
        try {
            const json = await apiFetch(`/api/phases/project/${id}`);
            const list = json.data ?? [];
            setPhases(list.map((ph, i) => mapPhase(ph, i)));
        } catch (e) {
            setPhasesError(e.message);
        } finally { setPhasesLoading(false); }
    }

    useEffect(() => {
        loadPhases();
    }, [id]);

    useEffect(() => {
        if (isClient && !CLIENT_TABS.includes(tab)) {
            setTab("Overview");
        }
    }, [isClient, tab]);

    function handlePhaseSaved() {
        setEditingPhase(null);
        loadPhases();
    }

    function openEditPhase(phase) {
        setEditingPhase(phase);
        setShowPhaseForm(true);
    }

    function openEditTicket(ticket) {
        setEditingTicket(ticket);
        setShowTicketForm(true);
    }

    function closeTicketForm() {
        setShowTicketForm(false);
        setEditingTicket(null);
    }

    async function handlePhaseDelete(phase) {
        await apiFetch(`/api/phases/${phase.id}`, { method: "DELETE" });
        await loadPhases();
    }

    if (loading) return (
        <div className="flex items-center justify-center py-32 gap-3 text-[#94A3B5]">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[13px]">Loading project...</span>
        </div>
    );

    if (error) return (
        <div className="max-w-[1100px] mx-auto pt-6">
            <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[13px] font-medium">{error}</p>
                <button onClick={() => router.push("/promonkey/projects")} className="ml-auto text-[12.5px] font-bold underline">
                    Back to Projects
                </button>
            </div>
        </div>
    );

    if (!project) return null;

    const p = project;

    const serviceName = p.service?.name ?? p.serviceName ?? "—";

    const health   = HEALTH_STYLES[p.health] ?? HEALTH_STYLES.ON_TRACK;
    const priority = p.priority ?? "LOW";
    const isAtRisk = p.health === "AT_RISK";

    const fmt = (d) => d
        ? new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
        : "—";

    const tabCounts = {
        Phases:    p.progressPercentage ? `${p.progressPercentage}%` : "",
        Tickets: ticketsTotal ? ticketsTotal : "",
    };

    const teamOptions = (p.members?.length > 0 ? p.members : MOCK_TEAM).map(m => ({
        id:   m.id,
        name: m.legalName ?? m.name ?? "Team Member",
        role: m.designation ?? m.role ?? "",
    }));

    return (
        <div className="max-w-[1200px] mx-auto">

            {/* Back */}
            <button onClick={() => router.push("/promonkey/projects")}
                className="flex items-center gap-2 text-[13px] font-semibold text-[#69788C] hover:text-[#1B2330] mb-5 transition-colors">
                <ArrowLeft size={14} /> Back to projects
            </button>

            {/* Header card */}
            <div className="bg-white border border-[#E7EBF2] rounded-2xl p-6 shadow-[0_1px_2px_rgba(27,35,48,.06),0_4px_16px_rgba(27,35,48,.06)] mb-4">

                {/* AT RISK badge */}
                {isAtRisk && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FCEDED] border border-[#F3C9C9] text-[#DC2626] text-[12px] font-bold mb-4">
                        ⚠️ AT RISK — NEEDS ATTENTION
                    </div>
                )}

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[12px] text-[#94A3B5] font-semibold mb-1">
                            {p.code ?? `PRJ-${p.id?.slice(-3).toUpperCase()}`} · {serviceName}
                        </p>
                        <h1 className="text-[24px] font-black text-[#1B2330] tracking-[-0.4px]">{p.name}</h1>
                        <p className="text-[13.5px] text-[#69788C] mt-0.5">{p.client?.companyName?.trim() ?? "—"}</p>
                    </div>
                    {!isClient && (
                        <button
                            onClick={() => {}}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E7EBF2] text-[12.5px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors shrink-0"
                        >
                            <Pencil size={13} /> Edit
                        </button>
                    )}
                </div>

                {/* Meta row 1 */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-5 mt-6 pb-5 border-b border-[#EEF1F6]">
                    <MetaItem label="STATUS">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold", STATUS_STYLES[p.status] ?? STATUS_STYLES.ACTIVE)}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {(p.status ?? "ACTIVE").replace(/_/g, " ")}
                        </span>
                    </MetaItem>
                    <MetaItem label="HEALTH">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border", health.bg)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", health.dot)} />
                            {health.label}
                        </span>
                    </MetaItem>
                    <MetaItem label="SERVICE">
                        <span className="text-[13px] font-semibold text-[#1B2330]">{serviceName}</span>
                    </MetaItem>
                    <MetaItem label="PRIORITY">
                        <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[12px] font-black", PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.LOW)}>
                            {priority === "URGENT" ? "HIGH" : priority}
                        </span>
                    </MetaItem>
                    <MetaItem label="ENGAGEMENT">
                        <span className="text-[13px] font-semibold text-[#1B2330]">
                            {p.engagementType?.replace(/_/g, " + ") ?? "—"}
                        </span>
                    </MetaItem>
                    <MetaItem label="ACCOUNT OWNER">
                        {p.lead ? (
                            <div className="flex items-center gap-2">
                                <Avatar name={p.lead?.legalName ?? "?"} size="sm" color="from-[#3C80F5] to-[#763CF6]" />
                                <span className="text-[13px] font-semibold text-[#1B2330]">{p.lead?.legalName ?? "—"}</span>
                            </div>
                        ) : <span className="text-[13px] text-[#94A3B5]">—</span>}
                    </MetaItem>
                </div>

                {/* Meta row 2 */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-5 mt-5">
                    <MetaItem label="PROJECT MANAGER">
                        {p.lead ? (
                            <div className="flex items-center gap-2">
                                <Avatar name={p.lead?.legalName ?? "?"} size="sm" color="from-[#E08600] to-[#763CF6]" />
                                <span className="text-[13px] font-semibold text-[#1B2330]">{p.lead?.legalName ?? "—"}</span>
                            </div>
                        ) : <span className="text-[13px] text-[#94A3B5]">—</span>}
                    </MetaItem>
                    <MetaItem label="START">
                        <span className="text-[13px] font-semibold text-[#1B2330]">{fmt(p.createdAt)}</span>
                    </MetaItem>
                    <MetaItem label="DUE">
                        <span className="text-[13px] font-semibold text-[#1B2330]">{fmt(p.dueDate)}</span>
                    </MetaItem>
                    <MetaItem label="HOURS (LOGGED/EST)">
                        <span className="text-[13px] font-semibold text-[#1B2330]">— / {p.estimatedHours ?? "—"}</span>
                    </MetaItem>
                    <MetaItem label="COMPLETION">
                        <span className="text-[13px] font-semibold text-[#1B2330]">{p.progressPercentage ?? 0}%</span>
                    </MetaItem>
                    <MetaItem label="TAGS">
                        <div className="flex flex-wrap gap-1">
                            {(p.techStack ?? []).slice(0, 3).map(tag => (
                                <span key={tag} className="text-[12px] font-medium text-[#69788C]">{tag}</span>
                            ))}
                        </div>
                    </MetaItem>
                </div>

                {/* Tabs — role-gated: clients only see visibleTabs (CLIENT_TABS) */}
                <div className="flex gap-1 mt-5 border-b border-[#E7EBF2] -mx-6 px-6 overflow-x-auto">
                    {visibleTabs.map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={cn(
                                "px-4 py-2.5 text-[13px] font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap shrink-0",
                                t === tab
                                    ? "text-[#3C80F5] border-[#3C80F5]"
                                    : "text-[#69788C] border-transparent hover:text-[#1B2330]"
                            )}>
                            {t}{tabCounts[t] ? ` ${tabCounts[t]}` : ""}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview tab */}
            {tab === "Overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
                    <div className="space-y-4">

                        {/* Project Brief */}
                        <InfoCard title="PROJECT BRIEF">
                            <p className="text-[13.5px] text-[#1B2330] leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: p.description || "No description provided." }}
                            />
                        </InfoCard>

                        {/* Client Inputs — labels derived from camelCase keys */}
                        {p.clientRequirements && Object.keys(p.clientRequirements).length > 0 && (
                            <InfoCard title={`CLIENT INPUTS · ${serviceName.toUpperCase()}`}>
                                <div className="grid grid-cols-2 gap-4">
                                    {Object.entries(p.clientRequirements).map(([key, val]) => (
                                        <div key={key}>
                                            <p className="text-[10px] tracking-[1px] font-bold text-[#94A3B5] mb-1">
                                                {key
                                                    .replace(/([A-Z])/g, " $1")
                                                    .replace(/^./, c => c.toUpperCase())
                                                    .toUpperCase()}
                                            </p>
                                            <p className="text-[13px] font-semibold text-[#1B2330]">{val || "—"}</p>
                                        </div>
                                    ))}
                                </div>
                            </InfoCard>
                        )}

                        {/* At a Glance */}
                        <InfoCard title="AT A GLANCE">
                            <div className="grid grid-cols-4 gap-4">
                                {[
                                    { label: "TASKS DONE",   value: "8 / 13" },
                                    { label: "OPEN TICKETS", value: "2"      },
                                    { label: "UPDATES",      value: "2"      },
                                    { label: "HOURS LOGGED", value: `— / ${p.estimatedHours ?? "—"}` },
                                ].map(item => (
                                    <div key={item.label}>
                                        <p className="text-[10px] tracking-[1px] font-bold text-[#94A3B5] mb-1">{item.label}</p>
                                        <p className="text-[18px] font-black text-[#1B2330]">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </InfoCard>

                        {/* Team Feedback — internal only, hidden from clients */}
                        {!isClient && (
                            <InfoCard title="TEAM FEEDBACK">
                                <div className="space-y-3">
                                    {MOCK_FEEDBACK_TEAM.map((f, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <Avatar name={f.name} color={f.color} size="sm" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[13px] font-bold text-[#1B2330]">{f.name}</span>
                                                    <span className="px-2 py-0.5 rounded-full bg-[#EEF3FE] text-[10px] font-bold text-[#3C80F5]">{f.tag}</span>
                                                    <span className="text-[11.5px] text-[#94A3B5]">{f.time}</span>
                                                </div>
                                                <p className="text-[13px] text-[#69788C]">{f.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </InfoCard>
                        )}

                        {/* Client Feedback */}
                        <InfoCard title="CLIENT FEEDBACK">
                            <div className="space-y-3">
                                {MOCK_FEEDBACK_CLIENT.map((f, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <Avatar name={f.name} color={f.color} size="sm" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[13px] font-bold text-[#1B2330]">{f.name}</span>
                                                <span className="px-2 py-0.5 rounded-full bg-[#FDF3E2] text-[10px] font-bold text-[#E08600]">{f.tag}</span>
                                                <span className="text-[11.5px] text-[#94A3B5]">{f.time}</span>
                                            </div>
                                            <p className="text-[13px] text-[#69788C]">{f.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </InfoCard>

                        {/* Project Remarks — internal only, hidden from clients */}
                        {!isClient && (
                            <InfoCard title="PROJECT REMARKS">
                                <div className="space-y-3">
                                    {MOCK_REMARKS.map((r, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <Avatar name={r.name} color={r.color} size="sm" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[13px] font-bold text-[#1B2330]">{r.name}</span>
                                                    <span className="px-2 py-0.5 rounded-full bg-[#FDF3E2] text-[10px] font-bold text-[#E08600]">{r.tag}</span>
                                                    <span className="text-[11.5px] text-[#94A3B5]">{r.time}</span>
                                                </div>
                                                <p className="text-[13px] text-[#69788C]">{r.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </InfoCard>
                        )}
                    </div>

                    {/* Right sidebar */}
                    <div className="space-y-4">

                        {/* Delivery Phases — now backed by real phase data */}
                        <DeliveryPhasesCard phasesLoading={phasesLoading} phases={phases} />

                        {/* Project Team */}
                        <InfoCard title="PROJECT TEAM">
                            <div className="space-y-3">
                                {(p.members?.length > 0 ? p.members : MOCK_TEAM).map((m, i) => {
                                    const name = m.legalName ?? m.name ?? "Team Member";
                                    const role = m.designation ?? m.role ?? "Member";
                                    const colors = ["from-[#3C80F5] to-[#763CF6]","from-[#763CF6] to-[#3C80F5]","from-[#16A34A] to-[#3C80F5]","from-[#E08600] to-[#763CF6]"];
                                    return (
                                        <div key={i} className="flex items-center gap-3">
                                            <Avatar name={name} color={m.color ?? colors[i % colors.length]} size="sm" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-semibold text-[#1B2330]">{name}</p>
                                                <p className="text-[11.5px] text-[#94A3B5]">{role}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </InfoCard>

                        {/* Tech Stack */}
                        {p.techStack?.length > 0 && (
                            <InfoCard title="TECH STACK">
                                <div className="flex flex-wrap gap-2">
                                    {p.techStack.map(tag => (
                                        <span key={tag} className="px-2.5 py-1 rounded-lg bg-[#EEF1F6] text-[12px] font-semibold text-[#69788C]">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </InfoCard>
                        )}

                        {/* Required Resources — internal only, hidden from clients */}
                        {!isClient && p.requiredResources && Object.keys(p.requiredResources).length > 0 && (
                            <InfoCard title="REQUIRED RESOURCES">
                                <div className="space-y-2">
                                    {Object.entries(p.requiredResources).map(([role, count]) => (
                                        <div key={role} className="flex items-center justify-between py-2 border-b border-[#EEF1F6] last:border-0">
                                            <span className="text-[13px] text-[#1B2330]">{role}</span>
                                            <span className="text-[13px] font-bold text-[#1B2330]">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </InfoCard>
                        )}
                    </div>
                </div>
            )}

            {/* Plan tab — staff/admin only (not in CLIENT_TABS, guarded by visibleTabs + safety effect) */}
            {tab === "Phases" && !isClient && (
                <div>
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                        <p className="text-[13.5px] text-[#69788C]">Each phase is a mini-project — click to open.</p>
                        <button
                            onClick={() => { setEditingPhase(null); setShowPhaseForm(true); }}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity"
                        >
                            <Plus size={14} /> Add phase
                        </button>
                    </div>

                    {/* Loading */}
                    {phasesLoading && (
                        <div className="flex items-center justify-center py-16 gap-3 text-[#94A3B5]">
                            <Loader2 size={18} className="animate-spin" />
                            <span className="text-[13px]">Loading phases...</span>
                        </div>
                    )}

                    {/* Error */}
                    {!phasesLoading && phasesError && (
                        <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                            <AlertCircle size={16} className="shrink-0" />
                            <p className="text-[13px] font-medium">{phasesError}</p>
                        </div>
                    )}

                    {!phasesLoading && !phasesError && phases.length === 0 && (
                        <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-16 text-center text-[#94A3B5] shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                            <p className="text-[14px] font-semibold">No phases yet</p>
                            <p className="text-[12.5px] mt-1">Add a phase to start breaking this project into milestones.</p>
                        </div>
                    )}

                    {!phasesLoading && !phasesError && phases.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {phases.map(phase => (
                                <PhaseCard
                                    key={phase.id}
                                    phase={phase}
                                    projectId={id}
                                    onEdit={openEditPhase}
                                    onDelete={handlePhaseDelete}
                                />
                            ))}
                        </div>
                    )}

                    {showPhaseForm && (
                        <PhaseForm
                            projectId={id}
                            editData={editingPhase}
                            teamOptions={teamOptions}
                            onClose={() => { setShowPhaseForm(false); setEditingPhase(null); }}
                            onSuccess={handlePhaseSaved}
                        />
                    )}
                </div>
            )}

            {/* Project Runway tab — client-visible read-only view of phases */}
            {tab === "Project Runway" && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
                    <div>
                        {phasesLoading && (
                            <div className="flex items-center justify-center py-16 gap-3 text-[#94A3B5]">
                                <Loader2 size={18} className="animate-spin" />
                                <span className="text-[13px]">Loading phases...</span>
                            </div>
                        )}

                        {!phasesLoading && phasesError && (
                            <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                                <AlertCircle size={16} className="shrink-0" />
                                <p className="text-[13px] font-medium">{phasesError}</p>
                            </div>
                        )}

                        {!phasesLoading && !phasesError && phases.length === 0 && (
                            <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-16 text-center text-[#94A3B5] shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                                <p className="text-[14px] font-semibold">No phases yet</p>
                            </div>
                        )}

                        {!phasesLoading && !phasesError && phases.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {phases.map(phase => (
                                    <PhaseCard
                                        key={phase.id}
                                        phase={phase}
                                        projectId={id}
                                        readOnly={isClient}
                                        onEdit={isClient ? undefined : openEditPhase}
                                        onDelete={isClient ? undefined : handlePhaseDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="space-y-4">
                        <DeliveryPhasesCard phasesLoading={phasesLoading} phases={phases} />
                    </div>
                </div>
            )}

            {tab === "Chat" && !isClient && (
                <ChatTab projectId={p.id} />
            )}

            {/* Tickets tab */}
            {tab === "Tickets" && (
                <div>
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                        <p className="text-[13.5px] text-[#69788C]">
                            {isClient ? "Raise a ticket for anything you need." : "Tickets for this project."}
                        </p>
                        <div className="flex items-center gap-2 ml-auto">
                            <select
                                value={ticketStatus}
                                onChange={(e) => setTicketStatus(e.target.value)}
                                className="h-9 px-3 rounded-xl border border-[#E7EBF2] bg-white text-[12.5px] font-semibold text-[#1B2330] outline-none focus:border-[#3C80F5]"
                            >
                                {TICKET_STATUS_FILTERS.map(f => (
                                    <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                            </select>
                            <button
                                onClick={() => setShowTicketForm(true)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity"
                            >
                                <Plus size={14} /> Raise a ticket
                            </button>
                        </div>
                    </div>

                    {/* Loading */}
                    {ticketsLoading && (
                        <div className="flex items-center justify-center py-16 gap-3 text-[#94A3B5]">
                            <Loader2 size={18} className="animate-spin" />
                            <span className="text-[13px]">Loading tickets...</span>
                        </div>
                    )}

                    {/* Error */}
                    {!ticketsLoading && ticketsError && (
                        <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                            <AlertCircle size={16} className="shrink-0" />
                            <p className="text-[13px] font-medium">{ticketsError}</p>
                        </div>
                    )}

                    {/* Empty */}
                    {!ticketsLoading && !ticketsError && tickets.length === 0 && (
                        <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-16 text-center text-[#94A3B5] shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                            <p className="text-[14px] font-semibold">No tickets yet</p>
                            <p className="text-[12.5px] mt-1">Raise a ticket to track an issue or request for this project.</p>
                        </div>
                    )}

                    {/* List */}
                    {!ticketsLoading && !ticketsError && tickets.length > 0 && (
                        <div className="space-y-3">
                            {tickets.map(ticket => (
                                <TicketCard key={ticket.id} ticket={ticket} projectId={id} onEdit={openEditTicket} />
                            ))}
                        </div>
                    )}

                    {/* Raise ticket modal */}
                    {showTicketForm && (
                        <TicketForm
                            projectId={id}
                            editData={editingTicket}
                            onClose={() => setShowTicketForm(false)}
                            onSuccess={loadTickets}
                        />
                    )}
                </div>
            )}

            {/* Updates tab */}
            {tab === "Updates" && (
                <UpdatesTab projectId={id} projectLead={p.lead?.id} readOnly={isClient} />
            )}
            {/* Activity tab — staff/admin only (not in CLIENT_TABS) */}
            {tab === "Activity" && !isClient && (
                <ActivityTab projectId={id} />
            )}

            {/* Files tab — staff/admin only (not in CLIENT_TABS) */}
            {tab === "Files" && !isClient && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
                    <FilesTab projectId={id} />
                    <div className="space-y-4">
                        <DeliveryPhasesCard phasesLoading={phasesLoading} phases={phases} />
                    </div>
                </div>
            )}

            {/* Other tabs placeholder */}
            {tab !== "Overview" && tab !== "Phases" && tab !== "Project Runway" && tab !== "Tickets" && tab !== "Updates" && tab !== "Activity" && tab !== "Chat" && tab !== "Files" && (
                <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-16 text-center text-[#94A3B5] shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                    <p className="text-[14px] font-semibold">{tab}</p>
                    <p className="text-[12.5px] mt-1">This section will be available once the API is connected.</p>
                </div>
            )}
        </div>
    );
}