
"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const COLORS = [
    "from-[#3C80F5] to-[#763CF6]", "from-[#E05A00] to-[#E08600]",
    "from-[#16A34A] to-[#3C80F5]", "from-[#DC2626] to-[#E08600]",
    "from-[#763CF6] to-[#3C80F5]", "from-[#0891B2] to-[#3C80F5]",
];

const AI_UPSELL = [
    { emoji: "🔧", title: "Add a Care Plan retainer", desc: "They have a live build but no maintenance contract — recurring revenue + uptime ownership." },
    { emoji: "⚙️", title: "Operated data layer + automation", desc: "Consolidate their data sources and run n8n automations on top — the defensible moat play." },
    { emoji: "🤖", title: "AI layer on existing data", desc: "Their data is already centralised — add AI update drafts or a support agent as the thin visible layer." },
    { emoji: "📦", title: "Consolidate into a master MSA", desc: "Multiple active projects — a single retainer + roadmap simplifies billing and locks in the relationship." },
];

function InfoRow({ label, value }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-[#EEF1F6] last:border-0">
            <span className="text-[12px] font-semibold text-[#94A3B5] w-36 shrink-0 mt-0.5">{label}</span>
            <span className="text-[13px] text-[#1B2330] flex-1">{value}</span>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
            <p className="text-[10px] tracking-[1.4px] font-bold text-[#94A3B5] mb-3">{title}</p>
            {children}
        </div>
    );
}

function StatItem({ label, value }) {
    return (
        <div>
            <p className="text-[10px] tracking-[1.4px] font-bold text-[#94A3B5] mb-1">{label.toUpperCase()}</p>
            <p className="text-[22px] font-black text-[#1B2330]">{value}</p>
        </div>
    );
}

const STATUS_STYLES = {
    "AT RISK": "bg-[#DC2626] text-white",
    "HIGH":    "bg-[#DC2626] text-white",
    "MED":     "bg-[#E08600] text-white",
    "LOW":     "bg-[#16A34A] text-white",
};

function ProjectCard({ project }) {
    return (
        <div className="bg-white border border-[#E7EBF2] rounded-2xl p-4 shadow-[0_1px_2px_rgba(27,35,48,.06)] relative">
            {project.risk && (
                <div className="absolute top-3 right-3 flex gap-1">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", STATUS_STYLES[project.risk] ?? "bg-[#EEF1F6] text-[#69788C]")}>
                        {project.risk}
                    </span>
                    {project.priority && (
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", STATUS_STYLES[project.priority] ?? "bg-[#EEF1F6] text-[#69788C]")}>
                            {project.priority}
                        </span>
                    )}
                </div>
            )}
            <p className="text-[11px] font-semibold text-[#94A3B5] mb-1">{project.code}</p>
            <p className="text-[14px] font-bold text-[#1B2330] mb-2 pr-20">{project.name}</p>
            {project.tag && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EEF1F6] text-[11px] font-semibold text-[#69788C] mb-3">
                    {project.tag}
                </span>
            )}
            <div className="w-full h-1.5 bg-[#EEF1F6] rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full bg-gradient-to-r from-[#3C80F5] to-[#763CF6]"
                    style={{ width: `${project.progress ?? 0}%` }} />
            </div>
            <div className="flex items-center justify-between text-[12px] text-[#69788C]">
                <span>{project.progress}% · {project.hours} hrs</span>
                <span className="font-semibold text-[#16A34A]">{project.status}</span>
            </div>
        </div>
    );
}

export default function ClientDetailPage({ params }) {
    const router = useRouter();
    const resolvedParams = typeof params?.then === "function" ? use(params) : params;
    const id = resolvedParams?.id;

    const [client,  setClient]  = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState("");

    useEffect(() => {
        if (!id) return;
        async function load() {
            setLoading(true); setError("");
            try {
                const json = await apiFetch(`/api/clients/${id}`);
                setClient(json.data ?? json);
            } catch (e) { setError(e.message); }
            finally { setLoading(false); }
        }
        load();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center py-32 gap-3 text-[#94A3B5]">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[13px]">Loading client...</span>
        </div>
    );

    if (error) return (
        <div className="max-w-[1100px] mx-auto pt-6">
            <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[13px] font-medium">{error}</p>
                <button onClick={() => router.push("/promonkey/clients")} className="ml-auto text-[12.5px] font-bold underline">
                    Back to Clients
                </button>
            </div>
        </div>
    );

    if (!client) return null;

    const c         = client;
    const name      = c.companyName ?? "Client";
    const initials  = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const color     = COLORS[(name?.charCodeAt(0) ?? 0) % COLORS.length];
    const sinceYear = c.clientSince
        ? new Date(c.clientSince).getFullYear()
        : c.createdAt ? new Date(c.createdAt).getFullYear() : null;

    /* Mock projects based on screenshot */
    const mockProjects = [
        { code: "PRJ-014", name: `${name} — Portal v2`,       risk: "AT RISK", priority: "HIGH", tag: "🖥 Web App",        progress: 62, hours: 301, status: "Active" },
        { code: "PRJ-021", name: `${name} — Growth Retainer`, risk: null,      priority: "MED",  tag: "📈 Digital Marketing", progress: 33, hours: 40,  status: "Active" },
    ];

    return (
        <div className="max-w-[1100px] mx-auto">

            {/* Back */}
            <button onClick={() => router.push("/promonkey/clients")}
                className="flex items-center gap-2 text-[13px] font-semibold text-[#69788C] hover:text-[#1B2330] mb-5 transition-colors">
                <ArrowLeft size={14} /> Back to clients
            </button>

            {/* Profile header */}
            <div className="bg-white border border-[#E7EBF2] rounded-2xl p-6 shadow-[0_1px_2px_rgba(27,35,48,.06),0_4px_16px_rgba(27,35,48,.06)] mb-4">
                <div className="flex items-start gap-4">
                    {c.logoUrl ? (
                        <div className="w-14 h-14 rounded-xl border border-[#E7EBF2] bg-white flex items-center justify-center overflow-hidden shrink-0">
                            <img src={c.logoUrl} alt={name} className="w-full h-full object-contain p-1"
                                onError={e => e.currentTarget.style.display = "none"} />
                        </div>
                    ) : (
                        <div className={cn("w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-[18px] font-bold shrink-0", color)}>
                            {initials}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] text-[#94A3B5] font-semibold mb-0.5">
                            CLIENT{sinceYear ? ` · since ${sinceYear}` : ""}
                        </p>
                        <h1 className="text-[22px] font-black text-[#1B2330] tracking-[-0.3px]">{name}</h1>
                        <p className="text-[13.5px] text-[#69788C] mt-0.5">
                            {[c.country, c.contactName ? `primary contact ${c.contactName}` : null].filter(Boolean).join(" · ")}
                        </p>
                    </div>
                    {c.status && (
                        <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[11.5px] font-semibold shrink-0", {
                            ACTIVE:   "bg-[#EAF7EE] text-[#16A34A]",
                            PROSPECT: "bg-[#EEF3FE] text-[#3C80F5]",
                            INACTIVE: "bg-[#EEF1F6] text-[#69788C]",
                            CHURNED:  "bg-[#FCEDED] text-[#DC2626]",
                        }[c.status] ?? "bg-[#EEF3FE] text-[#3C80F5]")}>
                            {c.status}
                        </span>
                    )}
                </div>
            </div>

            {/* Stats row */}
            <div className="bg-white border border-[#E7EBF2] rounded-2xl px-6 py-5 shadow-[0_1px_2px_rgba(27,35,48,.06)] mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
                    <StatItem label="Total Projects"  value="2" />
                    <StatItem label="Ongoing"         value="2" />
                    <StatItem label="Completed"       value="0" />
                    <StatItem label="Hours Billed"    value="341 hrs" />
                    <StatItem label="Hours Estimated" value="540 hrs" />
                </div>
            </div>

            {/* AI Upsell */}
            <div className="bg-[#F3EFFE] border border-[#DDD5FC] rounded-2xl px-5 py-4 mb-4">
                <p className="text-[13.5px] font-bold text-[#763CF6] mb-3">✨ AI-suggested upsell opportunities</p>
                <div className="space-y-3">
                    {AI_UPSELL.map((item, i) => (
                        <div key={i} className={cn("flex items-start gap-3 pb-3", i < AI_UPSELL.length - 1 && "border-b border-[#E8DFFC]")}>
                            <span className="text-base shrink-0 mt-0.5">{item.emoji}</span>
                            <div>
                                <p className="text-[13px] font-bold text-[#1B2330]">{item.title}</p>
                                <p className="text-[12px] text-[#69788C]">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Projects */}
            <div className="mb-4">
                <p className="text-[10px] tracking-[1.4px] font-bold text-[#94A3B5] mb-3">PROJECTS (DONE & ONGOING)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockProjects.map(p => <ProjectCard key={p.code} project={p} />)}
                </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                <Section title="COMPANY DETAILS">
                    <InfoRow label="Company Name"  value={c.companyName} />
                    <InfoRow label="Brand Name"    value={c.brandName} />
                    <InfoRow label="Website"       value={c.website} />
                    <InfoRow label="Industry"      value={c.industry} />
                    <InfoRow label="Country"       value={c.country} />
                    <InfoRow label="Timezone"      value={c.timezone} />
                    <InfoRow label="Description"   value={c.description} />
                    <InfoRow label="Source"        value={c.source} />
                    <InfoRow label="Engagement"    value={c.engagementType} />
                </Section>

                <Section title="CONTACT DETAILS">
                    <InfoRow label="Primary Contact" value={c.contactName} />
                    <InfoRow label="Email"            value={c.contactEmail} />
                    <InfoRow label="Phone"            value={c.contactPhone} />
                    <InfoRow label="Login Email"      value={c.user?.email} />
                    <InfoRow label="Reg. Address"     value={c.registeredAddress} />
                    <InfoRow label="Op. Address"      value={c.operatingAddress} />
                </Section>

                {/* Additional Contacts */}
                {c.additionalContacts?.length > 0 && (
                    <Section title="ADDITIONAL CONTACTS">
                        {c.additionalContacts.map((contact, i) => (
                            <div key={i} className={cn("py-3", i < c.additionalContacts.length - 1 && "border-b border-[#EEF1F6]")}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-[13px] font-bold text-[#1B2330]">{contact.name}</p>
                                        <p className="text-[12px] text-[#69788C]">{contact.role}</p>
                                    </div>
                                    {contact.tag && (
                                        <span className="inline-flex px-2 py-0.5 rounded-full bg-[#EEF3FE] text-[11px] font-semibold text-[#3C80F5]">
                                            {contact.tag}
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1 space-y-0.5">
                                    {contact.email && <p className="text-[12px] text-[#69788C]">{contact.email}</p>}
                                    {contact.phone && <p className="text-[12px] text-[#69788C]">{contact.phone}</p>}
                                </div>
                            </div>
                        ))}
                    </Section>
                )}

                <Section title="BILLING & LEGAL">
                    <InfoRow label="Billing Email"    value={c.billingEmail} />
                    <InfoRow label="Currency"         value={c.billingCurrency} />
                    <InfoRow label="Payment Terms"    value={c.paymentTerms} />
                    <InfoRow label="Tax ID"           value={c.taxId} />
                </Section>

                {/* Documents */}
                <Section title="DOCUMENTS">
                    {[
                        { label: "MSA",          url: c.msaUrl },
                        { label: "NDA",          url: c.ndaUrl },
                        { label: "Tax Cert",     url: c.taxCertUrl },
                        { label: "Brand Assets", url: c.brandAssetsUrl },
                    ].filter(d => d.url).length === 0 ? (
                        <p className="text-[12.5px] text-[#94A3B5]">No documents uploaded.</p>
                    ) : (
                        [
                            { label: "MSA",          url: c.msaUrl },
                            { label: "NDA",          url: c.ndaUrl },
                            { label: "Tax Cert",     url: c.taxCertUrl },
                            { label: "Brand Assets", url: c.brandAssetsUrl },
                        ].filter(d => d.url).map(doc => (
                            <div key={doc.label} className="flex items-center justify-between py-2.5 border-b border-[#EEF1F6] last:border-0">
                                <span className="text-[12px] font-semibold text-[#94A3B5] w-36 shrink-0">{doc.label}</span>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#3C80F5] hover:underline">
                                    <ExternalLink size={12} /> View →
                                </a>
                            </div>
                        ))
                    )}
                </Section>
            </div>
        </div>
    );
}
