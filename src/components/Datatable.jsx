"use client";
import { useState } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    Table, TableBody, TableCell,
    TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    ChevronUp, ChevronDown, ChevronsUpDown,
    ChevronLeft, ChevronRight,
    Search, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

function ColumnFilter({ column }) {
    const value = column.getFilterValue() ?? "";
    return (
        <Input
            value={value}
            onChange={(e) => column.setFilterValue(e.target.value)}
            placeholder="Filter..."
            className="h-7 text-xs mt-1.5 rounded-lg bg-muted/50 border-border"
            onClick={(e) => e.stopPropagation()}
        />
    );
}

export function DataTable({
    columns,
    data,
    searchPlaceholder = "Search...",
    serverPagination,
    onPageChange,
}) {
    const [sorting,       setSorting]       = useState([]);
    const [globalFilter,  setGlobalFilter]  = useState("");
    const [columnFilters, setColumnFilters] = useState([]);
    const [showFilters,   setShowFilters]   = useState(false);

    const table = useReactTable({
        data,
        columns,
        state:  { sorting, globalFilter, columnFilters },
        onSortingChange:       setSorting,
        onGlobalFilterChange:  setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel:       getCoreRowModel(),
        getSortedRowModel:     getSortedRowModel(),
        getFilteredRowModel:   getFilteredRowModel(),
    });

    // Derive server pagination parameters safely
    const currentPage  = serverPagination?.page ?? 1;
    const limit        = serverPagination?.limit ?? 10;
    const pageCount    = serverPagination?.totalPages ?? 1;
    const totalResults = serverPagination?.total ?? data.length;

    const from = totalResults === 0 ? 0 : (currentPage - 1) * limit + 1;
    const to   = Math.min(currentPage * limit, totalResults);

    return (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-border">
                <div className="relative w-60">
                    <Search
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                    />
                    <Input
                        placeholder={searchPlaceholder}
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        className="pl-9 h-9 text-sm rounded-lg bg-muted/50"
                    />
                </div>
                <button
                    onClick={() => setShowFilters((f) => !f)}
                    className={cn(
                        "flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium border transition-colors",
                        showFilters
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <Filter size={13} />
                    Column Filters
                </button>
            </div>

            {/* Table */}
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                        <TableRow
                            key={hg.id}
                            className="hover:bg-transparent border-b border-border"
                        >
                            {hg.headers.map((header) => (
                                <TableHead
                                    key={header.id}
                                    className="px-5 h-11 text-xs font-semibold text-foreground bg-muted/30"
                                >
                                    <div>
                                        {header.isPlaceholder ? null : (
                                            header.column.getCanSort() ? (
                                                <button
                                                    onClick={header.column.getToggleSortingHandler()}
                                                    className="flex items-center gap-1 hover:text-primary transition-colors"
                                                >
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {header.column.getIsSorted() === "asc"
                                                        ? <ChevronUp size={12} />
                                                        : header.column.getIsSorted() === "desc"
                                                        ? <ChevronDown size={12} />
                                                        : <ChevronsUpDown size={12} className="opacity-30" />
                                                    }
                                                </button>
                                            ) : (
                                                flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )
                                            )
                                        )}
                                        {showFilters && header.column.getCanFilter() && (
                                            <ColumnFilter column={header.column} />
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>

                <TableBody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row, i) => (
                            <TableRow
                                key={row.id}
                                className={cn(
                                    "hover:bg-muted/30 transition-colors",
                                    i < table.getRowModel().rows.length - 1
                                        && "border-b border-border/60"
                                )}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id} className="px-5 py-3.5">
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-32 text-center text-sm text-muted-foreground"
                            >
                                No results found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/60 bg-muted/10">
                <p className="text-xs text-muted-foreground">
                    Showing{" "}
                    <span className="font-semibold text-foreground">{from}</span>
                    {" "}to{" "}
                    <span className="font-semibold text-foreground">{to}</span>
                    {" "}of{" "}
                    <span className="font-semibold text-foreground">{totalResults}</span>
                    {" "}results
                </p>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={!serverPagination?.hasPrevPage}
                        className={cn(
                            "w-7 h-7 flex items-center justify-center rounded-md border border-border text-muted-foreground transition-colors",
                            serverPagination?.hasPrevPage
                                ? "hover:bg-muted hover:text-foreground"
                                : "opacity-40 cursor-not-allowed"
                        )}
                    >
                        <ChevronLeft size={13} />
                    </button>

                    {Array.from({ length: pageCount }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => onPageChange(i + 1)}
                            className={cn(
                                "w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium border transition-colors",
                                currentPage === (i + 1)
                                    ? "bg-background border-primary text-primary font-semibold shadow-sm"
                                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={!serverPagination?.hasNextPage}
                        className={cn(
                            "w-7 h-7 flex items-center justify-center rounded-md border border-border text-muted-foreground transition-colors",
                            serverPagination?.hasNextPage
                                ? "hover:bg-muted hover:text-foreground"
                                : "opacity-40 cursor-not-allowed"
                        )}
                    >
                        <ChevronRight size={13} />
                    </button>
                </div>
            </div>

        </div>
    );
}