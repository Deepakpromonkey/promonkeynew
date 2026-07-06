"use client";
import { useState } from "react";
import * as Icons from "lucide-react";
import { ListChecks, Pencil, Trash2, Loader2, ChevronDown } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function TemplateCard({ template, onEdit, onDelete }) {
    const [open,       setOpen]       = useState(false);
    const [loading,    setLoading]    = useState(false);
    const [error,      setError]      = useState("");
    const [expanded,   setExpanded]   = useState(false);

    const fields = template.page2Fields ?? [];
    const IconComp = Icons[template.icon] || Icons.LayoutTemplate;

    async function confirmDelete(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await onDelete(template);
            setOpen(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="bg-white border border-[#E7EBF2] rounded-2xl p-5 shadow-[0_1px_2px_rgba(27,35,48,.06),0_4px_16px_rgba(27,35,48,.06)] flex flex-col gap-3 hover:shadow-[0_4px_24px_rgba(27,35,48,.10)] transition-shadow">

                {/* Top row: icon + name + action icons */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 shrink-0 rounded-xl bg-[#EEF3FE] flex items-center justify-center text-[#3C80F5]">
                            <IconComp size={17} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-[15px] font-bold text-[#1B2330] truncate">{template.name}</h3>
                            <p className="text-[12.5px] text-[#69788C] mt-0.5">{template.icon}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        <button
                            onClick={() => onEdit(template)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#69788C] hover:bg-[#EEF3FE] hover:text-[#3C80F5] transition-colors"
                            title="Edit template"
                        >
                            <Pencil size={13} />
                        </button>
                        <button
                            onClick={() => { setError(""); setOpen(true); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#69788C] hover:bg-[#FCEDED] hover:text-[#DC2626] transition-colors"
                            title="Delete template"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF1F6] text-[11.5px] font-semibold text-[#69788C]">
                        <ListChecks size={10} />
                        {fields.length} {fields.length === 1 ? "field" : "fields"}
                    </span>
                </div>

                {/* Fields preview (collapsible) */}
                {fields.length > 0 && (
                    <div className="border-t border-[#EEF1F6] pt-2.5">
                        <button
                            onClick={() => setExpanded(v => !v)}
                            className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#69788C] hover:text-[#1B2330] transition-colors"
                        >
                            <ChevronDown size={12} className={cn("transition-transform", expanded && "rotate-180")} />
                            {expanded ? "Hide" : "Show"} page 2 fields
                        </button>
                        {expanded && (
                            <ul className="mt-2.5 space-y-2">
                                {fields.map((f, i) => (
                                    <li key={i} className="rounded-lg bg-[#F7F9FC] px-3 py-2">
                                        <p className="text-[12.5px] font-semibold text-[#1B2330]">{f.label}</p>
                                        <p className="text-[11.5px] text-[#94A3B5] mt-0.5 truncate">{f.placeholder}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Delete confirm dialog */}
            <AlertDialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); setError(""); } }}>
                <AlertDialogContent className="rounded-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Template</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-foreground">{template.name}</span>?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {error && (
                        <p className="text-xs text-destructive font-medium px-1 -mt-2">{error}</p>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl cursor-pointer" disabled={loading}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={loading}
                            className="rounded-xl bg-destructive hover:bg-red-700 cursor-pointer"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={13} className="animate-spin" />
                                    Deleting...
                                </span>
                            ) : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}