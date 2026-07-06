"use client";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    X, Building2, Users, FileText, ChevronRight,
    Loader2, Camera, Eye, EyeOff, ExternalLink, Plus, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "../ui/Toast";

/* ── Schema ── */
const registerSchema = z.object({
    email:            z.string().email("Valid email required"),
    password:         z.string().min(6, "Password must be at least 6 characters"),
    companyName:      z.string().min(1, "Company name is required"),
    website:          z.string().optional(),
    contactName:      z.string().min(1, "Contact name is required"),
    contactEmail:     z.string().email("Valid contact email required").or(z.literal("")).optional(),
    contactPhone:     z.string().optional(),
    /* additionalContacts is managed as local state (array), not a form field */
    /* logo and msa are file inputs — z.any() so RHF registers them */
    logo:             z.any().optional(),
    msa:              z.any().optional(),
});

/* Edit form intentionally mirrors the register fields only — companyName,
   website, contactName, contactEmail, contactPhone, logo, msa, +
   additionalContacts (handled as local state). No billing/legal extras. */
const editSchema = z.object({
    companyName:  z.string().min(1, "Company name is required"),
    website:      z.string().optional(),
    contactName:  z.string().min(1, "Contact name is required"),
    contactEmail: z.string().email("Valid contact email").or(z.literal("")).optional(),
    contactPhone: z.string().optional(),
});

const STEPS = [
    { id: "company",  label: "Company Info",    icon: Building2 },
    { id: "contact",  label: "Contact Details", icon: Users },
    { id: "docs",     label: "Documents",       icon: FileText },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function compressImage(file, maxDimension = 1600, quality = 0.8) {
    if (!file.type?.startsWith("image/") || file.type === "image/svg+xml") return file;
    try {
        const dataUrl = await new Promise((res, rej) => {
            const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
        });
        const img = await new Promise((res, rej) => {
            const el = new Image(); el.onload = () => res(el); el.onerror = rej; el.src = dataUrl;
        });
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
            const scale = maxDimension / Math.max(width, height);
            width = Math.round(width * scale); height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        const blob = await new Promise(res => canvas.toBlob(res, "image/jpeg", quality));
        if (!blob || blob.size >= file.size) return file;
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch { return file; }
}

function Field({ label, error, required, children }) {
    return (
        <div>
            <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">
                {label} {required && <span className="text-[#DC2626]">*</span>}
            </label>
            {children}
            {error && <p className="text-[11px] text-[#DC2626] mt-1 font-medium">{error}</p>}
        </div>
    );
}

function Inp({ error, className, ...props }) {
    return (
        <input {...props} className={cn(
            "w-full h-10 px-3.5 rounded-xl border text-[13px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none transition-colors",
            error
                ? "border-[#DC2626] bg-[#FEF2F2] focus:ring-2 focus:ring-[#DC2626]/20"
                : "border-[#E7EBF2] bg-[#F7F9FC] focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15",
            className
        )} />
    );
}

function FileInp({ register, name, accept = "image/*,.pdf", existingUrl }) {
    return (
        <div className="space-y-1.5">
            <input type="file" accept={accept} {...register(name)}
                className="block w-full text-[12px] text-[#69788C] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:text-[11.5px] file:font-semibold file:bg-[#EEF3FE] file:text-[#3C80F5] hover:file:bg-[#E0E9FD] file:cursor-pointer cursor-pointer" />
            {existingUrl && (
                <a href={existingUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#3C80F5] hover:underline">
                    <ExternalLink size={11} /> View current file
                </a>
            )}
        </div>
    );
}

export default function ClientForm({ onClose, onSuccess, editData = null }) {
    const [step,         setStep]         = useState(0);
    const [loading,      setLoading]      = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [addContacts,  setAddContacts]  = useState(editData?.additionalContacts ?? []);

    const isEdit = !!editData;
    const schema = isEdit ? editSchema : registerSchema;

    const { register, handleSubmit, formState: { errors }, trigger, watch } = useForm({
        resolver: zodResolver(schema),
        defaultValues: editData ? {
            companyName:  editData.companyName  ?? "",
            website:      editData.website      ?? "",
            contactName:  editData.contactName  ?? "",
            contactEmail: editData.contactEmail ?? "",
            contactPhone: editData.contactPhone ?? "",
        } : { email: "", password: "", companyName: "", website: "", contactName: "", contactEmail: "", contactPhone: "" },
    });

    const STEP_FIELDS = isEdit
        ? { 0: ["companyName"], 1: ["contactName"], 2: [] }
        : { 0: ["email", "password", "companyName"], 1: ["contactName"], 2: [] };

    async function nextStep() {
        const valid = await trigger(STEP_FIELDS[step]);
        if (valid) setStep(s => s + 1);
    }

    const logoFiles   = watch("logo");
    const logoPreview = useMemo(() => {
        const f = logoFiles?.[0]; return f ? URL.createObjectURL(f) : null;
    }, [logoFiles]);

    function addContact() {
        setAddContacts(c => [...c, { name: "", role: "", email: "", phone: "", tag: "" }]);
    }
    function removeContact(i) { setAddContacts(c => c.filter((_, idx) => idx !== i)); }
    function updateContact(i, field, value) {
        setAddContacts(c => c.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
    }

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const validContacts = addContacts.filter(c => c.name);

            if (!isEdit) {
                /* REGISTER — multipart with exact required fields only */
                const formData = new FormData();
                formData.append("email",        data.email);
                formData.append("password",     data.password);
                formData.append("companyName",  data.companyName);
                if (data.website)      formData.append("website",      data.website);
                if (data.contactName)  formData.append("contactName",  data.contactName);
                if (data.contactEmail) formData.append("contactEmail", data.contactEmail);
                if (data.contactPhone) formData.append("contactPhone", data.contactPhone);
                if (validContacts.length > 0) {
                    formData.append("additionalContacts", JSON.stringify(validContacts));
                }
                const logoFile = data.logo?.[0];
                if (logoFile) {
                    const compressed = await compressImage(logoFile);
                    if (compressed.size > MAX_FILE_SIZE) {
                        toast.error({ title: "Logo too large", message: "Logo exceeds 10MB." });
                        setLoading(false); return;
                    }
                    formData.append("logo", compressed);
                }
                const msaFile = data.msa?.[0];
                if (msaFile) {
                    if (msaFile.size > MAX_FILE_SIZE) {
                        toast.error({ title: "MSA too large", message: "MSA file exceeds 10MB." });
                        setLoading(false); return;
                    }
                    formData.append("msa", msaFile);
                }
                await apiFetch("/api/clients/register", { method: "POST", body: formData });
                toast.success({ title: "Client registered", message: `${data.companyName} has been added.` });

            } else {
                /* UPDATE text fields — only the fields shared with register */
                const textBody = {
                    companyName:  data.companyName,
                    website:      data.website,
                    contactName:  data.contactName,
                    contactEmail: data.contactEmail,
                    contactPhone: data.contactPhone,
                    /* backend expects this as a JSON string, not a raw array */
                    additionalContacts: JSON.stringify(validContacts),
                };
                await apiFetch(`/api/clients/${editData.id}`, {
                    method: "PUT", body: JSON.stringify(textBody),
                });

                /* UPDATE files — only logo + msa, matching register */
                const fileKeys = ["logo", "msa"];
                const selectedFiles = {};
                for (const key of fileKeys) {
                    const file = data[key]?.[0];
                    if (file) {
                        selectedFiles[key] = await compressImage(file);
                        if (selectedFiles[key].size > MAX_FILE_SIZE) {
                            toast.error({ title: "File too large", message: `${key} exceeds 10MB.` });
                            setLoading(false); return;
                        }
                    }
                }
                if (Object.keys(selectedFiles).length > 0) {
                    const docForm = new FormData();
                    Object.entries(selectedFiles).forEach(([k, f]) => docForm.append(k, f));
                    await apiFetch(`/api/clients/${editData.id}/documents`, { method: "PATCH", body: docForm });
                }
                toast.success({ title: "Client updated", message: `${data.companyName} has been updated.` });
            }
            onSuccess?.(); onClose();
        } catch (e) {
            toast.error({ title: isEdit ? "Update failed" : "Registration failed", message: e.message });
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[780px] mx-4 z-10 max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-start justify-between px-7 py-5 border-b border-[#E7EBF2] shrink-0">
                    <div>
                        <h2 className="text-[16px] font-bold text-[#1B2330]">{isEdit ? "Edit Client" : "Add New Client"}</h2>
                        <p className="text-[12px] text-[#94A3B5] mt-0.5">{isEdit ? "Update client information." : "Register a new client in ProMonkey."}</p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B5] hover:bg-[#F7F9FC] hover:text-[#1B2330] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-[200px] shrink-0 border-r border-[#E7EBF2] py-4 px-3 space-y-1">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <button key={s.id} type="button" onClick={() => setStep(i)}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold transition-colors text-left",
                                        i === step ? "bg-[#EEF3FE] text-[#3C80F5]" : "text-[#69788C] hover:bg-[#F7F9FC]"
                                    )}>
                                    <Icon size={14} className="shrink-0" />{s.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Form content */}
                    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6">

                        {/* Step 0 — Company Info */}
                        {step === 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 mb-2">
                                    <label className="relative w-16 h-16 rounded-xl border-2 border-dashed border-[#E7EBF2] flex flex-col items-center justify-center gap-1 text-[#94A3B5] cursor-pointer hover:bg-[#F7F9FC] transition-colors overflow-hidden">
                                        {(logoPreview || editData?.logoUrl) ? (
                                            <img src={logoPreview || editData.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <><Camera size={18} /><span className="text-[10px] font-semibold">LOGO</span></>
                                        )}
                                        <input type="file" accept="image/*" {...register("logo")} className="sr-only" />
                                    </label>
                                    <div>
                                        <p className="text-[13px] font-semibold text-[#1B2330]">Company Logo</p>
                                        <p className="text-[11.5px] text-[#94A3B5]">PNG, JPG. Max 10MB.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {!isEdit && (
                                        <>
                                            <Field label="Login Email" error={errors.email?.message} required>
                                                <Inp {...register("email")} type="email" placeholder="ceo@acmecorp.com" error={errors.email} />
                                            </Field>
                                            <Field label="Password" error={errors.password?.message} required>
                                                <div className="relative">
                                                    <Inp {...register("password")} type={showPassword ? "text" : "password"} placeholder="Min 6 characters" className="pr-10" />
                                                    <button type="button" onClick={() => setShowPassword(s => !s)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B5] hover:text-[#1B2330]">
                                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                </div>
                                            </Field>
                                        </>
                                    )}
                                    <Field label="Company Name" error={errors.companyName?.message} required>
                                        <Inp {...register("companyName")} placeholder="Acme Corporation" error={errors.companyName} />
                                    </Field>
                                    <Field label="Website">
                                        <Inp {...register("website")} placeholder="https://acmecorp.com" />
                                    </Field>
                                </div>
                            </div>
                        )}

                        {/* Step 1 — Contact Details */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Primary Contact Name" error={errors.contactName?.message} required>
                                        <Inp {...register("contactName")} placeholder="Jane Smith" error={errors.contactName} />
                                    </Field>
                                    <Field label="Contact Email" error={errors.contactEmail?.message}>
                                        <Inp {...register("contactEmail")} type="email" placeholder="jane@acmecorp.com" error={errors.contactEmail} />
                                    </Field>
                                    <Field label="Contact Phone">
                                        <Inp {...register("contactPhone")} placeholder="9998887777" />
                                    </Field>
                                </div>

                                {/* Additional Contacts */}
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[11.5px] font-bold text-[#94A3B5] tracking-wider">ADDITIONAL CONTACTS</p>
                                        <button type="button" onClick={addContact}
                                            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#3C80F5] hover:text-[#2563EB]">
                                            <Plus size={13} /> Add contact
                                        </button>
                                    </div>
                                    {addContacts.length === 0 && (
                                        <p className="text-[12.5px] text-[#94A3B5] text-center py-6 bg-[#F7F9FC] rounded-xl border border-[#E7EBF2]">
                                            No additional contacts. Click "Add contact" to add one.
                                        </p>
                                    )}
                                    {addContacts.map((c, i) => (
                                        <div key={i} className="grid grid-cols-2 gap-3 mb-3 p-3 bg-[#F7F9FC] rounded-xl border border-[#E7EBF2] relative">
                                            <button type="button" onClick={() => removeContact(i)}
                                                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg text-[#94A3B5] hover:bg-[#FCEDED] hover:text-[#DC2626] transition-colors">
                                                <Trash2 size={12} />
                                            </button>
                                            {[
                                                { f: "name",  p: "Bob Finance",      l: "Name"  },
                                                { f: "role",  p: "Head of Billing",  l: "Role"  },
                                                { f: "email", p: "billing@acme.com", l: "Email" },
                                                { f: "phone", p: "1112223333",       l: "Phone" },
                                                { f: "tag",   p: "billing",          l: "Tag"   },
                                            ].map(({ f, p, l }) => (
                                                <div key={f}>
                                                    <p className="text-[11px] font-semibold text-[#94A3B5] mb-1">{l}</p>
                                                    <input value={c[f] ?? ""} onChange={e => updateContact(i, f, e.target.value)} placeholder={p}
                                                        className="w-full h-9 px-3 rounded-lg border border-[#E7EBF2] bg-white text-[12.5px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none focus:border-[#3C80F5]" />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2 — Documents */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="MSA (Master Service Agreement)">
                                        <FileInp register={register} name="msa" accept=".pdf" existingUrl={editData?.msaUrl} />
                                    </Field>
                                </div>
                                {isEdit && (
                                    <p className="text-[11.5px] text-[#94A3B5]">Only choose a file if you want to replace what's already on record.</p>
                                )}
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-7 py-4 border-t border-[#E7EBF2] shrink-0">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors">
                        Cancel
                    </button>
                    <div className="flex items-center gap-3">
                        {step > 0 && (
                            <button type="button" onClick={() => setStep(s => s - 1)}
                                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#69788C] border border-[#E7EBF2] hover:bg-[#F7F9FC] transition-colors">
                                Back
                            </button>
                        )}
                        {step < STEPS.length - 1 ? (
                            <button type="button" onClick={nextStep}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity">
                                Proceed & Confirm <ChevronRight size={14} />
                            </button>
                        ) : (
                            <button type="button" onClick={handleSubmit(onSubmit)} disabled={loading}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-60">
                                {loading && <Loader2 size={13} className="animate-spin" />}
                                {isEdit ? "Update Client" : "Register Client"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}