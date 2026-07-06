"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
    ArrowLeft, Check, Plus, Minus, Search, ChevronDown,
    Bold, Italic, UnderlineIcon, Link2, ImageIcon,
    AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
    Calendar, Trash2, Loader2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

/* ─── Constants ─── */
const PRIORITY_OPTS   = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const ENGAGEMENT_OPTS = ["PROJECT", "RETAINER", "RETAINER_BUILD"];
const STATUS_OPTS     = ["ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"];
const HEALTH_OPTS     = ["ON_TRACK", "AT_RISK", "DELAYED", "BLOCKED"];

const MILESTONE_TYPE_COLORS = {
    INTERNAL_MEETING: { bg: "bg-[#EEF3FE]", text: "text-[#3C80F5]", dot: "border-[#3C80F5]", filled: false },
    MILESTONE:        { bg: "bg-[#EEF3FE]", text: "text-[#763CF6]", dot: "border-[#763CF6]", filled: true  },
    CLIENT_MEETING:   { bg: "bg-[#EEF3FE]", text: "text-[#3C80F5]", dot: "border-[#3C80F5]", filled: false },
};

/* ─── Helpers ─── */
function fmtDateInput(d) {
    return new Date(d).toISOString().split("T")[0];
}
function labelOf(val) {
    return (val ?? "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
function labelToKey(label) {
    return label
        .replace(/[^a-zA-Z0-9\s]/g, " ")
        .trim()
        .split(/\s+/)
        .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
}

function useClickOutside(ref, onOutside, active) {
    useEffect(() => {
        if (!active) return;
        function handle(e) {
            if (ref.current && !ref.current.contains(e.target)) onOutside();
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [ref, onOutside, active]);
}

function RichEditor({ editor }) {
    if (!editor) return null;
    function addImage() { const u = prompt("Image URL:"); if (u) editor.chain().focus().setImage({ src: u }).run(); }
    function addLink()  { const u = prompt("URL:");       if (u) editor.chain().focus().setLink({ href: u }).run(); }
    const btn = (active, onClick, icon) => (
        <button type="button" onClick={onClick}
            className={cn("w-7 h-7 flex items-center justify-center rounded-lg transition-colors",
                active ? "bg-[#EEF3FE] text-[#3C80F5]" : "text-[#69788C] hover:bg-[#F7F9FC]"
            )}>
            {icon}
        </button>
    );
    return (
        <div className="border border-[#E7EBF2] rounded-xl overflow-hidden bg-white">
            <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#E7EBF2] bg-[#F7F9FC] flex-wrap">
                {btn(editor.isActive("bold"),      () => editor.chain().focus().toggleBold().run(),      <Bold size={13} />)}
                {btn(editor.isActive("italic"),    () => editor.chain().focus().toggleItalic().run(),    <Italic size={13} />)}
                {btn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon size={13} />)}
                <div className="w-px h-5 bg-[#E7EBF2] mx-1" />
                {btn(editor.isActive({ textAlign: "left" }),   () => editor.chain().focus().setTextAlign("left").run(),   <AlignLeft size={13} />)}
                {btn(editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), <AlignCenter size={13} />)}
                {btn(editor.isActive({ textAlign: "right" }),  () => editor.chain().focus().setTextAlign("right").run(),  <AlignRight size={13} />)}
                <div className="w-px h-5 bg-[#E7EBF2] mx-1" />
                {btn(editor.isActive("bulletList"),  () => editor.chain().focus().toggleBulletList().run(),  <List size={13} />)}
                {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered size={13} />)}
                <div className="w-px h-5 bg-[#E7EBF2] mx-1" />
                {btn(editor.isActive("link"), addLink,  <Link2 size={13} />)}
                {btn(false,                   addImage, <ImageIcon size={13} />)}
            </div>
            <EditorContent editor={editor} className="min-h-[120px] px-3 py-2 text-[13px] text-[#1B2330] prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[100px]" />
        </div>
    );
}

/* ─── Step indicator ─── */
function StepBar({ current }) {
    const steps = [
        { n: 1, label: "Basic details",   sub: "Type & overview" },
        { n: 2, label: "Client inputs",   sub: "Requirements"    },
        { n: 3, label: "Internal inputs", sub: "Team & estimate" },
        { n: 4, label: "Project runway",  sub: "Timeline"        },
    ];
    return (
        <div className="flex items-center gap-0 mb-8">
            {steps.map((s, i) => (
                <div key={s.n} className="flex items-center flex-1">
                    <button type="button" className="flex items-center gap-3 shrink-0">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-colors",
                            current > s.n  ? "bg-[#16A34A] text-white" :
                            current === s.n ? "bg-[#3C80F5] text-white" :
                            "bg-[#EEF1F6] text-[#69788C]"
                        )}>
                            {current > s.n ? <Check size={14} /> : s.n}
                        </div>
                        <div className="text-left">
                            <p className={cn("text-[13px] font-bold",
                                current === s.n ? "text-[#3C80F5]" : current > s.n ? "text-[#1B2330]" : "text-[#94A3B5]")}>
                                {s.label}
                            </p>
                            <p className="text-[11px] text-[#94A3B5]">{s.sub}</p>
                        </div>
                    </button>
                    {i < steps.length - 1 && (
                        <div className={cn("flex-1 h-[2px] mx-4 rounded", current > s.n ? "bg-[#16A34A]" : "bg-[#EEF1F6]")} />
                    )}
                </div>
            ))}
        </div>
    );
}

/* ─── Main Page ─── */
export default function EditProjectPage({ params }) {
    const router = useRouter();
    const resolvedParams = typeof params?.then === "function" ? use(params) : params;
    const id = resolvedParams?.id;

    const [step, setStep] = useState(1);
    const [loading,    setLoading]    = useState(true);
    const [loadError,  setLoadError]  = useState("");
    const [saving,     setSaving]     = useState(false);

    /* ── Data from APIs ── */
    const [services,  setServices]  = useState([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [clients,   setClients]   = useState([]);
    const [employees, setEmployees] = useState([]);
    const [roles,        setRoles]        = useState([]);   // ← from /api/roles
    const [rolesLoading, setRolesLoading] = useState(true);

    /* ── Step 1 ── */
    const [serviceId,   setServiceId]   = useState("");
    const [name,        setName]        = useState("");
    const [clientId,    setClientId]    = useState("");
    const [clientName,  setClientName]  = useState("");
    const [clientOpen,  setClientOpen]  = useState(false);
    const [clientQ,     setClientQ]     = useState("");
    const clientRef = useRef(null);
    useClickOutside(clientRef, () => { setClientOpen(false); setClientQ(""); }, clientOpen);

    const [priority,   setPriority]   = useState("MEDIUM");
    const [engagement, setEngagement] = useState("PROJECT");
    const [status,     setStatus]     = useState("ACTIVE");
    const [health,     setHealth]     = useState("ON_TRACK");
    const [nameErr,    setNameErr]    = useState("");

    const descEditor = useEditor({
        extensions: [
            StarterKit, Underline,
            Link.configure({ openOnClick: false }),
            Image,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Placeholder.configure({ placeholder: "Describe the project..." }),
        ],
    });

    /* ── Step 2 ── */
    const [clientInputs, setClientInputs] = useState({});

    /* ── Step 3 ── */
    const [resources, setResources] = useState({}); // keyed by role.id
    const [estHours,  setEstHours]  = useState(160);
    const [memberIds, setMemberIds] = useState([]);
    const [leadId,    setLeadId]    = useState("");
    const [leadName,  setLeadName]  = useState("");
    const [leadOpen,  setLeadOpen]  = useState(false);
    const [leadQ,     setLeadQ]     = useState("");
    const leadRef = useRef(null);
    useClickOutside(leadRef, () => { setLeadOpen(false); setLeadQ(""); }, leadOpen);

    const [techStack,   setTechStack]   = useState("");

    const instrEditor = useEditor({
        extensions: [
            StarterKit, Underline,
            Link.configure({ openOnClick: false }),
            Image,
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Placeholder.configure({ placeholder: "Anything the team should know..." }),
        ],
    });

    /* ── Step 4 ── */
    const [milestones, setMilestones] = useState([]);

    /* ── Derived ── */
    const selectedService = services.find(s => s.id === serviceId) ?? null;
    const page2Fields     = selectedService?.page2Fields ?? [];

    const filteredClients   = clients.filter(c => c.companyName?.toLowerCase().includes(clientQ.toLowerCase()));
    const filteredEmployees = employees.filter(e => (e.legalName ?? "").toLowerCase().includes(leadQ.toLowerCase()));

    /* ── Load everything ── */
    useEffect(() => {
        if (!id) return;
        async function load() {
            setLoading(true); setLoadError(""); setRolesLoading(true);
            try {
                const [projJson, svcJson, clientJson, empJson, rolesJson] = await Promise.all([
                    apiFetch(`/api/projects/${id}`),
                    apiFetch("/api/services"),
                    apiFetch("/api/clients?limit=100"),
                    apiFetch("/api/employees?limit=100"),
                    apiFetch("/api/roles"),
                ]);

                const svcData = svcJson.data ?? [];
                setServices(svcData);
                setServicesLoading(false);
                setClients(clientJson.data ?? []);
                setEmployees(empJson.data ?? []);

                const rolesData = rolesJson.data ?? [];
                setRoles(rolesData);
                setRolesLoading(false);

                const p = projJson.data ?? projJson;

                setServiceId(p.serviceId ?? p.service?.id ?? "");
                setName(p.name ?? "");
                setClientId(p.clientId ?? p.client?.id ?? "");
                setClientName(p.client?.companyName?.trim() ?? "");
                setPriority(p.priority ?? "MEDIUM");
                setEngagement(p.engagementType ?? "PROJECT");
                setStatus(p.status ?? "ACTIVE");
                setHealth(p.health ?? "ON_TRACK");
                descEditor?.commands.setContent(p.description ?? "");

                setClientInputs(p.clientRequirements ?? {});

                // Map saved requiredResources (keyed by role name) onto role IDs, clamped to availability
                const initialResources = Object.fromEntries(rolesData.map(r => [r.id, 0]));
                Object.entries(p.requiredResources ?? {}).forEach(([roleName, count]) => {
                    const role = rolesData.find(r => r.name === roleName);
                    if (role) initialResources[role.id] = Math.min(count, role.members ?? count);
                });
                setResources(initialResources);

                setEstHours(p.estimatedHours ?? 0);
                setMemberIds((p.members ?? []).map(m => m.id));
                setLeadId(p.lead?.id ?? "");
                setLeadName(p.lead?.legalName ?? "");
                setTechStack((p.techStack ?? []).join(", "));
                instrEditor?.commands.setContent(p.customInstructions ?? "");

                setMilestones((p.milestones ?? []).map(m => ({
                    id:          m.id,
                    title:       m.title ?? "",
                    type:        m.type ?? "MILESTONE",
                    dueDate:     m.dueDate ?? new Date().toISOString(),
                    description: m.description ?? "",
                })));
            } catch (e) {
                setLoadError(e.message);
            } finally { setLoading(false); }
        }
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, descEditor, instrEditor]);

    /* ── Handlers ── */
    function toggleMember(emp) {
        setMemberIds(prev => prev.includes(emp.id) ? prev.filter(x => x !== emp.id) : [...prev, emp.id]);
    }
    function updateResource(roleId, delta) {
        setResources(prev => {
            const role = roles.find(r => r.id === roleId);
            const max = role?.members ?? 0;
            const next = Math.min(max, Math.max(0, (prev[roleId] ?? 0) + delta));
            return { ...prev, [roleId]: next };
        });
    }
    function updateMilestone(i, field, val) {
        setMilestones(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
    }
    function addMilestone() {
        setMilestones(prev => [...prev, { title: "", type: "MILESTONE", dueDate: new Date().toISOString(), description: "" }]);
    }
    function removeMilestone(i) {
        setMilestones(prev => prev.filter((_, idx) => idx !== i));
    }

    function goNext() {
        if (step === 1) {
            if (!name.trim())  { setNameErr("Project name is required"); return; }
            if (!serviceId)    { toast.error({ title: "Template required", message: "Please select a service template." }); return; }
            if (!clientId)     { toast.error({ title: "Client required",   message: "Please select a client." }); return; }
            setNameErr("");
        }
        setStep(s => s + 1);
    }

    /* ── Submit ── */
    async function handleSave() {
        setSaving(true);
        try {
            const reqResources = {};
            Object.entries(resources).forEach(([roleId, count]) => {
                if (count > 0) {
                    const role = roles.find(r => r.id === roleId);
                    if (role) reqResources[role.name] = count;
                }
            });

            const techArr = techStack.split(",").map(s => s.trim()).filter(Boolean);

            const clientRequirements = {};
            page2Fields.forEach(f => {
                const key = labelToKey(f.label);
                clientRequirements[key] = clientInputs[key] ?? "";
            });

            const payload = {
                name,
                description:        descEditor?.getHTML() ?? "",
                serviceId,
                priority,
                engagementType:     engagement,
                status,
                health,
                clientId,
                clientRequirements,
                estimatedHours:     Number(estHours) || 0,
                techStack:          techArr,
                customInstructions: instrEditor?.getHTML() ?? "",
                requiredResources:  reqResources,
                leadId:             leadId || undefined,
                memberIds,
                milestones: milestones.map(m => ({
                    ...(m.id && { id: m.id }),
                    title:       m.title,
                    type:        m.type,
                    dueDate:     m.dueDate,
                    description: m.description || undefined,
                })),
            };

            await apiFetch(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
            toast.success({ title: "Project updated", message: `"${name}" has been saved.` });
            router.push(`/promonkey/projects/${id}`);
        } catch (e) {
            toast.error({ title: "Failed to update project", message: e.message });
        } finally { setSaving(false); }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-32 gap-3 text-[#94A3B5]">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[13px]">Loading project...</span>
        </div>
    );

    if (loadError) return (
        <div className="max-w-[1000px] mx-auto pt-6">
            <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[13px] font-medium">{loadError}</p>
            </div>
        </div>
    );

    /* ─── Render ─── */
    return (
        <div className="max-w-[1000px] mx-auto">

            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <button onClick={() => router.push(`/promonkey/projects/${id}`)}
                    className="flex items-center gap-1.5 text-[13px] font-semibold text-[#69788C] hover:text-[#1B2330] transition-colors">
                    <ArrowLeft size={14} /> Cancel
                </button>
            </div>
            <h1 className="text-[24px] font-black text-[#1B2330] tracking-[-0.4px] mb-1">Edit project</h1>
            <p className="text-[13px] text-[#69788C] mb-6">Update any field, four steps at a time.</p>

            <StepBar current={step} />

            <div className="bg-white border border-[#E7EBF2] rounded-2xl p-7 shadow-[0_1px_2px_rgba(27,35,48,.06),0_4px_16px_rgba(27,35,48,.06)]">

                {/* ══ STEP 1 ══ */}
                {step === 1 && (
                    <div>
                        <h2 className="text-[16px] font-bold text-[#1B2330] mb-1">Step 1 · Basic details</h2>
                        <p className="text-[13px] text-[#69788C] mb-5">Service template, name, client, and overview.</p>

                        {/* Service template grid */}
                        {servicesLoading ? (
                            <div className="flex items-center gap-2 py-8 text-[#94A3B5]">
                                <Loader2 size={16} className="animate-spin" />
                                <span className="text-[13px]">Loading templates...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 mb-6">
                                {services.map(svc => (
                                    <button key={svc.id} type="button" onClick={() => setServiceId(svc.id)}
                                        className={cn(
                                            "flex flex-col items-center gap-2 px-2 py-3 rounded-xl border text-[12px] font-semibold transition-all",
                                            serviceId === svc.id
                                                ? "border-[#3C80F5] bg-[#EEF3FE] text-[#3C80F5]"
                                                : "border-[#E7EBF2] text-[#69788C] hover:bg-[#F7F9FC]"
                                        )}>
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-md",
                                            serviceId === svc.id ? "bg-[#3C80F5]/10 text-[#3C80F5]" : "bg-[#EEF1F6] text-[#69788C]"
                                        )}>
                                            {svc.icon}
                                        </span>
                                        <span className="text-center leading-tight">{svc.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Name + Client */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">
                                    Project name <span className="text-[#DC2626]">*</span>
                                </label>
                                <input value={name} onChange={e => { setName(e.target.value); setNameErr(""); }}
                                    placeholder={selectedService ? `${selectedService.name} project` : "Project name"}
                                    className={cn(
                                        "w-full h-10 px-3.5 rounded-xl border text-[13px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none transition-colors",
                                        nameErr ? "border-[#DC2626] bg-[#FEF2F2]" : "border-[#E7EBF2] bg-[#F7F9FC] focus:border-[#3C80F5]"
                                    )} />
                                {nameErr && <p className="text-[11px] text-[#DC2626] mt-1 font-medium">{nameErr}</p>}
                            </div>

                            {/* Client dropdown */}
                            <div className="relative" ref={clientRef}>
                                <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">
                                    Client <span className="text-[#DC2626]">*</span>
                                </label>
                                <button type="button" onClick={() => setClientOpen(o => !o)}
                                    className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-left flex items-center justify-between outline-none focus:border-[#3C80F5]">
                                    <span className={clientName ? "text-[#1B2330]" : "text-[#94A3B5]"}>{clientName || "Client name"}</span>
                                    <ChevronDown size={14} className={cn("text-[#94A3B5] transition-transform", clientOpen && "rotate-180")} />
                                </button>
                                {clientOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E7EBF2] rounded-xl shadow-lg z-30 overflow-hidden">
                                        <div className="p-2 border-b border-[#EEF1F6]">
                                            <div className="relative">
                                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B5]" />
                                                <input value={clientQ} onChange={e => setClientQ(e.target.value)}
                                                    placeholder="Search clients..." autoFocus
                                                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-[#E7EBF2] bg-[#F7F9FC] text-[12.5px] text-[#1B2330] outline-none" />
                                            </div>
                                        </div>
                                        <div className="max-h-[200px] overflow-y-auto">
                                            {filteredClients.length === 0 && (
                                                <p className="px-4 py-3 text-[12.5px] text-[#94A3B5]">No clients found</p>
                                            )}
                                            {filteredClients.map(c => (
                                                <button key={c.id} type="button"
                                                    onClick={() => { setClientId(c.id); setClientName(c.companyName?.trim()); setClientOpen(false); setClientQ(""); }}
                                                    className={cn("w-full text-left px-4 py-2.5 text-[13px] transition-colors",
                                                        c.id === clientId ? "bg-[#EEF3FE] text-[#3C80F5] font-semibold" : "text-[#1B2330] hover:bg-[#F7F9FC]"
                                                    )}>
                                                    {c.companyName?.trim()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                            <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">Description</label>
                            <RichEditor editor={descEditor} />
                        </div>

                        {/* Status + Health */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value)}
                                    className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] outline-none focus:border-[#3C80F5]">
                                    {STATUS_OPTS.map(o => <option key={o} value={o}>{labelOf(o)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">Health</label>
                                <select value={health} onChange={e => setHealth(e.target.value)}
                                    className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] outline-none focus:border-[#3C80F5]">
                                    {HEALTH_OPTS.map(o => <option key={o} value={o}>{labelOf(o)}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Priority + Engagement */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">Priority</label>
                                <select value={priority} onChange={e => setPriority(e.target.value)}
                                    className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] outline-none focus:border-[#3C80F5]">
                                    {PRIORITY_OPTS.map(o => <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">Engagement</label>
                                <select value={engagement} onChange={e => setEngagement(e.target.value)}
                                    className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] outline-none focus:border-[#3C80F5]">
                                    {ENGAGEMENT_OPTS.map(o => <option key={o} value={o}>{o.replace(/_/g, " + ").replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ STEP 2 ══ */}
                {step === 2 && (
                    <div>
                        <h2 className="text-[16px] font-bold text-[#1B2330] mb-1">Step 2 · Client inputs</h2>
                        <p className="text-[13px] text-[#69788C] mb-5">
                            <span className="font-semibold text-[#1B2330]">{selectedService?.name}</span> — questions the client or PM fills in.
                        </p>

                        {page2Fields.length === 0 ? (
                            <p className="text-[13px] text-[#94A3B5] py-6 text-center">
                                No input fields defined for this template.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {page2Fields.map((field, i) => {
                                    const key = labelToKey(field.label);
                                    return (
                                        <div key={i}>
                                            <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">
                                                {field.label}
                                            </label>
                                            <input
                                                value={clientInputs[key] ?? ""}
                                                onChange={e => setClientInputs(p => ({ ...p, [key]: e.target.value }))}
                                                placeholder={field.placeholder ?? ""}
                                                className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none focus:border-[#3C80F5]"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ══ STEP 3 ══ */}
                {step === 3 && (
                    <div>
                        <h2 className="text-[16px] font-bold text-[#1B2330] mb-5">Step 3 · Internal inputs</h2>

                        {/* Required resources — driven by /api/roles */}
                        <div className="mb-5">
                            <label className="block text-[12px] font-semibold text-[#1B2330] mb-3">Required resources</label>
                            {rolesLoading ? (
                                <div className="flex items-center gap-2 py-6 text-[#94A3B5]">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span className="text-[13px]">Loading roles...</span>
                                </div>
                            ) : roles.length === 0 ? (
                                <p className="text-[13px] text-[#94A3B5] py-4 text-center">No roles found.</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {roles.map(role => {
                                        const max = role.members ?? 0;
                                        const count = resources[role.id] ?? 0;
                                        return (
                                            <div key={role.id} className="border border-[#E7EBF2] rounded-xl p-3 bg-[#F7F9FC]">
                                                <p className="text-[11.5px] font-semibold text-[#69788C] mb-0.5 text-center leading-tight">{role.name}</p>
                                                <p className="text-[10px] text-[#94A3B5] text-center mb-2">{max} available</p>
                                                <div className="flex items-center gap-2 justify-center">
                                                    <button type="button" onClick={() => updateResource(role.id, -1)} disabled={count <= 0}
                                                        className="w-7 h-7 rounded-lg border border-[#E7EBF2] bg-white flex items-center justify-center text-[#69788C] hover:bg-[#EEF3FE] hover:text-[#3C80F5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="text-[15px] font-bold text-[#1B2330] w-5 text-center">{count}</span>
                                                    <button type="button" onClick={() => updateResource(role.id, 1)} disabled={count >= max}
                                                        className="w-7 h-7 rounded-lg border border-[#E7EBF2] bg-white flex items-center justify-center text-[#69788C] hover:bg-[#EEF3FE] hover:text-[#3C80F5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Estimated hours */}
                        <div className="mb-5">
                            <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">Estimated total effort (hours)</label>
                            <input type="number" value={estHours} onChange={e => setEstHours(Number(e.target.value))} min={1}
                                className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] outline-none focus:border-[#3C80F5]" />
                        </div>

                        {/* Project members */}
                        <div className="mb-5">
                            <label className="block text-[12px] font-semibold text-[#1B2330] mb-3">Select project members</label>
                            <div className="flex flex-wrap gap-2">
                                {employees.map(emp => {
                                    const n        = emp.legalName ?? "Employee";
                                    const initials = n.split(" ").map(c => c[0]).join("").slice(0, 2).toUpperCase();
                                    const selected = memberIds.includes(emp.id);
                                    const colors   = ["bg-[#3C80F5]","bg-[#763CF6]","bg-[#16A34A]","bg-[#E08600]","bg-[#DC2626]"];
                                    const color    = colors[(n.charCodeAt(0) ?? 0) % colors.length];
                                    return (
                                        <button key={emp.id} type="button" onClick={() => toggleMember(emp)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-xl border text-[12.5px] font-semibold transition-all",
                                                selected ? "border-[#3C80F5] bg-[#EEF3FE] text-[#3C80F5]" : "border-[#E7EBF2] bg-[#F7F9FC] text-[#69788C] hover:border-[#3C80F5]"
                                            )}>
                                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0", color)}>
                                                {initials}
                                            </div>
                                            <span>{n.split(" ")[0]}</span>
                                            <span className="text-[11px] text-[#94A3B5]">· {emp.designation ?? emp.user?.role ?? "Member"}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Lead + Tech stack */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="relative" ref={leadRef}>
                                <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">Project lead</label>
                                <button type="button" onClick={() => setLeadOpen(o => !o)}
                                    className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-left flex items-center justify-between outline-none focus:border-[#3C80F5]">
                                    <span className={leadName ? "text-[#1B2330]" : "text-[#94A3B5]"}>{leadName || "Select lead"}</span>
                                    <ChevronDown size={14} className={cn("text-[#94A3B5] transition-transform", leadOpen && "rotate-180")} />
                                </button>
                                {leadOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E7EBF2] rounded-xl shadow-lg z-30 overflow-hidden">
                                        <div className="p-2 border-b border-[#EEF1F6]">
                                            <input value={leadQ} onChange={e => setLeadQ(e.target.value)} placeholder="Search..." autoFocus
                                                className="w-full h-8 px-3 rounded-lg border border-[#E7EBF2] bg-[#F7F9FC] text-[12.5px] text-[#1B2330] outline-none" />
                                        </div>
                                        <div className="max-h-[180px] overflow-y-auto">
                                            {filteredEmployees.map(emp => (
                                                <button key={emp.id} type="button"
                                                    onClick={() => { setLeadId(emp.id); setLeadName(emp.legalName ?? "Employee"); setLeadOpen(false); setLeadQ(""); }}
                                                    className={cn("w-full text-left px-4 py-2.5 text-[13px] transition-colors",
                                                        emp.id === leadId ? "bg-[#EEF3FE] text-[#3C80F5] font-semibold" : "text-[#1B2330] hover:bg-[#F7F9FC]"
                                                    )}>
                                                    {emp.legalName} <span className="text-[#94A3B5] text-[11.5px]">· {emp.designation}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">Tech stack</label>
                                <input value={techStack} onChange={e => setTechStack(e.target.value)}
                                    placeholder="e.g. Next.js + Node + Postgres"
                                    className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none focus:border-[#3C80F5]" />
                                <p className="text-[11px] text-[#94A3B5] mt-1">Comma-separated</p>
                            </div>
                        </div>

                        {/* Custom instructions */}
                        <div className="mb-5">
                            <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">Custom instructions</label>
                            <RichEditor editor={instrEditor} />
                        </div>
                    </div>
                )}

                {/* ══ STEP 4 ══ */}
                {step === 4 && (
                    <div>
                        <h2 className="text-[16px] font-bold text-[#1B2330] mb-1">Step 4 · Project runway</h2>
                        <p className="text-[13px] text-[#69788C] mb-5">Milestones for this project.</p>

                        {milestones.length === 0 && (
                            <p className="text-[13px] text-[#94A3B5] py-4 text-center">No milestones yet — add one below.</p>
                        )}

                        <div className="space-y-3">
                            {milestones.map((m, i) => {
                                const typeStyle = MILESTONE_TYPE_COLORS[m.type] ?? MILESTONE_TYPE_COLORS.MILESTONE;
                                return (
                                    <div key={m.id ?? i} className="flex items-start gap-4">
                                        <div className="flex flex-col items-center pt-4">
                                            <div className={cn(
                                                "w-3 h-3 rounded-full border-2 shrink-0",
                                                typeStyle.filled
                                                    ? `${typeStyle.dot.replace("border-", "bg-")} ${typeStyle.dot}`
                                                    : `bg-white ${typeStyle.dot}`
                                            )} />
                                            {i < milestones.length - 1 && <div className="w-[2px] h-8 bg-[#EEF1F6] mt-1" />}
                                        </div>
                                        <div className="flex-1 bg-white border border-[#E7EBF2] rounded-xl px-4 py-3 group">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <select value={m.type} onChange={e => updateMilestone(i, "type", e.target.value)}
                                                    className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border-0 outline-none cursor-pointer shrink-0", typeStyle.bg, typeStyle.text)}>
                                                    <option value="INTERNAL_MEETING">INTERNAL MEETING</option>
                                                    <option value="CLIENT_MEETING">CLIENT MEETING</option>
                                                    <option value="MILESTONE">MILESTONE</option>
                                                </select>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <label className="flex items-center gap-1 text-[12.5px] font-semibold text-[#69788C] border border-[#E7EBF2] rounded-lg px-2 py-1 cursor-pointer hover:border-[#3C80F5] transition-colors">
                                                        <Calendar size={12} className="text-[#94A3B5]" />
                                                        <input type="date" value={fmtDateInput(m.dueDate)}
                                                            onChange={e => updateMilestone(i, "dueDate", new Date(e.target.value).toISOString())}
                                                            className="border-0 outline-none bg-transparent cursor-pointer w-[110px]" />
                                                    </label>
                                                    <button type="button" onClick={() => removeMilestone(i)}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94A3B5] opacity-0 group-hover:opacity-100 hover:bg-[#FCEDED] hover:text-[#DC2626] transition-all">
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                            <input value={m.title} onChange={e => updateMilestone(i, "title", e.target.value)}
                                                className="w-full text-[14px] font-bold text-[#1B2330] border-0 outline-none bg-transparent placeholder:text-[#94A3B5]"
                                                placeholder="Milestone title" />
                                            <input value={m.description} onChange={e => updateMilestone(i, "description", e.target.value)}
                                                className="w-full text-[12.5px] text-[#69788C] border-0 outline-none bg-transparent mt-0.5 placeholder:text-[#94A3B5]"
                                                placeholder="Description (optional)" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button type="button" onClick={addMilestone}
                            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-[#3C80F5] text-[12.5px] font-semibold text-[#3C80F5] hover:bg-[#EEF3FE] transition-colors">
                            <Plus size={13} /> Add milestone
                        </button>
                    </div>
                )}
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between mt-5">
                <button type="button"
                    onClick={step === 1 ? () => router.push(`/promonkey/projects/${id}`) : () => setStep(s => s - 1)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E7EBF2] text-[13px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors">
                    <ArrowLeft size={14} /> Back
                </button>

                {step < 4 ? (
                    <button type="button" onClick={goNext}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity">
                        Continue →
                    </button>
                ) : (
                    <button type="button" onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-60">
                        {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : "Save changes"}
                    </button>
                )}
            </div>
        </div>
    );
}