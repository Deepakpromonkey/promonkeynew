"use client";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    X, User, FileText, MapPin, Landmark, Briefcase, ChevronRight, Loader2,
    Camera, Eye, EyeOff, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "../ui/Toast";

/* ── file-required helper: required on create, optional on edit ── */
function fileField(isEdit, label) {
    const base = z.any();
    return isEdit
        ? base.optional()
        : base.refine(v => v && v.length > 0, `${label} is required`);
}

function buildSchema(isEdit) {
    return z.object({
        legalName:        z.string().min(1, "Legal name is required"),
        preferredName:    z.string().min(1, "Preferred name is required"),
        dob:              z.string().min(1, "Date of birth is required"),
        gender:           z.enum(["MALE", "FEMALE", "OTHER"], { required_error: "Gender is required" }),
        personalMobile:   z.string().min(10, "Valid mobile number required"),
        email:            z.string().email("Valid email required"),
        bloodGroup:       z.string().min(1, "Blood group is required"),
        emergencyName:    z.string().min(1, "Emergency contact name is required"),
        emergencyRelation: z.string().min(1, "Relation is required"),
        emergencyPhone:   z.string().min(10, "Valid emergency phone is required"),
        aadhaarNumber:    z.string().min(1, "Aadhaar number is required"),
        panNumber:        z.string().min(1, "PAN number is required"),
        currentAddress:   z.string().min(1, "Current address is required"),
        permanentAddress: z.string().min(1, "Permanent address is required"),
        accountName:      z.string().min(1, "Account holder name is required"),
        bankName:         z.string().min(1, "Bank name is required"),
        accountNumber:    z.string().min(1, "Account number is required"),
        ifscCode:         z.string().min(1, "IFSC code is required"),
        branchName:       z.string().min(1, "Branch name is required"),
        designation:      z.string().min(1, "Designation is required"),
        department:       z.string().min(1, "Department is required"),
        reportingManager: z.string().min(1, "Reporting manager is required"),
        employmentType:   z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]),
        workMode:         z.enum(["REMOTE", "ONSITE", "HYBRID"]),
        baseLocation:     z.string().min(1, "Base location is required"),
        dateOfJoining:    z.string().min(1, "Date of joining is required"),
        probationDays:    z.coerce.number({ required_error: "Probation days is required" }).min(0, "Must be 0 or more"),
        totalExperience:  z.coerce.number({ required_error: "Total experience is required" }).min(0, "Must be 0 or more"),
        relevantExp:      z.coerce.number({ required_error: "Relevant experience is required" }).min(0, "Must be 0 or more"),
        /* files — required on create, optional on edit (existing files already on record) */
        profilePhoto:     fileField(isEdit, "Profile photo"),
        aadhaarFront:     fileField(isEdit, "Aadhaar front"),
        aadhaarBack:      fileField(isEdit, "Aadhaar back"),
        panPhoto:         fileField(isEdit, "PAN photo"),
        addressProof:     fileField(isEdit, "Address proof"),
        bankDocument:     fileField(isEdit, "Bank document"),
        password: isEdit
            ? z.string().optional()
            : z.string().min(6, "Password must be at least 6 characters"),
    });
}

const STEPS = [
    { id: "personal",    label: "Personal & Identity", icon: User },
    { id: "kyc",         label: "KYC Documents",       icon: FileText },
    { id: "address",     label: "Address Details",     icon: MapPin },
    { id: "bank",        label: "Bank & Payroll",       icon: Landmark },
    { id: "employment",  label: "Employment Info",      icon: Briefcase },
];

const FILE_FIELDS = ["profilePhoto", "aadhaarFront", "aadhaarBack", "panPhoto", "addressProof", "bankDocument"];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

async function compressImage(file, maxDimension = 1600, quality = 0.8) {
    if (!file.type?.startsWith("image/") || file.type === "image/svg+xml") return file;
    try {
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
        const img = await new Promise((resolve, reject) => {
            const el = new Image();
            el.onload = () => resolve(el);
            el.onerror = reject;
            el.src = dataUrl;
        });
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
            const scale = maxDimension / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

        if (!blob || blob.size >= file.size) return file;
        return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch {
        return file;
    }
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
        <input
            {...props}
            className={cn(
                "w-full h-10 px-3.5 rounded-xl border text-[13px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none transition-colors",
                error
                    ? "border-[#DC2626] bg-[#FEF2F2] focus:ring-2 focus:ring-[#DC2626]/20"
                    : "border-[#E7EBF2] bg-[#F7F9FC] focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15",
                className
            )}
        />
    );
}

function Sel({ error, children, ...props }) {
    return (
        <select
            {...props}
            className={cn(
                "w-full h-10 px-3.5 rounded-xl border text-[13px] text-[#1B2330] outline-none transition-colors bg-[#F7F9FC]",
                error
                    ? "border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"
                    : "border-[#E7EBF2] focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15"
            )}
        >
            {children}
        </select>
    );
}

function FileInp({ register, name, accept = "image/*,.pdf", existingUrl }) {
    return (
        <div className="space-y-1.5">
            <input
                type="file"
                accept={accept}
                {...register(name)}
                className="block w-full text-[12px] text-[#69788C] file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:text-[11.5px] file:font-semibold file:bg-[#EEF3FE] file:text-[#3C80F5] hover:file:bg-[#E0E9FD] file:cursor-pointer cursor-pointer"
            />
            {existingUrl && (
                <a
                    href={existingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#3C80F5] hover:underline"
                >
                    <ExternalLink size={11} /> View current file
                </a>
            )}
        </div>
    );
}

export default function EmployeeForm({ onClose, onSuccess, editData = null }) {
    const [step,         setStep]         = useState(0);
    const [loading,      setLoading]      = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    /* ── roles for the Designation dropdown ── */
    const [roles,        setRoles]        = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);

    useEffect(() => {
        setRolesLoading(true);
        apiFetch("/api/roles")
            .then(j => setRoles(j.data ?? []))
            .catch(e => toast.error({ title: "Failed to load roles", message: e.message }))
            .finally(() => setRolesLoading(false));
    }, []);

    const isEdit = !!editData;
    const schema = useMemo(() => buildSchema(isEdit), [isEdit]);

    const { register, handleSubmit, formState: { errors }, trigger, watch } = useForm({
        resolver: zodResolver(schema),
        defaultValues: editData ? {
            legalName:        editData.legalName       ?? "",
            preferredName:    editData.preferredName   ?? "",
            dob:              editData.dob?.slice(0,10) ?? "",
            gender:           editData.gender          ?? "MALE",
            personalMobile:   editData.personalMobile  ?? "",
            email:            editData.user?.email     ?? "",
            bloodGroup:       editData.bloodGroup      ?? "",
            emergencyName:    editData.emergencyName   ?? "",
            emergencyRelation: editData.emergencyRelation ?? "",
            emergencyPhone:   editData.emergencyPhone  ?? "",
            aadhaarNumber:    editData.aadhaarNumber   ?? "",
            panNumber:        editData.panNumber       ?? "",
            currentAddress:   editData.currentAddress  ?? "",
            permanentAddress: editData.permanentAddress ?? "",
            accountName:      editData.accountName     ?? "",
            bankName:         editData.bankName        ?? "",
            accountNumber:    editData.accountNumber   ?? "",
            ifscCode:         editData.ifscCode        ?? "",
            branchName:       editData.branchName      ?? "",
            designation:      editData.designation     ?? "",
            department:       editData.department      ?? "",
            reportingManager: editData.reportingManager ?? "",
            employmentType:   editData.employmentType  ?? "FULL_TIME",
            workMode:         editData.workMode        ?? "HYBRID",
            baseLocation:     editData.baseLocation    ?? "",
            dateOfJoining:    editData.dateOfJoining?.slice(0,10) ?? "",
            probationDays:    editData.probationDays   ?? 90,
            totalExperience:  editData.totalExperience ?? 0,
            relevantExp:      editData.relevantExp     ?? 0,
            password:         "",
        } : {
            gender: "MALE", employmentType: "FULL_TIME", workMode: "HYBRID", probationDays: 90,
            password: "",
        },
    });

    const STEP_FIELDS = {
        0: [
            "legalName", "preferredName", "dob", "gender", "personalMobile", "email", "bloodGroup",
            "emergencyName", "emergencyRelation", "emergencyPhone",
            ...(isEdit ? [] : ["password", "profilePhoto"]),
        ],
        1: ["aadhaarNumber", "panNumber", ...(isEdit ? [] : ["aadhaarFront", "aadhaarBack", "panPhoto", "addressProof"])],
        2: ["currentAddress", "permanentAddress"],
        3: ["accountName", "bankName", "accountNumber", "ifscCode", "branchName", ...(isEdit ? [] : ["bankDocument"])],
        4: [
            "designation", "department", "reportingManager", "employmentType", "workMode",
            "baseLocation", "dateOfJoining", "probationDays", "totalExperience", "relevantExp",
        ],
    };

    /* ── collect zod error messages and toast them ── */
    function toastErrors(fieldErrors) {
        const messages = Object.values(fieldErrors).map(e => e?.message).filter(Boolean);
        if (messages.length === 0) return;
        const shown = messages.slice(0, 4).join(" · ");
        const extra = messages.length > 4 ? ` (+${messages.length - 4} more)` : "";
        toast.error({ title: "Please fix the highlighted fields", message: shown + extra });
    }

    async function nextStep() {
        const valid = await trigger(STEP_FIELDS[step]);
        if (valid) {
            setStep(s => s + 1);
        } else {
            const currentStepErrors = Object.fromEntries(
                STEP_FIELDS[step]
                    .filter(f => errors[f])
                    .map(f => [f, errors[f]])
            );
            toastErrors(currentStepErrors);
        }
    }

    const profilePhotoFiles = watch("profilePhoto");
    const profilePhotoPreview = useMemo(() => {
        const file = profilePhotoFiles?.[0];
        return file ? URL.createObjectURL(file) : null;
    }, [profilePhotoFiles]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const textFields = {
                legalName:        data.legalName,
                preferredName:    data.preferredName,
                dob:              data.dob,
                gender:           data.gender,
                personalMobile:   data.personalMobile,
                email:            data.email,
                bloodGroup:       data.bloodGroup,
                emergencyName:    data.emergencyName,
                emergencyRelation: data.emergencyRelation,
                emergencyPhone:   data.emergencyPhone,
                aadhaarNumber:    data.aadhaarNumber,
                panNumber:        data.panNumber,
                currentAddress:   data.currentAddress,
                permanentAddress: data.permanentAddress,
                accountName:      data.accountName,
                bankName:         data.bankName,
                accountNumber:    data.accountNumber,
                ifscCode:         data.ifscCode,
                branchName:       data.branchName,
                designation:      data.designation,
                department:       data.department,
                reportingManager: data.reportingManager,
                employmentType:   data.employmentType,
                workMode:         data.workMode,
                baseLocation:     data.baseLocation,
                dateOfJoining:    data.dateOfJoining,
                probationDays:    data.probationDays,
                totalExperience:  data.totalExperience,
                relevantExp:      data.relevantExp,
            };

            const rawFiles = FILE_FIELDS.reduce((acc, key) => {
                const file = data[key]?.[0];
                if (file) acc[key] = file;
                return acc;
            }, {});

            const selectedFiles = {};
            for (const [key, file] of Object.entries(rawFiles)) {
                selectedFiles[key] = await compressImage(file);
            }

            const oversized = Object.entries(selectedFiles).find(([, file]) => file.size > MAX_FILE_SIZE);
            if (oversized) {
                toast.error({
                    title: "File too large",
                    message: `${oversized[0]} is still over 10MB after compression. Please choose a smaller file (this is usually only an issue with large PDFs).`,
                });
                setLoading(false);
                return;
            }

            if (isEdit) {

                await apiFetch(`/api/employees/${editData.id}`, {
                    method: "PUT",
                    body: JSON.stringify(textFields),
                });

                if (Object.keys(selectedFiles).length > 0) {
                    const docForm = new FormData();
                    Object.entries(selectedFiles).forEach(([key, file]) => docForm.append(key, file));
                    await apiFetch(`/api/employees/${editData.id}/documents`, {
                        method: "PATCH",
                        body: docForm,
                    });
                }

                toast.success({ title: "Employee updated", message: `${data.legalName} has been updated.` });
            } else {
                // Registration mixes text + files + password → single multipart POST
                const formData = new FormData();
                Object.entries(textFields).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== "") {
                        formData.append(key, value);
                    }
                });
                formData.append("password", data.password);
                Object.entries(selectedFiles).forEach(([key, file]) => formData.append(key, file));

                await apiFetch("/api/employees/register", {
                    method: "POST",
                    body: formData,
                });

                toast.success({ title: "Employee added", message: `${data.legalName} has been registered.` });
            }
            onSuccess?.();
            onClose();
        } catch (e) {
            toast.error({ title: isEdit ? "Update failed" : "Registration failed", message: e.message });
        } finally {
            setLoading(false);
        }
    };

    /* ── on final submit, if validation fails, toast every error across all steps ── */
    const onInvalid = (fieldErrors) => {
        toastErrors(fieldErrors);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[780px] mx-4 z-10 max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-start justify-between px-7 py-5 border-b border-[#E7EBF2] shrink-0">
                    <div>
                        <h2 className="text-[16px] font-bold text-[#1B2330]">
                            {isEdit ? "Edit Employee" : "Add New Employee"}
                        </h2>
                        <p className="text-[12px] text-[#94A3B5] mt-0.5">
                            {isEdit ? "Update employee information." : "Onboard a new member to the ProMonkey ecosystem."}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B5] hover:bg-[#F7F9FC] hover:text-[#1B2330] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar steps */}
                    <div className="w-[200px] shrink-0 border-r border-[#E7EBF2] py-4 px-3 space-y-1">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setStep(i)}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold transition-colors text-left",
                                        i === step
                                            ? "bg-[#EEF3FE] text-[#3C80F5]"
                                            : "text-[#69788C] hover:bg-[#F7F9FC]"
                                    )}
                                >
                                    <Icon size={14} className="shrink-0" />
                                    {s.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Form content */}
                    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex-1 overflow-y-auto p-6">

                        {/* Step 0: Personal */}
                        {step === 0 && (
                            <div className="space-y-4">
                                {/* Profile photo */}
                                <div className="flex items-center gap-4 mb-2">
                                    <label className="relative w-16 h-16 rounded-xl border-2 border-dashed border-[#E7EBF2] flex flex-col items-center justify-center gap-1 text-[#94A3B5] cursor-pointer hover:bg-[#F7F9FC] transition-colors overflow-hidden">
                                        {(profilePhotoPreview || editData?.profilePhoto) ? (
                                            <img
                                                src={profilePhotoPreview || editData.profilePhoto}
                                                alt="Profile preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <>
                                                <Camera size={18} />
                                                <span className="text-[10px] font-semibold">UPLOAD</span>
                                            </>
                                        )}
                                        <input type="file" accept="image/*" {...register("profilePhoto")} className="sr-only" />
                                    </label>
                                    <div>
                                        <p className="text-[13px] font-semibold text-[#1B2330]">
                                            Profile Photo {!isEdit && <span className="text-[#DC2626]">*</span>}
                                        </p>
                                        <p className="text-[11.5px] text-[#94A3B5]">Recommended: 512×512px. JPG or PNG.</p>
                                        {errors.profilePhoto && <p className="text-[11px] text-[#DC2626] mt-1 font-medium">{errors.profilePhoto.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Full Legal Name" error={errors.legalName?.message} required>
                                        <Inp {...register("legalName")} placeholder="Johnathan Doe" error={errors.legalName} />
                                    </Field>
                                    <Field label="Preferred Name" error={errors.preferredName?.message} required>
                                        <Inp {...register("preferredName")} placeholder="John" error={errors.preferredName} />
                                    </Field>
                                    <Field label="Date of Birth" error={errors.dob?.message} required>
                                        <Inp {...register("dob")} type="date" error={errors.dob} />
                                    </Field>
                                    <Field label="Gender" error={errors.gender?.message} required>
                                        <Sel {...register("gender")} error={errors.gender}>
                                            <option value="MALE">Male</option>
                                            <option value="FEMALE">Female</option>
                                            <option value="OTHER">Other</option>
                                        </Sel>
                                    </Field>
                                    <Field label="Mobile Number" error={errors.personalMobile?.message} required>
                                        <Inp {...register("personalMobile")} placeholder="+1 (555) 000-0000" error={errors.personalMobile} />
                                    </Field>
                                    <Field label="Email Address" error={errors.email?.message} required>
                                        <Inp {...register("email")} type="email" placeholder="john.doe@promonkey.com" error={errors.email} />
                                    </Field>
                                    <Field label="Blood Group" error={errors.bloodGroup?.message} required>
                                        <Sel {...register("bloodGroup")} error={errors.bloodGroup}>
                                            <option value="">Select</option>
                                            {["A+","A-","B+","B-","O+","O-","AB+","AB-"].map(b => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </Sel>
                                    </Field>
                                    {!isEdit && (
                                        <Field label="Password" error={errors.password?.message} required>
                                            <div className="relative">
                                                <Inp
                                                    {...register("password")}
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Minimum 6 characters"
                                                    error={errors.password}
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(s => !s)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B5] hover:text-[#1B2330]"
                                                >
                                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </Field>
                                    )}
                                </div>

                                <p className="text-[11.5px] font-bold text-[#94A3B5] tracking-wider mt-2">EMERGENCY CONTACT</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Contact Name" error={errors.emergencyName?.message} required>
                                        <Inp {...register("emergencyName")} placeholder="Jane Doe" error={errors.emergencyName} />
                                    </Field>
                                    <Field label="Relation" error={errors.emergencyRelation?.message} required>
                                        <Inp {...register("emergencyRelation")} placeholder="Spouse" error={errors.emergencyRelation} />
                                    </Field>
                                    <Field label="Phone" error={errors.emergencyPhone?.message} required>
                                        <Inp {...register("emergencyPhone")} placeholder="9876543211" error={errors.emergencyPhone} />
                                    </Field>
                                </div>
                            </div>
                        )}

                        {/* Step 1: KYC */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Aadhaar Number" error={errors.aadhaarNumber?.message} required>
                                        <Inp {...register("aadhaarNumber")} placeholder="1234 5678 9012" error={errors.aadhaarNumber} />
                                    </Field>
                                    <Field label="PAN Number" error={errors.panNumber?.message} required>
                                        <Inp {...register("panNumber")} placeholder="ABCDE1234F" error={errors.panNumber} />
                                    </Field>
                                </div>

                                <p className="text-[11.5px] font-bold text-[#94A3B5] tracking-wider mt-2">DOCUMENT UPLOADS</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Aadhaar Front" error={errors.aadhaarFront?.message} required={!isEdit}>
                                        <FileInp register={register} name="aadhaarFront" existingUrl={editData?.aadhaarFront} />
                                    </Field>
                                    <Field label="Aadhaar Back" error={errors.aadhaarBack?.message} required={!isEdit}>
                                        <FileInp register={register} name="aadhaarBack" existingUrl={editData?.aadhaarBack} />
                                    </Field>
                                    <Field label="PAN Photo" error={errors.panPhoto?.message} required={!isEdit}>
                                        <FileInp register={register} name="panPhoto" existingUrl={editData?.panPhoto} />
                                    </Field>
                                    <Field label="Address Proof" error={errors.addressProof?.message} required={!isEdit}>
                                        <FileInp register={register} name="addressProof" existingUrl={editData?.addressProof} />
                                    </Field>
                                </div>
                                {isEdit && (
                                    <p className="text-[11.5px] text-[#94A3B5]">
                                        Only choose a file above if you want to replace what's already on record.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Step 2: Address */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <Field label="Current Address" error={errors.currentAddress?.message} required>
                                    <textarea
                                        {...register("currentAddress")}
                                        rows={3}
                                        placeholder="123 Tech Park, Sector 45, Gurugram"
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl border text-[13px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none resize-none",
                                            errors.currentAddress
                                                ? "border-[#DC2626] bg-[#FEF2F2] focus:ring-2 focus:ring-[#DC2626]/20"
                                                : "border-[#E7EBF2] bg-[#F7F9FC] focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15"
                                        )}
                                    />
                                </Field>
                                <Field label="Permanent Address" error={errors.permanentAddress?.message} required>
                                    <textarea
                                        {...register("permanentAddress")}
                                        rows={3}
                                        placeholder="456 Heritage Block, New Delhi"
                                        className={cn(
                                            "w-full px-3.5 py-2.5 rounded-xl border text-[13px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none resize-none",
                                            errors.permanentAddress
                                                ? "border-[#DC2626] bg-[#FEF2F2] focus:ring-2 focus:ring-[#DC2626]/20"
                                                : "border-[#E7EBF2] bg-[#F7F9FC] focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15"
                                        )}
                                    />
                                </Field>
                            </div>
                        )}

                        {/* Step 3: Bank */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Account Holder Name" error={errors.accountName?.message} required>
                                        <Inp {...register("accountName")} placeholder="Johnathan Doe" error={errors.accountName} />
                                    </Field>
                                    <Field label="Bank Name" error={errors.bankName?.message} required>
                                        <Inp {...register("bankName")} placeholder="HDFC Bank" error={errors.bankName} />
                                    </Field>
                                    <Field label="Account Number" error={errors.accountNumber?.message} required>
                                        <Inp {...register("accountNumber")} placeholder="50100123456789" error={errors.accountNumber} />
                                    </Field>
                                    <Field label="IFSC Code" error={errors.ifscCode?.message} required>
                                        <Inp {...register("ifscCode")} placeholder="HDFC0001234" error={errors.ifscCode} />
                                    </Field>
                                    <Field label="Branch Name" error={errors.branchName?.message} required>
                                        <Inp {...register("branchName")} placeholder="Sector 45, Gurugram" error={errors.branchName} />
                                    </Field>
                                </div>
                                <p className="text-[11.5px] font-bold text-[#94A3B5] tracking-wider mt-2">BANK DOCUMENT</p>
                                <Field label="Cancelled Cheque / Passbook" error={errors.bankDocument?.message} required={!isEdit}>
                                    <FileInp register={register} name="bankDocument" existingUrl={editData?.bankDocument} />
                                </Field>
                            </div>
                        )}

                        {/* Step 4: Employment */}
                        {step === 4 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Designation" error={errors.designation?.message} required>
                                        {rolesLoading ? (
                                            <div className="h-10 flex items-center gap-2 text-[#94A3B5] text-[12.5px]">
                                                <Loader2 size={14} className="animate-spin" /> Loading roles...
                                            </div>
                                        ) : (
                                            <Sel {...register("designation")} error={errors.designation}>
                                                <option value="">Select role</option>
                                                {roles.map(r => (
                                                    <option key={r.id} value={r.name}>{r.name}</option>
                                                ))}
                                            </Sel>
                                        )}
                                    </Field>
                                    <Field label="Department" error={errors.department?.message} required>
                                        <Inp {...register("department")} placeholder="Engineering" error={errors.department} />
                                    </Field>
                                    <Field label="Reporting Manager" error={errors.reportingManager?.message} required>
                                        <Inp {...register("reportingManager")} placeholder="admin@monkeycrm.com" error={errors.reportingManager} />
                                    </Field>
                                    <Field label="Employment Type" error={errors.employmentType?.message} required>
                                        <Sel {...register("employmentType")} error={errors.employmentType}>
                                            <option value="FULL_TIME">Full Time</option>
                                            <option value="PART_TIME">Part Time</option>
                                            <option value="CONTRACT">Contract</option>
                                            <option value="INTERN">Intern</option>
                                        </Sel>
                                    </Field>
                                    <Field label="Work Mode" error={errors.workMode?.message} required>
                                        <Sel {...register("workMode")} error={errors.workMode}>
                                            <option value="HYBRID">Hybrid</option>
                                            <option value="REMOTE">Remote</option>
                                            <option value="ONSITE">Onsite</option>
                                        </Sel>
                                    </Field>
                                    <Field label="Base Location" error={errors.baseLocation?.message} required>
                                        <Inp {...register("baseLocation")} placeholder="Gurugram" error={errors.baseLocation} />
                                    </Field>
                                    <Field label="Date of Joining" error={errors.dateOfJoining?.message} required>
                                        <Inp {...register("dateOfJoining")} type="date" error={errors.dateOfJoining} />
                                    </Field>
                                    <Field label="Probation Days" error={errors.probationDays?.message} required>
                                        <Inp {...register("probationDays")} type="number" placeholder="90" error={errors.probationDays} />
                                    </Field>
                                    <Field label="Total Experience (yrs)" error={errors.totalExperience?.message} required>
                                        <Inp {...register("totalExperience")} type="number" step="0.5" placeholder="4.5" error={errors.totalExperience} />
                                    </Field>
                                    <Field label="Relevant Exp (yrs)" error={errors.relevantExp?.message} required>
                                        <Inp {...register("relevantExp")} type="number" step="0.5" placeholder="3" error={errors.relevantExp} />
                                    </Field>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-7 py-4 border-t border-[#E7EBF2] shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors"
                    >
                        Cancel Process
                    </button>
                    <div className="flex items-center gap-3">
                        {step > 0 && (
                            <button
                                type="button"
                                onClick={() => setStep(s => s - 1)}
                                className="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#69788C] border border-[#E7EBF2] hover:bg-[#F7F9FC] transition-colors"
                            >
                                Back
                            </button>
                        )}
                        {step < STEPS.length - 1 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity"
                            >
                                Proceed & Confirm <ChevronRight size={14} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit, onInvalid)}
                                disabled={loading}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-60"
                            >
                                {loading && <Loader2 size={13} className="animate-spin" />}
                                {isEdit ? "Update Employee" : "Register Employee"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}