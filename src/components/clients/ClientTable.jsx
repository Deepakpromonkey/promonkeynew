"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Eye, Pencil, Trash2, Loader2 } from "lucide-react";
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

const COLORS = [
    "from-[#3C80F5] to-[#763CF6]",
    "from-[#E05A00] to-[#E08600]",
    "from-[#16A34A] to-[#3C80F5]",
    "from-[#DC2626] to-[#E08600]",
    "from-[#763CF6] to-[#3C80F5]",
    "from-[#0891B2] to-[#3C80F5]",
];

function getDirectImageUrl(url) {
    if (!url) return null;
    if (url.includes("drive.google.com/file/d/")) {
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return `https://drive.google.com/uc?export=view&id=${match[1]}`;
        }
    }
    return url;
}

function ClientAvatar({ name, logoUrl }) {
    const [imgFailed, setImgFailed] = useState(false);
    const directUrl = getDirectImageUrl(logoUrl);
    
    const initials = (name ?? "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    const color = COLORS[(name?.charCodeAt(0) ?? 0) % COLORS.length];

    if (directUrl && !imgFailed) {
        return (
            <div className="w-9 h-9 rounded-xl border border-[#E7EBF2] bg-white flex items-center justify-center overflow-hidden shrink-0">
                <img 
                    src={directUrl} 
                    alt={name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-1" 
                    onError={() => setImgFailed(true)} 
                />
            </div>
        );
    }

    return (
        <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-[12px] font-bold shrink-0", color)}>
            {initials}
        </div>
    );
}

export function ClientTable({ data, pagination, onPageChange, onEdit, onDelete }) {
    const router = useRouter();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const columns = useMemo(() => [
        {
            accessorKey: "companyName",
            header: "Client",
            cell: ({ row }) => {
                const c = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <ClientAvatar name={c.companyName} logoUrl={c.logoUrl} />
                        <div>
                            <p className="text-[13.5px] font-semibold text-[#1B2330]">{c.companyName}</p>
                            <p className="text-[11.5px] text-[#94A3B5]">
                                {c.clientSince ? `Since ${new Date(c.clientSince).getFullYear()}` : c.createdAt ? `Since ${new Date(c.createdAt).getFullYear()}` : ""}
                                {c.country ? ` · ${c.country}` : ""}
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "contactName",
            header: "Primary Contact",
            cell: ({ row }) => {
                const c = row.original;
                return (
                    <div>
                        <p className="text-[13px] text-[#1B2330]">{c.contactName || "—"}</p>
                        <p className="text-[11.5px] text-[#94A3B5]">{c.contactEmail || ""}</p>
                    </div>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status ?? "PROSPECT";
                const styles = {
                    ACTIVE:   "bg-[#EAF7EE] text-[#16A34A]",
                    PROSPECT: "bg-[#EEF3FE] text-[#3C80F5]",
                    INACTIVE: "bg-[#EEF1F6] text-[#69788C]",
                    CHURNED:  "bg-[#FCEDED] text-[#DC2626]",
                };
                return (
                    <span className={cn("inline-flex px-2.5 py-1 rounded-full text-[11.5px] font-semibold", styles[status] ?? styles.PROSPECT)}>
                        {status}
                    </span>
                );
            },
        },
        {
            accessorKey: "website",
            header: "Website",
            cell: ({ row }) => {
                const url = row.original.website;
                if (!url) return <span className="text-[13px] text-[#94A3B5]">—</span>;
                return (
                    <a href={url} target="_blank" rel="noopener noreferrer"
                        className="text-[12.5px] font-semibold text-[#3C80F5] hover:underline truncate max-w-[150px] block">
                        {url.replace(/^https?:\/\//, "")}
                    </a>
                );
            },
        },
        {
            id: "actions",
            header: "",
            enableSorting: false,
            enableColumnFilter: false,
            cell: ({ row }) => {
                const c = row.original;
                return (
                    <div className="flex justify-end">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F7F9FC] transition-colors text-[#94A3B5] hover:text-[#1B2330]">
                                    <MoreVertical size={15} />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl bg-white border-[#E7EBF2]">
                                <DropdownMenuItem onClick={() => router.push(`/promonkey/clients/${c.id}`)}
                                    className="gap-2 text-[13px] cursor-pointer">
                                    <Eye size={13} /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEdit(c)}
                                    className="gap-2 text-[13px] cursor-pointer">
                                    <Pencil size={13} /> Edit
                                </DropdownMenuItem>
                                <div className="h-px bg-[#E7EBF2] my-1" />
                                <DropdownMenuItem onClick={() => { setDeleteError(""); setDeleteTarget(c); }}
                                    className="gap-2 text-[13px] cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
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
        setDeleting(true); setDeleteError("");
        try {
            await onDelete(deleteTarget);
            setDeleteTarget(null);
        } catch (e) { setDeleteError(e.message); }
        finally { setDeleting(false); }
    }

    return (
        <>
            <DataTable columns={columns} data={data} searchPlaceholder="Search clients..."
                serverPagination={pagination} onPageChange={onPageChange} />

            <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) { setDeleteTarget(null); setDeleteError(""); } }}>
                <AlertDialogContent className="rounded-2xl bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Client</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteTarget?.companyName}"</span>? This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {deleteError && <p className="text-xs text-destructive font-medium px-1 -mt-2">{deleteError}</p>}
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl cursor-pointer" disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={e => { e.preventDefault(); confirmDelete(); }} disabled={deleting}
                            className="rounded-xl bg-destructive hover:bg-red-700 cursor-pointer">
                            {deleting ? <span className="flex items-center gap-2"><Loader2 size={13} className="animate-spin" />Deleting...</span> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}