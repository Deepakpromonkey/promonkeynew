"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
    name:        z.string().min(1, "Role name is required").min(2, "Must be at least 2 characters"),
    description: z.string().min(1, "Description is required"),
});

export default function RoleForm({ onClose, onSubmit, loading = false, editData = null }) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({ resolver: zodResolver(schema) });

    /* pre-fill when editing */
    useEffect(() => {
        if (editData) {
            reset({ name: editData.name, description: editData.description });
        }
    }, [editData, reset]);

    const isEdit = !!editData;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] mx-4 z-10">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#E7EBF2]">
                    <h2 className="text-[16px] font-bold text-[#1B2330]">
                        {isEdit ? "Edit role" : "Add role"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B5] hover:bg-[#F7F9FC] hover:text-[#1B2330] transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">

                    {/* Role name */}
                    <div>
                        <label className="block text-[12.5px] font-semibold text-[#1B2330] mb-1.5">
                            Role name <span className="text-[#DC2626]">*</span>
                        </label>
                        <input
                            {...register("name")}
                            placeholder="e.g. Senior Developer"
                            disabled={loading}
                            className={cn(
                                "w-full h-10 px-3.5 rounded-xl border text-[13.5px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none transition-colors disabled:opacity-60",
                                errors.name
                                    ? "border-[#DC2626] bg-[#FEF2F2] focus:ring-2 focus:ring-[#DC2626]/20"
                                    : "border-[#E7EBF2] bg-[#F7F9FC] focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15"
                            )}
                        />
                        {errors.name && (
                            <p className="text-[11.5px] text-[#DC2626] mt-1 font-medium">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[12.5px] font-semibold text-[#1B2330] mb-1.5">
                            Description <span className="text-[#DC2626]">*</span>
                        </label>
                        <textarea
                            {...register("description")}
                            rows={3}
                            placeholder="What does this role do?"
                            disabled={loading}
                            className={cn(
                                "w-full px-3.5 py-2.5 rounded-xl border text-[13.5px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none resize-none transition-colors disabled:opacity-60",
                                errors.description
                                    ? "border-[#DC2626] bg-[#FEF2F2] focus:ring-2 focus:ring-[#DC2626]/20"
                                    : "border-[#E7EBF2] bg-[#F7F9FC] focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15"
                            )}
                        />
                        {errors.description && (
                            <p className="text-[11.5px] text-[#DC2626] mt-1 font-medium">{errors.description.message}</p>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors disabled:opacity-60"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
                        >
                            {loading && <Loader2 size={13} className="animate-spin" />}
                            {isEdit ? "Update" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}