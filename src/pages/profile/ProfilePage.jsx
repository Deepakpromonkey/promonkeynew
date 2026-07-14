"use client";
import { useState, useEffect } from "react";
import {
    User, Mail, Phone, MapPin, Briefcase, Building2,
    Calendar, CreditCard, FileText, Shield, Key,
    Loader2, Eye, EyeOff, CheckCircle2, ExternalLink,
    Globe, Clock, Star, AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

/* ── helpers ── */
function fmt(d) {
    if (!d) return "—";
    try { return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return "—"; }
}

function val(v) { return v && v !== "N/A" ? v : null; }

function InfoRow({ label, value, link }) {
    if (!val(value)) return null;
    return (
        <div className="flex items-start gap-3 py-2.5 border-b border-[#EEF1F6] last:border-0">
            <span className="text-[11.5px] font-semibold text-[#94A3B5] w-36 shrink-0 pt-0.5">{label}</span>
            {link ? (
                <a href={value} target="_blank" rel="noopener noreferrer"
                    className="text-[13px] text-[#3C80F5] font-medium hover:underline flex items-center gap-1">
                    View Document <ExternalLink size={11} />
                </a>
            ) : (
                <span className="text-[13px] text-[#1B2330] flex-1 break-all">{value}</span>
            )}
        </div>
    );
}

function Section({ title, icon: Icon, children }) {
    return (
        <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#EEF1F6]">
                <div className="w-7 h-7 rounded-lg bg-[#EEF3FE] flex items-center justify-center">
                    <Icon size={14} className="text-[#3C80F5]" />
                </div>
                <p className="text-[12px] font-bold text-[#1B2330] tracking-wide">{title}</p>
            </div>
            {children}
        </div>
    );
}

/* ── Change Password Modal ── */
function ChangePasswordModal({ onClose }) {
    const [form,    setForm]    = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [show,    setShow]    = useState({ current: false, new: false, confirm: false });
    const [loading, setLoading] = useState(false);
    const [errors,  setErrors]  = useState({});

    function validate() {
        const e = {};
        if (!form.currentPassword)          e.currentPassword = "Required";
        if (!form.newPassword)              e.newPassword = "Required";
        else if (form.newPassword.length < 6) e.newPassword = "Min 6 characters";
        if (!form.confirmPassword)          e.confirmPassword = "Required";
        else if (form.newPassword !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
        return e;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setLoading(true);
        try {
            await apiFetch("/api/auth/change-password", {
                method: "PATCH",
                body:   JSON.stringify({
                    currentPassword: form.currentPassword,
                    newPassword:     form.newPassword,
                    confirmPassword: form.confirmPassword,
                }),
            });
            toast.success({ title: "Password updated", message: "Your password has been changed successfully." });
            onClose();
        } catch (err) {
            toast.error({ title: "Failed to update password", message: err.message });
        } finally { setLoading(false); }
    }

    function inp(key, placeholder, showKey) {
        return (
            <div className="mb-4">
                <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">
                    {placeholder} {errors[key] && <span className="text-[#DC2626] font-medium">— {errors[key]}</span>}
                </label>
                <div className="relative">
                    <input
                        type={show[showKey] ? "text" : "password"}
                        value={form[key]}
                        onChange={e => { setForm(p => ({ ...p, [key]: e.target.value })); setErrors(p => ({ ...p, [key]: "" })); }}
                        placeholder="••••••••"
                        className={cn(
                            "w-full h-10 px-3.5 pr-10 rounded-xl border text-[13px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none transition-colors",
                            errors[key]
                                ? "border-[#DC2626] bg-[#FEF2F2]"
                                : "border-[#E7EBF2] bg-[#F7F9FC] focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15"
                        )}
                    />
                    <button type="button" onClick={() => setShow(p => ({ ...p, [showKey]: !p[showKey] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B5] hover:text-[#1B2330]">
                        {show[showKey] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 z-10">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#E7EBF2]">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#EEF3FE] flex items-center justify-center">
                            <Key size={15} className="text-[#3C80F5]" />
                        </div>
                        <h2 className="text-[15px] font-bold text-[#1B2330]">Change Password</h2>
                    </div>
                    <button onClick={onClose} className="text-[#94A3B5] hover:text-[#1B2330] transition-colors text-lg leading-none">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5">
                    {inp("currentPassword", "Current Password", "current")}
                    {inp("newPassword",     "New Password",     "new")}
                    {inp("confirmPassword", "Confirm Password", "confirm")}
                    <div className="flex items-center gap-3 mt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-[#69788C] border border-[#E7EBF2] hover:bg-[#F7F9FC] transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-60">
                            {loading && <Loader2 size={13} className="animate-spin" />}
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Avatar ── */
function ProfileAvatar({ name, photoUrl, size = 20 }) {
    const initials = (name ?? "?").split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase();
    if (val(photoUrl)) {
        return (
            <img src={photoUrl} alt={name}
                className={`w-${size} h-${size} rounded-full object-cover border-4 border-white shadow-lg`}
                style={{ width: size * 4, height: size * 4 }}
                onError={e => e.currentTarget.style.display = "none"}
            />
        );
    }
    return (
        <div 
            className="rounded-full bg-gradient-to-br from-[#3C80F5] to-[#763CF6] flex items-center justify-center text-white font-black border-4 border-white shadow-lg"
            style={{ width: size * 4, height: size * 4, fontSize: size * 1.5 }}
        >
            {initials}
        </div>
    );
}

/* ════════════════════════════
   Employee / Admin Profile
   ════════════════════════════ */
function EmployeeProfile({ data, showPwd, setShowPwd }) {
    const e      = data;
    const email  = e.user?.email ?? "—";
    const role   = e.user?.role  ?? "EMPLOYEE";
    const joined = fmt(e.dateOfJoining);

    const statusColor = {
        FULL_TIME: "bg-[#EAF7EE] text-[#16A34A]",
        PART_TIME: "bg-[#EEF3FE] text-[#3C80F5]",
        CONTRACT:  "bg-[#FDF3E2] text-[#E08600]",
        INTERN:    "bg-[#EEF1F6] text-[#69788C]",
    }[e.employmentType] ?? "bg-[#EEF1F6] text-[#69788C]";

    return (
        <div className="max-w-[1100px] mx-auto">
            {/* Hero card */}
            <div className="bg-white border border-[#E7EBF2] rounded-2xl shadow-[0_1px_2px_rgba(27,35,48,.06),0_4px_16px_rgba(27,35,48,.06)] overflow-hidden mb-5">
                {/* Banner */}
                <div className="h-28 " />
                <div className="px-6 pb-5 -mt-12">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex items-end gap-4">
                            <div style={{ width: 80, height: 80 }}
                                className="rounded-full bg-gradient-to-br from-[#3C80F5] to-[#763CF6] flex items-center justify-center text-white font-black text-[26px] border-4 border-white shadow-lg shrink-0 overflow-hidden">
                                {val(e.profilePhotoUrl)
                                    ? <img src={e.profilePhotoUrl} alt={e.legalName} className="w-full h-full object-cover" onError={ev => ev.currentTarget.style.display="none"} />
                                    : (e.legalName ?? "?").split(" ").filter(Boolean).map(n => n[0]).join("").slice(0,2).toUpperCase()
                                }
                            </div>
                            <div className="mb-1">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    <h1 className="text-[22px] font-black text-[#1B2330] tracking-[-0.3px]">{e.legalName}</h1>
                                    {e.preferredName && e.preferredName !== e.legalName && (
                                        <span className="text-[13px] text-[#94A3B5]">"{e.preferredName}"</span>
                                    )}
                                </div>
                                <p className="text-[13.5px] text-[#69788C] mt-0.5">{e.designation} · {e.department}</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold", statusColor)}>
                                        {e.employmentType?.replace(/_/g, " ")}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EEF1F6] text-[11.5px] font-semibold text-[#69788C]">
                                        {e.workMode}
                                    </span>
                                    <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[#EEF3FE] text-[11.5px] font-semibold text-[#3C80F5]">
                                        {role}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setShowPwd(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E7EBF2] text-[12.5px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors shrink-0 mb-1">
                            <Key size={13} /> Change Password
                        </button>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#EEF1F6]">
                        {[
                            { label: "Joined",      value: joined,              icon: Calendar },
                            { label: "Experience",  value: `${e.totalExperience ?? 0} yrs`, icon: Star },
                            { label: "Location",    value: e.baseLocation ?? "—", icon: MapPin },
                            { label: "Reports to",  value: e.reportingManager ?? "—", icon: User },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#F7F9FC] border border-[#E7EBF2] flex items-center justify-center shrink-0">
                                    <Icon size={14} className="text-[#69788C]" />
                                </div>
                                <div>
                                    <p className="text-[10.5px] font-semibold text-[#94A3B5]">{label}</p>
                                    <p className="text-[12.5px] font-semibold text-[#1B2330] truncate max-w-[120px]" title={value}>{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Section title="PERSONAL DETAILS" icon={User}>
                    <InfoRow label="Legal Name"     value={e.legalName} />
                    <InfoRow label="Preferred Name" value={e.preferredName} />
                    <InfoRow label="Date of Birth"  value={fmt(e.dob)} />
                    <InfoRow label="Gender"         value={e.gender} />
                    <InfoRow label="Mobile"         value={e.personalMobile} />
                    <InfoRow label="Email"          value={email} />
                    <InfoRow label="Blood Group"    value={e.bloodGroup} />
                </Section>

                <Section title="EMPLOYMENT" icon={Briefcase}>
                    <InfoRow label="Designation"     value={e.designation} />
                    <InfoRow label="Department"      value={e.department} />
                    <InfoRow label="Employment Type" value={e.employmentType?.replace(/_/g," ")} />
                    <InfoRow label="Work Mode"       value={e.workMode} />
                    <InfoRow label="Base Location"   value={e.baseLocation} />
                    <InfoRow label="Date of Joining" value={fmt(e.dateOfJoining)} />
                    <InfoRow label="Probation"       value={e.probationDays ? `${e.probationDays} days` : null} />
                    <InfoRow label="Total Exp"       value={e.totalExperience ? `${e.totalExperience} yrs` : null} />
                    <InfoRow label="Relevant Exp"    value={e.relevantExp ? `${e.relevantExp} yrs` : null} />
                    <InfoRow label="Reporting To"    value={e.reportingManager} />
                </Section>

                <Section title="EMERGENCY CONTACT" icon={AlertCircle}>
                    <InfoRow label="Name"     value={e.emergencyName} />
                    <InfoRow label="Relation" value={e.emergencyRelation} />
                    <InfoRow label="Phone"    value={e.emergencyPhone} />
                </Section>

                <Section title="ADDRESS" icon={MapPin}>
                    <InfoRow label="Current"   value={e.currentAddress} />
                    <InfoRow label="Permanent" value={e.permanentAddress} />
                </Section>

                <Section title="BANK DETAILS" icon={CreditCard}>
                    <InfoRow label="Account Name" value={e.accountName} />
                    <InfoRow label="Bank"         value={e.bankName} />
                    <InfoRow label="Account No"   value={e.accountNumber} />
                    <InfoRow label="IFSC"         value={e.ifscCode} />
                    <InfoRow label="Branch"       value={e.branchName} />
                </Section>

                <Section title="KYC DOCUMENTS" icon={FileText}>
                    <InfoRow label="Aadhaar No" value={val(e.aadhaarNumber) ? e.aadhaarNumber : null} />
                    <InfoRow label="PAN No"     value={val(e.panNumber) ? e.panNumber : null} />
                    {val(e.aadhaarFrontUrl) && <InfoRow label="Aadhaar Front" value={e.aadhaarFrontUrl} link />}
                    {val(e.aadhaarBackUrl)  && <InfoRow label="Aadhaar Back"  value={e.aadhaarBackUrl}  link />}
                    {val(e.panPhotoUrl)     && <InfoRow label="PAN Photo"     value={e.panPhotoUrl}     link />}
                    {val(e.addressProofUrl) && <InfoRow label="Address Proof" value={e.addressProofUrl} link />}
                    {val(e.bankDocumentUrl) && <InfoRow label="Bank Doc"      value={e.bankDocumentUrl} link />}
                </Section>
            </div>
        </div>
    );
}

/* ════════════════════════════
   Client Profile
   ════════════════════════════ */
function ClientProfile({ data, showPwd, setShowPwd }) {
    const c     = data;
    const email = c.user?.email ?? "—";

    return (
        <div className="max-w-[1100px] mx-auto">
            {/* Hero */}
            <div className="bg-white border border-[#E7EBF2] rounded-2xl shadow-[0_1px_2px_rgba(27,35,48,.06),0_4px_16px_rgba(27,35,48,.06)] overflow-hidden mb-5">
                <div className="h-28 bg-gradient-to-r from-[#1B2330] to-[#3C80F5]" />
                <div className="px-6 pb-5 -mt-12">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex items-end gap-4">
                            <div style={{ width: 80, height: 80 }}
                                className="rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden shrink-0">
                                {val(c.logoUrl)
                                    ? <img src={c.logoUrl} alt={c.companyName} className="w-full h-full object-contain p-1" onError={ev => ev.currentTarget.style.display="none"} />
                                    : <Building2 size={32} className="text-[#94A3B5]" />
                                }
                            </div>
                            <div className="mb-1">
                                <h1 className="text-[22px] font-black text-[#1B2330] tracking-[-0.3px]">{c.companyName?.trim()}</h1>
                                {c.brandName && <p className="text-[13px] text-[#94A3B5]">{c.brandName}</p>}
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold", {
                                        ACTIVE:   "bg-[#EAF7EE] text-[#16A34A]",
                                        PROSPECT: "bg-[#EEF3FE] text-[#3C80F5]",
                                        INACTIVE: "bg-[#EEF1F6] text-[#69788C]",
                                    }[c.status] ?? "bg-[#EEF3FE] text-[#3C80F5]")}>
                                        {c.status ?? "PROSPECT"}
                                    </span>
                                    <span className="inline-flex px-2.5 py-0.5 rounded-full bg-[#EEF1F6] text-[11.5px] font-semibold text-[#69788C]">
                                        CLIENT
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setShowPwd(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#E7EBF2] text-[12.5px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors shrink-0 mb-1">
                            <Key size={13} /> Change Password
                        </button>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#EEF1F6]">
                        {[
                            { label: "Website",  value: c.website   ?? "—", icon: Globe    },
                            { label: "Industry", value: c.industry  ?? "—", icon: Briefcase},
                            { label: "Country",  value: c.country   ?? "—", icon: MapPin   },
                            { label: "Email",    value: email,               icon: Mail     },
                        ].map(({ label, value, icon: Icon }) => (
                            <div key={label} className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[#F7F9FC] border border-[#E7EBF2] flex items-center justify-center shrink-0">
                                    <Icon size={14} className="text-[#69788C]" />
                                </div>
                                <div>
                                    <p className="text-[10.5px] font-semibold text-[#94A3B5]">{label}</p>
                                    <p className="text-[12.5px] font-semibold text-[#1B2330] truncate max-w-[120px]" title={value}>{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Section title="COMPANY DETAILS" icon={Building2}>
                    <InfoRow label="Company"    value={c.companyName?.trim()} />
                    <InfoRow label="Brand Name" value={c.brandName} />
                    <InfoRow label="Website"    value={c.website} />
                    <InfoRow label="Industry"   value={c.industry} />
                    <InfoRow label="Country"    value={c.country} />
                    <InfoRow label="Timezone"   value={c.timezone} />
                    <InfoRow label="Description" value={c.description} />
                </Section>

                <Section title="PRIMARY CONTACT" icon={User}>
                    <InfoRow label="Name"      value={c.contactName?.trim()} />
                    <InfoRow label="Email"     value={c.contactEmail} />
                    <InfoRow label="Phone"     value={c.contactPhone?.trim()} />
                    <InfoRow label="Login Email" value={email} />
                </Section>

                {c.additionalContacts?.length > 0 && (
                    <Section title="ADDITIONAL CONTACTS" icon={Phone}>
                        {c.additionalContacts.map((contact, i) => (
                            <div key={i} className={cn("py-3", i < c.additionalContacts.length - 1 && "border-b border-[#EEF1F6]")}>
                                <p className="text-[13px] font-bold text-[#1B2330]">{contact.name}</p>
                                <p className="text-[12px] text-[#69788C]">{contact.role}</p>
                                {contact.email && <p className="text-[12px] text-[#69788C]">{contact.email}</p>}
                                {contact.phone && <p className="text-[12px] text-[#69788C]">{contact.phone}</p>}
                            </div>
                        ))}
                    </Section>
                )}

                <Section title="BILLING & LEGAL" icon={CreditCard}>
                    <InfoRow label="Billing Email"  value={c.billingEmail} />
                    <InfoRow label="Currency"       value={c.billingCurrency} />
                    <InfoRow label="Payment Terms"  value={c.paymentTerms} />
                    <InfoRow label="Tax ID"         value={c.taxId} />
                </Section>

                {(val(c.msaUrl) || val(c.ndaUrl) || val(c.taxCertUrl) || val(c.brandAssetsUrl)) && (
                    <Section title="DOCUMENTS" icon={FileText}>
                        {val(c.msaUrl)         && <InfoRow label="MSA"          value={c.msaUrl}         link />}
                        {val(c.ndaUrl)         && <InfoRow label="NDA"          value={c.ndaUrl}         link />}
                        {val(c.taxCertUrl)     && <InfoRow label="Tax Cert"     value={c.taxCertUrl}     link />}
                        {val(c.brandAssetsUrl) && <InfoRow label="Brand Assets" value={c.brandAssetsUrl} link />}
                    </Section>
                )}
            </div>
        </div>
    );
}

/* ════════════════════════════
   Main ProfilePage
   ════════════════════════════ */
export default function ProfilePage() {
    const [profile,  setProfile]  = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState("");
    const [showPwd,  setShowPwd]  = useState(false);

    useEffect(() => {
        apiFetch("/api/auth/profile")
            .then(json => setProfile(json))
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center py-32 gap-3 text-[#94A3B5]">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[13px]">Loading profile...</span>
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

    if (!profile) return null;

    const userType = profile.userType;
    const data     = profile.data;

    return (
        <>
            {userType === "CLIENT"
                ? <ClientProfile   data={data} showPwd={showPwd} setShowPwd={setShowPwd} />
                : <EmployeeProfile data={data} showPwd={showPwd} setShowPwd={setShowPwd} />
            }

            {showPwd && <ChangePasswordModal onClose={() => setShowPwd(false)} />}
        </>
    );
}