
"use client";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "../ui/Toast";

const schema = z.object({
    name: z.string().min(1, "Template name is required"),
    icon: z.string().min(1, "Icon is required"),
    page2Fields: z.array(
        z.object({
            label:       z.string().min(1, "Label is required"),
            placeholder: z.string().optional(),
        })
    ).min(1, "Add at least one field"),
});

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

export default function TemplateForm({ onClose, onSuccess, editData = null }) {
    const [loading, setLoading] = useState(false);

    const isEdit = !!editData;

    const { register, control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name:        editData?.name ?? "",
            icon:        editData?.icon ?? "",
            page2Fields: editData?.page2Fields?.length ? editData.page2Fields : [{ label: "", placeholder: "" }],
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "page2Fields" });

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            if (isEdit) {
                await apiFetch(`/api/services/${editData.id}`, {
                    method: "PUT",
                    body: JSON.stringify(data),
                });
                toast.success({ title: "Template updated", message: `"${data.name}" has been updated.` });
            } else {
                await apiFetch("/api/services/create", {
                    method: "POST",
                    body: JSON.stringify(data),
                });
                toast.success({ title: "Template created", message: `"${data.name}" has been added.` });
            }
            onSuccess?.();
            onClose();
        } catch (e) {
            toast.error({ title: isEdit ? "Update failed" : "Creation failed", message: e.message });
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[600px] mx-4 z-10 max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#E7EBF2] shrink-0">
                    <h2 className="text-[16px] font-bold text-[#1B2330]">{isEdit ? "Edit Template" : "Add New Template"}</h2>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B5] hover:bg-[#F7F9FC] hover:text-[#1B2330] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* Name + Icon */}
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Template Name" error={errors.name?.message} required>
                            <Inp {...register("name")} placeholder="e.g. Web App Development" error={errors.name} />
                        </Field>

                        <Field label="Icon" error={errors.icon?.message} required>
                            <Inp {...register("icon")} placeholder="e.g. Monitor" error={errors.icon} />
                        </Field>
                    </div>

                    {/* Dynamic fields */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-[12px] font-semibold text-[#1B2330]">
                                Step 2 Fields <span className="text-[#DC2626]">*</span>
                            </label>
                            <button type="button" onClick={() => append({ label: "", placeholder: "" })}
                                className="flex items-center gap-1.5 text-[12px] font-semibold text-[#3C80F5] hover:text-[#2563EB]">
                                <Plus size={13} /> Add field
                            </button>
                        </div>

                        <div className="space-y-3">
                            {fields.map((field, i) => (
                                <div key={field.id} className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E7EBF2] relative">
                                    {fields.length > 1 && (
                                        <button type="button" onClick={() => remove(i)}
                                            className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-lg text-[#94A3B5] hover:bg-[#FCEDED] hover:text-[#DC2626] transition-colors">
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-2 gap-3 pr-6">
                                        <div>
                                            <p className="text-[11px] font-semibold text-[#94A3B5] mb-1">
                                                Label <span className="text-[#DC2626]">*</span>
                                            </p>
                                            <input
                                                {...register(`page2Fields.${i}.label`)}
                                                placeholder="e.g. Core Features Required"
                                                className={cn(
                                                    "w-full h-9 px-3 rounded-lg border text-[12.5px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none",
                                                    errors.page2Fields?.[i]?.label ? "border-[#DC2626] bg-[#FEF2F2]" : "border-[#E7EBF2] bg-white focus:border-[#3C80F5]"
                                                )}
                                            />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-semibold text-[#94A3B5] mb-1">Placeholder</p>
                                            <input
                                                {...register(`page2Fields.${i}.placeholder`)}
                                                placeholder="e.g. User auth, Stripe payments..."
                                                className="w-full h-9 px-3 rounded-lg border border-[#E7EBF2] bg-white text-[12.5px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none focus:border-[#3C80F5]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors.page2Fields?.message && (
                            <p className="text-[11px] text-[#DC2626] mt-1.5 font-medium">{errors.page2Fields.message}</p>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#E7EBF2] shrink-0">
                    <button type="button" onClick={onClose}
                        className="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors">
                        Cancel
                    </button>
                    <button type="button" onClick={handleSubmit(onSubmit)} disabled={loading}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-60">
                        {loading && <Loader2 size={13} className="animate-spin" />}
                        {isEdit ? "Update Template" : "Create Template"}
                    </button>
                </div>
            </div>
        </div>
    );
}
