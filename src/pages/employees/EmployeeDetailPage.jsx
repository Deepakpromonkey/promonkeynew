"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Loader2, AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

const TABS = ["Overview", "Profile", "Projects", "Tasks", "Tickets", "Attendance", "Remarks", "Skills"];

function initials(name = "") {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function driveImageUrl(url, size = 200) {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const id = match?.[1];
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${size}` : url;
}

function Avatar({ url, name, sizeClass = "w-14 h-14" }) {
    const [errored, setErrored] = useState(false);
    const resolvedUrl = driveImageUrl(url);

    if (resolvedUrl && !errored) {
        return (
            <img
                src={resolvedUrl}
                alt={name}
                className={cn(sizeClass, "rounded-full object-cover shrink-0 border-2 border-[#EEF3FE]")}
                onError={() => setErrored(true)}
            />
        );
    }

    return (
        <div className={cn(
            sizeClass,
            "rounded-full bg-gradient-to-br from-[#3C80F5] to-[#763CF6] flex items-center justify-center text-white text-[18px] font-bold shrink-0"
        )}>
            {initials(name)}
        </div>
    );
}

function StatCard({ value, label }) {
    return (
        <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
            <p className="text-[26px] font-black text-[#1B2330] tracking-tight">{value}</p>
            <p className="text-[12.5px] text-[#69788C] mt-0.5">{label}</p>
        </div>
    );
}

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

function DocLink({ label, url }) {
    if (!url) return null;
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-[#EEF1F6] last:border-0">
            <span className="text-[12px] font-semibold text-[#94A3B5] w-36 shrink-0">{label}</span>
            <a href={url} target="_blank" rel="noopener noreferrer"
                className="text-[12.5px] font-semibold text-[#3C80F5] hover:underline">
                View →
            </a>
        </div>
    );
}

export default function EmployeeDetailPage({ params }) {
    const router = useRouter();

    const resolvedParams = typeof params?.then === "function" ? use(params) : params;
    const id = resolvedParams?.id;

    const [employee, setEmployee] = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState("");
    const [tab,      setTab]      = useState("Overview");

    useEffect(() => {
        if (!id) return;
        async function load() {
            setLoading(true);
            setError("");
            try {
                const json = await apiFetch(`/api/employees/${id}`);

                setEmployee(json.data ?? json);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center py-32 gap-3 text-[#94A3B5]">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[13px]">Loading employee...</span>
        </div>
    );

    if (error) return (
        <div className="max-w-[1100px] mx-auto pt-6">
            <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[13px] font-medium">{error}</p>
                <button onClick={() => router.push("/promonkey/employees")} className="ml-auto text-[12.5px] font-bold underline">
                    Back to Employees
                </button>
            </div>
        </div>
    );

    if (!employee) return null;

    const e           = employee;
    const name        = e.legalName ?? "Employee";
    const email       = e.user?.email ?? "";
    const isActive    = e.user?.isActive;
    const role        = e.user?.role ?? "EMPLOYEE";
    const joinDate    = e.dateOfJoining
        ? new Date(e.dateOfJoining).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : "—";

    const fmtDate = (d) => d
        ? new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
        : null;

    return (
        <div className="max-w-[1100px] mx-auto">

            {/* Back */}
            <button
                onClick={() => router.push("/promonkey/employees")}
                className="flex items-center gap-2 text-[13px] font-semibold text-[#69788C] hover:text-[#1B2330] mb-5 transition-colors"
            >
                <ArrowLeft size={14} /> Back to employees
            </button>

            {/* Profile header */}
            <div className="bg-white border border-[#E7EBF2] rounded-2xl p-6 shadow-[0_1px_2px_rgba(27,35,48,.06),0_4px_16px_rgba(27,35,48,.06)] mb-4 relative overflow-hidden">
                <div className="flex items-start gap-4">
                    <Avatar url={e.profilePhotoUrl} name={name} />

                    <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] text-[#94A3B5] font-semibold mb-0.5">
                            {role} · joined {joinDate}
                        </p>
                        <h1 className="text-[22px] font-black text-[#1B2330] tracking-[-0.3px]">{name}</h1>
                        <p className="text-[13.5px] text-[#69788C] mt-0.5">{e.designation} · {email}</p>
                    </div>

                    {/* Status + dept top right */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={cn(
                            "inline-flex px-2.5 py-1 rounded-full text-[11.5px] font-semibold",
                            isActive ? "bg-[#EAF7EE] text-[#16A34A]" : "bg-[#EEF1F6] text-[#69788C]"
                        )}>
                            {isActive ? "Active" : "Inactive"}
                        </span>
                        {e.department && (
                            <span className="text-[11px] font-black tracking-[1.5px] text-[#3C80F5]">
                                {e.department.toUpperCase()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-5 border-b border-[#E7EBF2] -mx-6 px-6 overflow-x-auto">
                    {TABS.map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={cn(
                                "px-4 py-2.5 text-[13px] font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap shrink-0",
                                t === tab
                                    ? "text-[#3C80F5] border-[#3C80F5]"
                                    : "text-[#69788C] border-transparent hover:text-[#1B2330]"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Overview tab ── */}
            {tab === "Overview" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <StatCard value="3"   label="Projects" />
                        <StatCard value="2/7" label="Tasks done" />
                        <StatCard value="92%" label="On-time delivery" />
                        <StatCard value="6"   label="Tickets resolved" />
                        <StatCard value="5.0" label="Avg rating ⭐" />
                        <StatCard value="8"   label="Leaves left" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Section title="WORKLOAD SNAPSHOT">
                            {[
                                { label: "Active tasks",       value: 5 },
                                { label: "Blocked",            value: 0 },
                                { label: "Open tickets",       value: 0 },
                                { label: "Currently learning", value: 1 },
                            ].map(row => (
                                <div key={row.label} className="flex items-center justify-between py-3 border-b border-[#EEF1F6] last:border-0">
                                    <span className="text-[13px] text-[#1B2330]">{row.label}</span>
                                    <span className="text-[13px] font-bold text-[#1B2330]">{row.value}</span>
                                </div>
                            ))}
                        </Section>

                        <Section title="TOP SKILLS">
                            {[
                                { skill: "System Architecture", score: 9 },
                                { skill: "Node.js",             score: 8 },
                                { skill: "AWS",                 score: 8 },
                            ].map(s => (
                                <div key={s.skill} className="flex items-center gap-3 py-3 border-b border-[#EEF1F6] last:border-0">
                                    <span className="text-[13px] text-[#1B2330] w-44 shrink-0">{s.skill}</span>
                                    <div className="flex-1 h-2 bg-[#EEF1F6] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#3C80F5] to-[#763CF6]"
                                            style={{ width: `${s.score * 10}%` }}
                                        />
                                    </div>
                                    <span className="text-[12.5px] font-bold text-[#3C80F5] w-10 text-right">{s.score}/10</span>
                                </div>
                            ))}
                        </Section>
                    </div>
                </div>
            )}

            {/* ── Profile tab ── */}
            {tab === "Profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    <Section title="PERSONAL DETAILS">
                        <InfoRow label="Legal Name"     value={e.legalName} />
                        <InfoRow label="Preferred Name" value={e.preferredName} />
                        <InfoRow label="Date of Birth"  value={fmtDate(e.dob)} />
                        <InfoRow label="Gender"         value={e.gender} />
                        <InfoRow label="Mobile"         value={e.personalMobile} />
                        <InfoRow label="Email"          value={email} />
                        <InfoRow label="Blood Group"    value={e.bloodGroup} />
                    </Section>

                    <Section title="EMPLOYMENT DETAILS">
                        <InfoRow label="Designation"     value={e.designation} />
                        <InfoRow label="Department"      value={e.department} />
                        <InfoRow label="Reporting To"    value={e.reportingManager} />
                        <InfoRow label="Employment Type" value={e.employmentType?.replace(/_/g, " ")} />
                        <InfoRow label="Work Mode"       value={e.workMode} />
                        <InfoRow label="Base Location"   value={e.baseLocation} />
                        <InfoRow label="Date of Joining" value={fmtDate(e.dateOfJoining)} />
                        <InfoRow label="Probation"       value={e.probationDays ? `${e.probationDays} days` : null} />
                        <InfoRow label="Total Exp"       value={e.totalExperience ? `${e.totalExperience} yrs` : null} />
                        <InfoRow label="Relevant Exp"    value={e.relevantExp ? `${e.relevantExp} yrs` : null} />
                    </Section>

                    <Section title="EMERGENCY CONTACT">
                        <InfoRow label="Name"     value={e.emergencyName} />
                        <InfoRow label="Relation" value={e.emergencyRelation} />
                        <InfoRow label="Phone"    value={e.emergencyPhone} />
                    </Section>

                    <Section title="ADDRESS">
                        <InfoRow label="Current"   value={e.currentAddress} />
                        <InfoRow label="Permanent" value={e.permanentAddress} />
                    </Section>

                    <Section title="BANK DETAILS">
                        <InfoRow label="Account Name" value={e.accountName} />
                        <InfoRow label="Bank"         value={e.bankName} />
                        <InfoRow label="Account No"   value={e.accountNumber} />
                        <InfoRow label="IFSC"         value={e.ifscCode} />
                        <InfoRow label="Branch"       value={e.branchName} />
                    </Section>

                    <Section title="KYC DOCUMENTS">
                        <InfoRow label="Aadhaar No" value={e.aadhaarNumber} />
                        <InfoRow label="PAN No"     value={e.panNumber} />
                        <DocLink label="Aadhaar Front" url={e.aadhaarFrontUrl} />
                        <DocLink label="Aadhaar Back"  url={e.aadhaarBackUrl} />
                        <DocLink label="PAN Photo"     url={e.panPhotoUrl} />
                        <DocLink label="Address Proof" url={e.addressProofUrl} />
                        <DocLink label="Bank Doc"      url={e.bankDocumentUrl} />
                    </Section>
                </div>
            )}

            {/* ── Other tabs: placeholder ── */}
            {!["Overview", "Profile"].includes(tab) && (
                <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-16 text-center text-[#94A3B5] shadow-[0_1px_2px_rgba(27,35,48,.06)]">
                    <p className="text-[14px] font-semibold">{tab}</p>
                    <p className="text-[12.5px] mt-1">This section will be available once the API is connected.</p>
                </div>
            )}
        </div>
    );
}