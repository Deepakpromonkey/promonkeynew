"use client";
import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Search, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "../ui/Toast";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
    subject:    z.string().optional(),
    details:    z.string().optional(),
    priority:   z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    status:     z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
    assigneeId: z.string().optional(),
}).refine(
    (data) => data.subject !== undefined || data.status !== undefined,
    { message: "Subject is required" }
);

const PRIORITY_OPTS = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const STATUS_OPTS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const STATUS_LABELS = { OPEN: "Open", IN_PROGRESS: "In progress", RESOLVED: "Resolved", CLOSED: "Closed" };

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

export default function TicketForm({ projectId, onClose, onSuccess, editData = null }) {
    const { user }      = useAuth();
    const isAdmin       = user?.role?.toLowerCase() === "admin";
    const isEdit        = !!editData;
    const effectiveProjectId = projectId ?? editData?.projectId;

    const [loading,      setLoading]      = useState(false);
    const [teamOptions,  setTeamOptions]  = useState([]);
    const [teamLoading,  setTeamLoading]  = useState(false);
    const [assigneeOpen, setAssigneeOpen] = useState(false);
    const [assigneeQ,    setAssigneeQ]    = useState("");
    const [assigneeId,   setAssigneeId]   = useState(editData?.assigneeId ?? "");
    const [assigneeName, setAssigneeName] = useState(editData?.assignee?.legalName ?? "");

    const dropdownRef = useRef(null);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            subject:  editData?.subject  ?? "",
            details:  editData?.details  ?? "",
            priority: editData?.priority ?? "MEDIUM",
            status:   editData?.status   ?? "OPEN",
        },
    });

    /* load project team for assignee dropdown (admin only) */
    useEffect(() => {
        if (!isAdmin || !effectiveProjectId) return;
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

                setTeamOptions(deduped);
            } catch (e) {
                toast.error({ title: "Failed to load team", message: e.message });
            } finally { setTeamLoading(false); }
        }
        loadTeam();
    }, [isAdmin, effectiveProjectId]);

    /* Close dropdown when clicking outside */
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setAssigneeOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtTeam = teamOptions.filter(e =>
        (e.legalName ?? "").toLowerCase().includes(assigneeQ.toLowerCase())
    );

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            if (isEdit) {
                // PUT /api/tickets/:id — status, priority, assigneeId are the only editable fields.
                await apiFetch(`/api/tickets/${editData.id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        status:     data.status,
                        priority:   data.priority,
                        ...(assigneeId && { assigneeId }),
                    }),
                });
                toast.success({ title: "Ticket updated", message: "Ticket has been updated." });
            } else {
                const body = {
                    subject:  data.subject,
                    details:  data.details,
                    priority: data.priority,
                    ...(projectId && { projectId }),
                    ...(isAdmin && assigneeId && { assigneeId }),
                };
                await apiFetch("/api/tickets/create", {
                    method: "POST",
                    body: JSON.stringify(body),
                });
                toast.success({ title: "Ticket raised", message: `"${data.subject}" has been created.` });
            }
            onSuccess?.();
            onClose();
        } catch (e) {
            toast.error({ title: isEdit ? "Update failed" : "Failed to raise ticket", message: e.message });
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[520px] mx-4 z-10 max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#E7EBF2] flex-shrink-0">
                    <h2 className="text-[16px] font-bold text-[#1B2330]">{isEdit ? "Update Ticket" : "Raise a Ticket"}</h2>
                    <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B5] hover:bg-[#F7F9FC] hover:text-[#1B2330] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4 overflow-y-auto custom-scrollbar">

                    {!isEdit && (
                        <Field label="Subject" error={errors.subject?.message} required>
                            <Inp {...register("subject")} placeholder="e.g. Delivery date not updating on 3 orders" error={errors.subject} />
                        </Field>
                    )}

                    {!isEdit && (
                        <Field label="Details">
                            <textarea {...register("details")} rows={4}
                                placeholder="Describe the issue in detail..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none resize-none focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15" />
                        </Field>
                    )}

                    {isEdit && (
                        <div className="px-3.5 py-2.5 rounded-xl bg-[#F7F9FC] border border-[#E7EBF2]">
                            <p className="text-[11px] font-bold text-[#94A3B5] tracking-wide mb-0.5">SUBJECT</p>
                            <p className="text-[13.5px] font-semibold text-[#1B2330]">{editData.subject}</p>
                        </div>
                    )}

                    <div className={cn("grid gap-4", isEdit ? "grid-cols-2" : "grid-cols-1")}>
                        {isEdit && (
                            <Field label="Status">
                                <div className="relative">
                                    <select {...register("status")}
                                        className="w-full h-10 px-3.5 pr-10 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] outline-none appearance-none focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15">
                                        {STATUS_OPTS.map(o => (
                                            <option key={o} value={o}>{STATUS_LABELS[o]}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B5] pointer-events-none" />
                                </div>
                            </Field>
                        )}

                        <Field label="Priority">
                            <div className="relative">
                                <select {...register("priority")}
                                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13px] text-[#1B2330] outline-none appearance-none focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15">
                                    {PRIORITY_OPTS.map(o => (
                                        <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</option>
                                    ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#94A3B5] pointer-events-none" />
                            </div>
                        </Field>
                    </div>

                    {/* Assignee — admin only */}
                    {isAdmin && (
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-[12px] font-semibold text-[#1B2330] mb-1.5">Assignee</label>
                            <button type="button" onClick={() => setAssigneeOpen(o => !o)} disabled={teamLoading}
                                className={cn(
                                    "w-full h-10 px-3.5 rounded-xl border bg-[#F7F9FC] text-[13px] text-left flex items-center justify-between outline-none transition-colors disabled:opacity-60",
                                    assigneeOpen ? "border-[#3C80F5] ring-2 ring-[#3C80F5]/15" : "border-[#E7EBF2]"
                                )}>
                                <span className={assigneeName ? "text-[#1B2330]" : "text-[#94A3B5]"}>
                                    {teamLoading ? "Loading team..." : (assigneeName || "Select assignee")}
                                </span>
                                <Search size={14} className="text-[#94A3B5]" />
                            </button>
                            
                            {assigneeOpen && (
                                <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white border border-[#E7EBF2] rounded-xl shadow-xl z-50 overflow-hidden flex flex-col">
                                    <div className="p-2 border-b border-[#EEF1F6] bg-white">
                                        <div className="relative flex items-center">
                                            <input value={assigneeQ} onChange={e => setAssigneeQ(e.target.value)}
                                                placeholder="Search team..." autoFocus
                                                className="w-full h-8 pl-8 pr-3 rounded-lg border border-[#E7EBF2] bg-[#F7F9FC] text-[12.5px] outline-none focus:border-[#3C80F5]" />
                                            <Search size={12} className="absolute left-2.5 text-[#94A3B5]" />
                                        </div>
                                    </div>
                                    <div className="max-h-[160px] overflow-y-auto bg-white">
                                        <button type="button" onClick={() => { setAssigneeId(""); setAssigneeName(""); setAssigneeOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-[13px] text-[#94A3B5] hover:bg-[#F7F9FC]">
                                            Unassigned
                                        </button>
                                        {filtTeam.length === 0 ? (
                                            <div className="px-4 py-3 text-[12px] text-[#94A3B5] text-center">No results found</div>
                                        ) : (
                                            filtTeam.map(emp => (
                                                <button key={emp.id} type="button"
                                                    onClick={() => { setAssigneeId(emp.id); setAssigneeName(emp.legalName); setAssigneeOpen(false); setAssigneeQ(""); }}
                                                    className={cn("w-full text-left px-4 py-2.5 text-[13px] transition-colors flex flex-col gap-0.5",
                                                        emp.id === assigneeId ? "bg-[#EEF3FE] text-[#3C80F5] font-semibold" : "text-[#1B2330] hover:bg-[#F7F9FC]"
                                                    )}>
                                                    <span>{emp.legalName}</span>
                                                    <span className="text-[#94A3B5] text-[11px] font-normal">{emp.designation || "Employee"}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E7EBF2] flex-shrink-0">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 rounded-xl text-[13px] font-semibold text-[#69788C] hover:bg-[#F7F9FC] transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-60">
                            {loading && <Loader2 size={13} className="animate-spin" />}
                            {isEdit ? "Update" : "Raise Ticket"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}