"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "../ui/Toast";
import { apiFetch } from "@/lib/api";

const schema = z.object({
    name:           z.string().min(1, "Phase name is required"),
    priority:       z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    leadId:         z.string().optional(),
    startDate:      z.string().min(1, "Start date is required"),
    dueDate:        z.string().min(1, "Due date is required"),
    estimatedHours: z.coerce.number().min(0, "Must be 0 or more"),
});

const PRIORITY_OPTS = ["LOW", "MEDIUM", "HIGH", "URGENT"];

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

/** Convert an <input type="date"> value into the ISO strings the API expects. */
function toISOStart(dateStr) {
    return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}
function toISOEnd(dateStr) {
    return new Date(`${dateStr}T23:59:59.000Z`).toISOString();
}
/** ISO datetime -> yyyy-mm-dd for populating <input type="date"> on edit */
function toDateInputValue(iso) {
    if (!iso) return "";
    return new Date(iso).toISOString().slice(0, 10);
}

export default function PhaseForm({ projectId, onClose, onSuccess, editData = null }) {
    const isEdit = !!editData;
    const [loading, setLoading] = useState(false);

    /* ---- Team (for the Phase lead dropdown) ---- */
    const [teamOptions, setTeamOptions] = useState([]);
    const [teamLoading, setTeamLoading] = useState(false);
    const effectiveProjectId = projectId ?? editData?.projectId;

    const { register, handleSubmit, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name:           editData?.name           ?? "",
            priority:       editData?.priority        ?? "MEDIUM",
            leadId:         editData?.leadId ?? editData?.lead?.id ?? "",
            startDate:      toDateInputValue(editData?.startDate),
            dueDate:        toDateInputValue(editData?.dueDate),
            estimatedHours: editData?.estimatedHours  ?? editData?.hoursEst ?? "",
        },
    });

    useEffect(() => {
        if (!effectiveProjectId) return;
        async function loadTeam() {
            setTeamLoading(true);
            try {
                const json = await apiFetch(`/api/projects/${effectiveProjectId}/team`);
                const data = json.data ?? json;

                const raw = [
                    ...(data.lead ? [data.lead] : []),
                    ...(data.members ?? []),
                ];

                const seen = new Set();
                const deduped = raw.filter(m => {
                    if (!m?.id || seen.has(m.id)) return false;
                    seen.add(m.id);
                    return true;
                });

                setTeamOptions(deduped.map(m => ({
                    id:   m.id,
                    name: m.legalName ?? m.name ?? "Team Member",
                    role: m.designation ?? m.role ?? "",
                })));

                // The <select> mounted before this list existed, so its initial
                // defaultValue (from useForm) couldn't match any <option> yet and
                // silently fell back to "Unassigned". Re-apply the real lead now
                // that the matching option exists.
                if (isEdit) {
                    const currentLeadId = editData?.leadId ?? editData?.lead?.id ?? "";
                    if (currentLeadId) setValue("leadId", currentLeadId);
                }
            } catch (e) {
                toast.error({ title: "Failed to load team", message: e.message });
            } finally { setTeamLoading(false); }
        }
        loadTeam();
    }, [effectiveProjectId]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const payload = {
                name:           data.name,
                startDate:      toISOStart(data.startDate),
                dueDate:        toISOEnd(data.dueDate),
                priority:       data.priority,
                estimatedHours: Number(data.estimatedHours) || 0,
                ...(data.leadId && { leadId: data.leadId }),
                ...(!isEdit && { projectId }),
            };

            const json = isEdit
                ? await apiFetch(`/api/phases/${editData.id}`, { method: "PUT", body: JSON.stringify(payload) })
                : await apiFetch(`/api/phases/create`, { method: "POST", body: JSON.stringify(payload) });

            onSuccess?.(json.data);
            toast.success({
                title: isEdit ? "Phase updated" : "Phase added",
                message: isEdit
                    ? `"${data.name}" has been updated.`
                    : `"${data.name}" has been added to the plan.`,
            });
            onClose();
        } catch (e) {
            toast.error({ title: isEdit ? "Update failed" : "Failed to add phase", message: e.message });
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[520px] mx-4 z-10">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#E7EBF2]">
                    <h2 className="text-[16px] font-bold text-[#1B2330]">{isEdit ? "Edit Phase" : "Add Phase"}</h2>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B5] hover:bg-[#F7F9FC] hover:text-[#1B2330] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">

                    <Field label="Phase name" error={errors.name?.message} required>
                        <Inp {...register("name")} placeholder="e.g. UAT & launch" error={errors.name} />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Start date" error={errors.startDate?.message} required>
                            <Inp type="date" {...register("startDate")} error={errors.startDate} />
                        </Field>
                        <Field label="Due date" error={errors.dueDate?.message} required>
                            <Inp type="date" {...register("dueDate")} error={errors.dueDate} />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Priority">
                            <select {...register("priority")}
                                className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] outline-none focus:border-[#3C80F5]">
                                {PRIORITY_OPTS.map(o => (
                                    <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</option>
                                ))}
                            </select>
                        </Field>
                        <Field label="Estimated hours" error={errors.estimatedHours?.message} required>
                            <Inp type="number" min="0" step="1" {...register("estimatedHours")} error={errors.estimatedHours} placeholder="e.g. 40" />
                        </Field>
                    </div>

                    <Field label="Phase lead">
                        <select {...register("leadId")} disabled={teamLoading}
                            className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] outline-none focus:border-[#3C80F5] disabled:opacity-60">
                            <option value="">{teamLoading ? "Loading team..." : "Unassigned"}</option>
                            {teamOptions.map(t => (
                                <option key={t.id} value={t.id}>{t.name}{t.role ? ` · ${t.role}` : ""}</option>
                            ))}
                        </select>
                    </Field>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-60">
                            {loading && <Loader2 size={13} className="animate-spin" />}
                            {isEdit ? "Save changes" : "Add Phase"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}