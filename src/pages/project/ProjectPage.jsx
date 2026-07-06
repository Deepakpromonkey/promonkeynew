"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, AlertCircle, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import ProjectCard from "@/components/projects/ProjectCard";
import { cn } from "@/lib/utils";

const STATUS_OPTS   = ["", "ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"];
const PRIORITY_OPTS = ["", "URGENT", "HIGH", "MED", "LOW"];
const HEALTH_OPTS   = ["", "ON_TRACK", "AT_RISK", "DELAYED", "BLOCKED"];

function labelOf(val) {
    if (!val) return val === "" ? "All statuses" : val;
    return val.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function FilterSelect({ value, onChange, options, placeholder }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="h-10 pl-4 pr-8 rounded-xl border border-[#E7EBF2] bg-white text-[13px] font-semibold text-[#1B2330] outline-none focus:border-[#3C80F5] appearance-none cursor-pointer"
            >
                <option value="">{placeholder}</option>
                {options.filter(o => o !== "").map(o => (
                    <option key={o} value={o}>{labelOf(o)}</option>
                ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#94A3B5]">▾</span>
        </div>
    );
}

function Pagination({ pagination, page, setPage }) {
    if (!pagination || pagination.totalPages <= 1) return null;
    const { totalPages, totalRecords, limit, currentPage } = pagination;
    const from = (currentPage - 1) * limit + 1;
    const to   = Math.min(currentPage * limit, totalRecords);

    return (
        <div className="flex items-center justify-between mt-6 px-1">
            <p className="text-[12.5px] text-[#69788C]">
                Showing <span className="font-semibold text-[#1B2330]">{from}</span> to{" "}
                <span className="font-semibold text-[#1B2330]">{to}</span> of{" "}
                <span className="font-semibold text-[#1B2330]">{totalRecords}</span> projects
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={!pagination.hasPrevPage}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg border border-[#E7EBF2] text-[#69788C] transition-colors",
                        pagination.hasPrevPage ? "hover:bg-[#F7F9FC] hover:text-[#1B2330]" : "opacity-40 cursor-not-allowed"
                    )}
                >
                    <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                        className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-semibold border transition-colors",
                            page === i + 1
                                ? "bg-[#3C80F5] border-[#3C80F5] text-white"
                                : "border-transparent text-[#69788C] hover:bg-[#F7F9FC] hover:text-[#1B2330]"
                        )}
                    >
                        {i + 1}
                    </button>
                ))}
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!pagination.hasNextPage}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-lg border border-[#E7EBF2] text-[#69788C] transition-colors",
                        pagination.hasNextPage ? "hover:bg-[#F7F9FC] hover:text-[#1B2330]" : "opacity-40 cursor-not-allowed"
                    )}
                >
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}

export default function ProjectsPage() {
    const router = useRouter();
    const [projects,    setProjects]    = useState([]);
    const [pagination,  setPagination]  = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState("");
    const [page,        setPage]        = useState(1);
    const [search,      setSearch]      = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [status,      setStatus]      = useState("");
    const [priority,    setPriority]    = useState("");
    const [health,      setHealth]      = useState("");

    const fetchProjects = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const params = new URLSearchParams({ page, limit: 9 });
            if (search)   params.set("search",   search);
            if (status)   params.set("status",   status);
            if (priority) params.set("priority", priority);
            if (health)   params.set("health",   health);
            const json = await apiFetch(`/api/projects?${params}`);
            setProjects(json.data ?? []);
            setPagination(json.pagination ?? null);
        } catch (e) {
            setError(e.message);
            toast.error({ title: "Failed to load projects", message: e.message });
        } finally { setLoading(false); }
    }, [page, search, status, priority, health]);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    
    useEffect(() => { setPage(1); }, [search, status, priority, health]);

    const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput.trim()); };
    const clearSearch  = () => { setSearchInput(""); setSearch(""); };

    const handleDelete = async (project) => {
        await apiFetch(`/api/projects/${project.id}`, { method: "DELETE" });
        toast.success({ title: "Project deleted", message: `"${project.name}" has been removed.` });
        fetchProjects();
    };

    const total = pagination?.totalRecords ?? projects.length;

    return (
        <div className=" mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h1 className="text-[22px] font-black text-[#1B2330] tracking-[-0.3px]">Projects</h1>
                    <p className="text-[13px] text-[#69788C] mt-0.5">
                        {total > 0 ? `${total} of ${pagination?.totalRecords ?? total} projects shown.` : "No projects yet."}
                    </p>
                </div>
                <button
                    onClick={() => router.push('/promonkey/projects/create')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity shadow-sm shadow-[#3C80F5]/25"
                >
                    <Plus size={15} /> New project
                </button>
            </div>

            {/* Filters row */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
                {/* Search */}
                <form onSubmit={handleSearch} className="relative flex-1 min-w-[220px] max-w-[320px]">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B5] pointer-events-none" />
                    <input
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        placeholder="Search by team leader..."
                        className="w-full h-10 pl-9 pr-8 rounded-xl border border-[#E7EBF2] bg-white text-[13px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15 transition-colors"
                    />
                    {searchInput && (
                        <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B5] hover:text-[#1B2330]">
                            <X size={13} />
                        </button>
                    )}
                </form>

                <FilterSelect value={status}   onChange={setStatus}   options={STATUS_OPTS}   placeholder="On-going" />
                <FilterSelect value={priority} onChange={setPriority} options={PRIORITY_OPTS} placeholder="All priorities" />
                <FilterSelect value={health}   onChange={setHealth}   options={HEALTH_OPTS}   placeholder="All health" />
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-24 gap-3 text-[#94A3B5]">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-[13px]">Loading projects...</span>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-[13px] font-medium">{error}</p>
                    <button onClick={fetchProjects} className="ml-auto text-[12.5px] font-bold underline">Retry</button>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && projects.length === 0 && (
                <div className="text-center py-24 text-[#94A3B5]">
                    <p className="text-[14px] font-semibold">No projects found</p>
                    <p className="text-[12.5px] mt-1">
                        {search || status || priority || health
                            ? "Try adjusting your filters."
                            : "Click \"New project\" to create one."}
                    </p>
                </div>
            )}

            {/* Grid */}
            {!loading && !error && projects.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {projects.map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onEdit={(p) => router.push(`/promonkey/projects/${p.id}/edit`)}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                    <Pagination pagination={pagination} page={page} setPage={setPage} />
                </>
            )}
        </div>
    );
}