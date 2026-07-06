"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Users, Lock, Pencil, Trash2, Loader2 } from "lucide-react";
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

export default function RoleCard({ role, onEdit, onDelete }) {
    const [open,    setOpen]    = useState(false);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    async function confirmDelete(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await onDelete(role);
            setOpen(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    /* Pass both roleId (for API) and role name (for UI display) */
    const permissionsHref = `/promonkey/permissions?roleId=${encodeURIComponent(role.id)}&role=${encodeURIComponent(role.name)}`;

    return (
        <>
            <div className="bg-white border border-[#E7EBF2] rounded-2xl p-5 shadow-[0_1px_2px_rgba(27,35,48,.06),0_4px_16px_rgba(27,35,48,.06)] flex flex-col gap-3 hover:shadow-[0_4px_24px_rgba(27,35,48,.10)] transition-shadow">

                {/* Top row: name + action icons */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h3 className="text-[15px] font-bold text-[#1B2330]">{role.name}</h3>
                        <p className="text-[12.5px] text-[#69788C] mt-1 leading-snug">{role.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                        <button
                            onClick={() => onEdit(role)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#69788C] hover:bg-[#EEF3FE] hover:text-[#3C80F5] transition-colors"
                            title="Edit role"
                        >
                            <Pencil size={13} />
                        </button>
                        <button
                            onClick={() => { setError(""); setOpen(true); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#69788C] hover:bg-[#FCEDED] hover:text-[#DC2626] transition-colors"
                            title="Delete role"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF1F6] text-[11.5px] font-semibold text-[#69788C]">
                        <Lock size={10} />
                        {role.permissions ?? 0} permissions
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF1F6] text-[11.5px] font-semibold text-[#69788C]">
                        <Users size={10} />
                        {role.members ?? 0} {(role.members ?? 0) === 1 ? "member" : "members"}
                    </span>
                    {role.inherits && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF3FE] text-[11.5px] font-semibold text-[#3C80F5]">
                            inherits {role.inherits}
                        </span>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[#EEF1F6]">
                    <span className="text-[11.5px] text-[#94A3B5] font-medium">
                        {role.type === "system" ? "System role" : "Custom role"}
                    </span>
                    <Link
                        href={permissionsHref}
                        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#3C80F5] hover:text-[#2563EB] transition-colors"
                    >
                        Edit permissions <ArrowRight size={13} />
                    </Link>
                </div>
            </div>

            {/* Delete confirm dialog */}
            <AlertDialog open={open} onOpenChange={(o) => { if (!o) { setOpen(false); setError(""); } }}>
                <AlertDialogContent className="rounded-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Role</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-foreground">"{role.name}"</span>?
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