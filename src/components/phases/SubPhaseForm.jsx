"use client";
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "../ui/Toast";
import { apiFetch } from "@/lib/api";

export default function SubPhaseForm({ phaseId, editData, onClose, onSuccess }) {
    const isEdit = !!editData;
    const [name, setName] = useState(editData?.name ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        if (!name.trim()) { setError("Sub-phase name is required"); return; }
        setLoading(true); setError("");
        try {
            const json = isEdit
                ? await apiFetch(`/api/phases/sub-phase/${editData.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ name: name.trim() }),
                  })
                : await apiFetch(`/api/phases/sub-phase/create`, {
                    method: "POST",
                    body: JSON.stringify({ name: name.trim(), phaseId }),
                  });
            onSuccess?.(json.data);
            toast.success({
                title: isEdit ? "Sub-phase updated" : "Sub-phase added",
                message: `"${name.trim()}" has been ${isEdit ? "renamed" : "added"}.`,
            });
            onClose();
        } catch (e) {
            toast.error({ title: isEdit ? "Failed to update sub-phase" : "Failed to add sub-phase", message: e.message });
        } finally { setLoading(false); }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[420px] mx-4 z-10">
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#E7EBF2]">
                    <h2 className="text-[16px] font-bold text-[#1B2330]">{isEdit ? "Rename Sub-phase" : "Add Sub-phase"}</h2>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B5] hover:bg-[#F7F9FC] hover:text-[#1B2330] transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">
                            Sub-phase name <span className="text-[#DC2626]">*</span>
                        </label>
                        <input
                            autoFocus
                            value={name}
                            onChange={e => { setName(e.target.value); setError(""); }}
                            placeholder="e.g. Audit existing data sources"
                            className="w-full h-10 px-3.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15"
                        />
                        {error && <p className="text-[11px] text-[#DC2626] mt-1 font-medium">{error}</p>}
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-60">
                            {loading && <Loader2 size={13} className="animate-spin" />}
                            {isEdit ? "Save Changes" : "Add Sub-phase"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}