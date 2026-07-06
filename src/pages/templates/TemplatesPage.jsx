"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateForm from "@/components/templates/TemplateForm";

export default function TemplatesPage() {
    const [templates,    setTemplates]    = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState("");
    const [showForm,     setShowForm]     = useState(false);
    const [editTemplate, setEditTemplate] = useState(null);

    /* ── Fetch ── */
    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const json = await apiFetch("/api/services");
            setTemplates(json.data ?? []);
        } catch (e) {
            setError(e.message);
            toast.error({ title: "Failed to load templates", message: e.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

    const handleDelete = async (template) => {
        await apiFetch(`/api/services/${template.id}`, { method: "DELETE" });
        toast.success({ title: "Template deleted", message: `"${template.name}" has been removed.` });
        fetchTemplates();
    };

    return (
        <div className="max-w-[1100px] mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-[22px] font-black text-[#1B2330] tracking-[-0.3px]">Templates</h1>
                    <p className="text-[13px] text-[#69788C] mt-0.5">Service templates used when creating a project.</p>
                </div>
                <button
                    onClick={() => { setEditTemplate(null); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity shadow-sm shadow-[#3C80F5]/25"
                >
                    <Plus size={15} />
                    Add template
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20 gap-3 text-[#94A3B5]">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-[13px]">Loading templates...</span>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-[13px] font-medium">{error}</p>
                    <button onClick={fetchTemplates} className="ml-auto text-[12.5px] font-bold underline">
                        Retry
                    </button>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && templates.length === 0 && (
                <div className="text-center py-20 text-[#94A3B5]">
                    <p className="text-[14px] font-semibold">No templates found</p>
                    <p className="text-[12.5px] mt-1">Click "Add template" to create your first one.</p>
                </div>
            )}

            {/* Grid */}
            {!loading && !error && templates.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            onEdit={(t) => { setEditTemplate(t); setShowForm(true); }}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Create / Edit modal */}
            {showForm && (
                <TemplateForm
                    onClose={() => { setShowForm(false); setEditTemplate(null); }}
                    onSuccess={fetchTemplates}
                    editData={editTemplate}
                />
            )}
        </div>
    );
}