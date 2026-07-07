/* eslint-disable @next/next/no-img-element */
"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from "../Datatable";
import { cn } from "@/lib/utils";

function initials(name = "") {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function getDirectImageUrl(url) {
    if (!url) return null;
    if (url.includes("drive.google.com/file/d/")) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://lh3.googleusercontent.com/d/${match[1]}`;
        }
    }
    return url;
}

function Avatar({ name, photoUrl }) {
    const directUrl = getDirectImageUrl(photoUrl);
    const [imgFailed, setImgFailed] = useState(false);

    const colors = [
        "from-[#3C80F5] to-[#763CF6]",
        "from-[#16A34A] to-[#3C80F5]",
        "from-[#E08600] to-[#763CF6]",
        "from-[#763CF6] to-[#3C80F5]",
        "from-[#DC2626] to-[#E08600]",
    ];
    const idx = name?.charCodeAt(0) % colors.length ?? 0;

    return (
        <div className="relative w-9 h-9 shrink-0">
            {directUrl && !imgFailed ? (
                <img
                    src={directUrl}
                    alt={name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover border border-[#E7EBF2]"
                    onError={() => setImgFailed(true)}
                />
            ) : (
                <div 
                    className={cn(
                        "w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-[12px] font-bold",
                        colors[idx]
                    )}
                >
                    {initials(name)}
                </div>
            )}
        </div>
    );
}

export function EmployeeTable({ data, pagination, onPageChange, onEdit, onDelete }) {
    const router = useRouter();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const columns = useMemo(() => [
        {
            accessorKey: "legalName",
            header: "Name",
            cell: ({ row }) => {
                const e = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <Avatar name={e.legalName} photoUrl={e.profilePhotoUrl} />
                        <div>
                            <p className="text-[13.5px] font-semibold text-[#1B2330]">{e.legalName}</p>
                            <p className="text-[11.5px] text-[#94A3B5]">{e.designation}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "user.email",
            header: "Email",
            cell: ({ row }) => (
                <span className="text-[13px] text-[#69788C]">{row.original.user?.email}</span>
            ),
        },
        {
            accessorKey: "designation",
            header: "Role",
            cell: ({ row }) => {
                const e = row.original;
                return (
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-[#EEF3FE] text-[11.5px] font-semibold text-[#3C80F5]">
                        {e.designation}
                    </span>
                );
            },
        },
        {
            accessorKey: "user.isActive",
            header: "Status",
            cell: ({ row }) => {
                const active = row.original.user?.isActive;
                return (
                    <span className={cn(
                        "inline-flex px-2.5 py-1 rounded-full text-[11.5px] font-semibold",
                        active
                            ? "bg-[#EAF7EE] text-[#16A34A]"
                            : "bg-[#EEF1F6] text-[#69788C]"
                    )}>
                        {active ? "Active" : "Inactive"}
                    </span>
                );
            },
        },
        {
            accessorKey: "dateOfJoining",
            header: "Joined",
            cell: ({ row }) => {
                const d = row.original.dateOfJoining;
                if (!d) return <span className="text-[13px] text-[#94A3B5]">—</span>;
                return (
                    <span className="text-[13px] text-[#69788C]">
                        {new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                );
            },
        },
        {
            id: "actions",
            header: "",
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ row }) => {
                const e = row.original;
                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F7F9FC] transition-colors text-[#94A3B5] hover:text-[#1B2330]">
                                    <MoreVertical size={15} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl bg-white border-[#E7EBF2]">
                                <DropdownMenuItem
                                    onClick={() => router.push(`/promonkey/employees/${e.id}`)}
                                    className="gap-2 text-[13px] cursor-pointer"
                                >
                                    <Eye size={13} /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onEdit(e)}
                                    className="gap-2 text-[13px] cursor-pointer"
                                >
                                    <Pencil size={13} /> Edit
                                </DropdownMenuItem>
                                <div className="h-px bg-[#E7EBF2] my-1" />
                                <DropdownMenuItem
                                    onClick={() => { setDeleteError(""); setDeleteTarget(e); }}
                                    className="gap-2 text-[13px] cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                                >
                                    <Trash2 size={13} /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ], [onEdit, router]);

    async function confirmDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        setDeleteError("");
        try {
            await onDelete(deleteTarget);
            setDeleteTarget(null);
        } catch (e) {
            setDeleteError(e.message);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <>
            <DataTable
                columns={columns}
                data={data}
                searchPlaceholder="Search employees..."
                serverPagination={pagination}
                onPageChange={onPageChange}
            />

            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(o) => { if (!o) { setDeleteTarget(null); setDeleteError(""); } }}
            >
                <AlertDialogContent className="rounded-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-foreground">"{deleteTarget?.legalName}"</span>?
                            This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && (
                        <p className="text-xs text-destructive font-medium px-1 -mt-2">{deleteError}</p>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl cursor-pointer" disabled={deleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmDelete(); }}
                            disabled={deleting}
                            className="rounded-xl bg-destructive hover:bg-red-700 cursor-pointer"
                        >
                            {deleting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={13} className="animate-spin" /> Deleting...
                                </span>
                            ) : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}