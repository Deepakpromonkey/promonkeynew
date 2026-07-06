
"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, AlertCircle, Search, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { ClientTable } from "@/components/clients/ClientTable";
import ClientForm from "@/components/clients/ClientForm";

export default function ClientsPage() {
    const [clients,     setClients]     = useState([]);
    const [pagination,  setPagination]  = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState("");
    const [showForm,    setShowForm]    = useState(false);
    const [editData,    setEditData]    = useState(null);
    const [page,        setPage]        = useState(1);
    const [search,      setSearch]      = useState("");
    const [searchInput, setSearchInput] = useState("");

    const fetchClients = useCallback(async () => {
        setLoading(true); setError("");
        try {
            const params = new URLSearchParams({ page, limit: 10 });
            if (search) params.set("search", search);
            const json = await apiFetch(`/api/clients?${params}`);
            setClients(json.data ?? []);
            setPagination(json.pagination ?? null);
        } catch (e) {
            setError(e.message);
            toast.error({ title: "Failed to load clients", message: e.message });
        } finally { setLoading(false); }
    }, [page, search]);

    useEffect(() => { fetchClients(); }, [fetchClients]);

    const handleSearch = (e) => { e.preventDefault(); setPage(1); setSearch(searchInput.trim()); };
    const clearSearch  = () => { setSearchInput(""); setSearch(""); setPage(1); };

    const handleDelete = async (client) => {
        await apiFetch(`/api/clients/${client.id}`, { method: "DELETE" });
        toast.success({ title: "Client removed", message: `${client.companyName} has been deleted.` });
        fetchClients();
    };

    return (
        <div className="max-w-[1200px] mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-[22px] font-black text-[#1B2330] tracking-[-0.3px]">Clients</h1>
                    <p className="text-[13px] text-[#69788C] mt-0.5">Active accounts, delivery history and growth opportunities.</p>
                </div>
                <button onClick={() => { setEditData(null); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity shadow-sm shadow-[#3C80F5]/25">
                    <Plus size={15} /> Add client
                </button>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-4 flex items-center gap-2">
                <div className="relative flex-1 max-w-[380px]">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B5] pointer-events-none" />
                    <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                        placeholder="Search by company name, contact..."
                        className="w-full h-10 pl-9 pr-9 rounded-xl border border-[#E7EBF2] bg-white text-[13px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15 transition-colors" />
                    {searchInput && (
                        <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B5] hover:text-[#1B2330]">
                            <X size={13} />
                        </button>
                    )}
                </div>
                <button type="submit" className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-[#3C80F5] hover:bg-[#2563EB] transition-colors">
                    Search
                </button>
            </form>

            {loading && (
                <div className="flex items-center justify-center py-20 gap-3 text-[#94A3B5]">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-[13px]">Loading clients...</span>
                </div>
            )}
            {!loading && error && (
                <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-[13px] font-medium">{error}</p>
                    <button onClick={fetchClients} className="ml-auto text-[12.5px] font-bold underline">Retry</button>
                </div>
            )}
            {!loading && !error && clients.length === 0 && (
                <div className="text-center py-20 text-[#94A3B5]">
                    <p className="text-[14px] font-semibold">No clients found</p>
                    <p className="text-[12.5px] mt-1">{search ? `No results for "${search}"` : `Click "Add client" to get started.`}</p>
                </div>
            )}
            {!loading && !error && clients.length > 0 && (
                <ClientTable data={clients} pagination={pagination}
                    onPageChange={p => setPage(p)}
                    onEdit={c => { setEditData(c); setShowForm(true); }}
                    onDelete={handleDelete} />
            )}

            {showForm && (
                <ClientForm onClose={() => { setShowForm(false); setEditData(null); }}
                    onSuccess={fetchClients} editData={editData} />
            )}
        </div>
    );
}
