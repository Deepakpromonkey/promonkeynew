"use client";
import { cn } from "@/lib/utils";
import {
    AlertTriangle,
    AlertCircle,
    Ticket,
    FileText,
    CheckCircle,
    RefreshCw,
    PauseCircle,
    Flag,
} from "lucide-react";

/* ── Mock Data ── */
const STATS = [
    { label: "Active projects",       value: 9, highlight: false },
    { label: "At-risk projects",      value: 1, highlight: true,  color: "red" },
    { label: "Open tickets (1 high)", value: 2, highlight: true,  color: "red" },
    { label: "Live leads",            value: 6, highlight: false },
    { label: "Pending approvals",     value: 1, highlight: true,  color: "red" },
    { label: "Team members",          value: 8, highlight: false },
];

const AI_SUGGESTIONS = [
    "You have <b>4 open task(s)</b> — some are past due.",
    "<b>Green Fingers — Portal v2</b> health is At risk. Auth guard task is blocked.",
    "<b>TKT-031</b> is high priority and unassigned.",
];

const NEEDS_ATTENTION = [
    {
        icon: AlertCircle,
        iconColor: "text-[#DC2626]",
        iconBg:    "bg-[#FCEDED]",
        title: "Green Fingers — Portal v2 is at risk",
        desc: "Customer status portal + retainer dashboard. Consolidate order, delive...",
    },
    {
        icon: AlertTriangle,
        iconColor: "text-[#E08600]",
        iconBg:    "bg-[#FDF3E2]",
        title: "Blocked task in Green Fingers — Portal v2",
        desc: "Auth guard review",
    },
    {
        icon: Ticket,
        iconColor: "text-[#2563EB]",
        iconBg:    "bg-[#EAF1FE]",
        title: "High-priority ticket TKT-031",
        desc: "Delivery date not updating on 3 orders",
    },
];

const RECENT_ACTIVITY = [
    {
        initials: "DR",
        color:    "from-[#3C80F5] to-[#5B5BF6]",
        name:     "Deepak Rana",
        icon:     Flag,
        iconColor:"text-[#DC2626]",
        action:   "flagged project health as At risk — auth guard blocked",
        project:  "Green Fingers — Portal v2",
        time:     "5 hours ago",
    },
    {
        initials: "DG",
        color:    "from-[#763CF6] to-[#3C80F5]",
        name:     "Dev Gupta",
        icon:     FileText,
        iconColor:"text-[#69788C]",
        action:   "posted an update and requested approval from Deepak",
        project:  "Green Fingers — Portal v2",
        time:     "5 hours ago",
    },
    {
        initials: "AT",
        color:    "from-[#16A34A] to-[#3C80F5]",
        name:     "Amit Tanwar",
        icon:     CheckCircle,
        iconColor:"text-[#16A34A]",
        action:   "approved Anshul's design update",
        project:  "Green Fingers — Portal v2",
        time:     "1 day ago",
    },
    {
        initials: "DR",
        color:    "from-[#3C80F5] to-[#5B5BF6]",
        name:     "Deepak Rana",
        icon:     RefreshCw,
        iconColor:"text-[#E08600]",
        action:   "requested rework on Shlok's role-model update",
        project:  "Classic Fitness — CRM Rollout",
        time:     "20 hours ago",
    },
    {
        initials: "SG",
        color:    "from-[#E08600] to-[#763CF6]",
        name:     "Shlok Gupta",
        icon:     FileText,
        iconColor:"text-[#69788C]",
        action:   "posted an update",
        project:  "Classic Fitness — CRM Rollout",
        time:     "1 day ago",
    },
    {
        initials: "SG",
        color:    "from-[#E08600] to-[#763CF6]",
        name:     "Shlok Gupta",
        icon:     CheckCircle,
        iconColor:"text-[#16A34A]",
        action:   "completed task: Branch workflow map",
        project:  "Classic Fitness — CRM Rollout",
        time:     "4 days ago",
    },
    {
        initials: "AT",
        color:    "from-[#16A34A] to-[#3C80F5]",
        name:     "Amit Tanwar",
        icon:     PauseCircle,
        iconColor:"text-[#69788C]",
        action:   "put project on hold pending client content",
        project:  "DollarTraq — Freight Status Site",
        time:     "2 days ago",
    },
];

const UPCOMING_DEADLINES = [
    { task: "API + access layer",  project: "Green Fingers — Portal v2",        date: "18 Jun 2026", progress: 65, urgent: true  },
    { task: "UAT & launch",        project: "Green Fingers — Portal v2",        date: "30 Jun 2026", progress: 30, urgent: false },
    { task: "Core data model",     project: "Classic Fitness — CRM Rollout",    date: "30 Jun 2026", progress: 45, urgent: false },
    { task: "Branch workflows",    project: "Classic Fitness — CRM Rollout",    date: "31 Jul 2026", progress: 20, urgent: false },
    { task: "Launch & training",   project: "Classic Fitness — CRM Rollout",    date: "15 Aug 2026", progress: 10, urgent: false },
    { task: "Scope & wireframes",  project: "DollarTraq — Freight Status Site", date: "14 Jun 2026", progress: 80, urgent: true  },
];

/* ── Sub-components ── */
function Avatar({ initials, color = "from-[#3C80F5] to-[#763CF6]" }) {
    return (
        <div className={cn(
            "w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[12px] font-bold shrink-0",
            color
        )}>
            {initials}
        </div>
    );
}

function StatCard({ label, value, highlight, color }) {
    const isRed = highlight && color === "red";
    return (
        <div className={cn(
            "bg-white border rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06),0_6px_20px_rgba(27,35,48,.06)]  hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col gap-1",
            isRed ? "border-[#F3C9C9]" : "border-[#E7EBF2]"
        )}>
            <span className={cn(
                "text-[28px] font-black leading-none tracking-tight",
                isRed ? "text-[#DC2626]" : "text-[#1B2330]"
            )}>
                {value}
            </span>
            <span className="text-[12.5px] text-[#69788C] font-medium">{label}</span>
        </div>
    );
}

/* ── Main Page ── */
export default function DashboardPage() {
    const hour     = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const today    = new Date().toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
    });

    return (
        <div className="px-6 py-6 max-w-[1240px] w-full mx-auto">

            {/* Page header */}
            <div className="mb-5">
                <h1 className="text-[23px] font-black text-[#1B2330] tracking-[-0.4px]">
                    {greeting}, Dev
                </h1>
                <p className="text-[13px] text-[#69788C] mt-0.5">
                    Company snapshot for {today} · 137 working days left this year.
                </p>
            </div>

            {/* AI Suggestions */}
            <div className="bg-[#F3EFFE] border border-[#DDD5FC] rounded-2xl px-5 py-4 mb-5">
                <p className="text-[13.5px] font-bold text-[#763CF6] mb-2">✨ AI suggestions for Dev</p>
                <ul className="space-y-1">
                    {AI_SUGGESTIONS.map((s, i) => (
                        <li key={i} className="text-[13px] text-[#1B2330] flex items-start gap-2">
                            <span className="text-[#94A3B5] mt-0.5 shrink-0">•</span>
                            <span dangerouslySetInnerHTML={{ __html: s }} />
                        </li>
                    ))}
                </ul>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
                {STATS.map((s) => (
                    <StatCard key={s.label} {...s} />
                ))}
            </div>

            {/* Needs Attention */}
            <div className="bg-[#F3EFFE]  border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06),0_6px_20px_rgba(27,35,48,.06)] mb-5">
                <p className="text-[13px] font-bold text-[#E08600] mb-3 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-[#E08600]" />
                    Needs attention
                </p>
                <div className="space-y-3">
                    {NEEDS_ATTENTION.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <div key={i} className={cn(
                                "flex items-start gap-3 pb-3",
                                i < NEEDS_ATTENTION.length - 1 && "border-b border-[#EEF1F6]"
                            )}>
                                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", item.iconBg)}>
                                    <Icon size={14} className={item.iconColor} />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-[#1B2330]">{item.title}</p>
                                    <p className="text-[12px] text-[#69788C]">{item.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom two-col */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Recent Activity */}
                <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06),0_6px_20px_rgba(27,35,48,.06)]">
                    <p className="text-[10px] tracking-[1.4px] font-bold text-[#94A3B5] mb-4">RECENT ACTIVITY</p>
                    <div className="space-y-4">
                        {RECENT_ACTIVITY.map((a, i) => {
                            const Icon = a.icon;
                            return (
                                <div key={i} className="flex items-start gap-3">
                                    <Avatar initials={a.initials} color={a.color} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] text-[#1B2330] leading-snug flex items-center gap-1.5 flex-wrap">
                                            <Icon size={13} className={cn("shrink-0", a.iconColor)} />
                                            <span>{a.action}</span>
                                            <span className="text-[#3C80F5] font-semibold">· {a.project}</span>
                                        </p>
                                        <p className="text-[11.5px] text-[#94A3B5] mt-0.5">{a.name} · {a.time}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Upcoming Deadlines */}
                <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06),0_6px_20px_rgba(27,35,48,.06)]">
                    <p className="text-[10px] tracking-[1.4px] font-bold text-[#94A3B5] mb-4">UPCOMING DEADLINES</p>
                    <div className="space-y-4">
                        {UPCOMING_DEADLINES.map((d, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-[5px] h-10 rounded-full bg-[#EDF1F6] overflow-hidden shrink-0">
                                    <div
                                        className={cn(
                                            "w-full rounded-full",
                                            d.urgent
                                                ? "bg-gradient-to-b from-[#F87171] to-[#DC2626]"
                                                : "bg-gradient-to-b from-[#3C80F5] to-[#763CF6]"
                                        )}
                                        style={{ height: `${d.progress}%` }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-bold text-[#1B2330] truncate">{d.task}</p>
                                    <p className="text-[11.5px] text-[#69788C] truncate">{d.project}</p>
                                </div>
                                <span className={cn(
                                    "text-[12px] font-semibold shrink-0",
                                    d.urgent ? "text-[#DC2626]" : "text-[#69788C]"
                                )}>
                                    {d.date}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}