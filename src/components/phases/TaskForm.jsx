"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "../ui/Toast";
import { apiFetch } from "@/lib/api";

const schema = z.object({
    title:      z.string().min(1, "Task title is required"),
    priority:   z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    startDate:  z.string().min(1, "Start date is required"),
    dueDate:    z.string().min(1, "Due date is required"),
    assigneeId: z.string().optional(),
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

function toISOStart(d) { return new Date(`${d}T00:00:00.000Z`).toISOString(); }
function toISOEnd(d)   { return new Date(`${d}T23:59:59.000Z`).toISOString(); }

/**
 * projectId's "phaseId" and optional "subPhaseId" scope where the task is created.
 * If subPhaseId is passed, the task is nested under that sub-phase; otherwise it's
 * an independent, top-level task on the phase.
 */
export default function TaskForm({ phaseId, subPhaseId = null, teamOptions = [], onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: { title: "", priority: "MEDIUM", startDate: "", dueDate: "", assigneeId: "" },
    });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const payload = {
                title:      data.title,
                priority:   data.priority,
                status:     "TO_DO",
                startDate:  toISOStart(data.startDate),
                dueDate:    toISOEnd(data.dueDate),
                phaseId,
                ...(subPhaseId && { subPhaseId }),
                ...(data.assigneeId && { assigneeId: data.assigneeId }),
            };

            // NOTE: creation endpoint assumed as /api/phases/task/create, following the
            // /api/phases/create and /api/phases/sub-phase/create pattern. Update this path
            // if the backend uses a different route.
            const json = await apiFetch(`/api/phases/task/create`, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            onSuccess?.(json.data);
            toast.success({ title: "Task added", message: `"${data.title}" has been added.` });
            onClose();
        } catch (e) {
            toast.error({ title: "Failed to add task", message: e.message });
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] mx-4 z-10">

                <div className="flex items-center justify-between px-6 py-5 border-b border-[#E7EBF2]">
                    <h2 className="text-[16px] font-bold text-[#1B2330]">
                        {subPhaseId ? "Add Sub-phase Task" : "Add Task"}
                    </h2>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B5] hover:bg-[#F7F9FC] hover:text-[#1B2330] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
                    <Field label="Task title" error={errors.title?.message} required>
                        <Inp {...register("title")} placeholder="e.g. Define unified data schema" error={errors.title} />
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
                        <Field label="Assignee">
                            <select {...register("assigneeId")}
                                className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] outline-none focus:border-[#3C80F5]">
                                <option value="">Unassigned</option>
                                {teamOptions.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}{t.role ? ` · ${t.role}` : ""}</option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-60">
                            {loading && <Loader2 size={13} className="animate-spin" />}
                            Add Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}