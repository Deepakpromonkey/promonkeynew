"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import RoleCard from "@/components/roles/RoleCard";
import RoleForm from "@/components/roles/RoleForm";

export default function RolesPage() {
    const [roles,       setRoles]       = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState("");
    const [showForm,    setShowForm]    = useState(false);
    const [editRole,    setEditRole]    = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    /* ── Fetch ── */
    const fetchRoles = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const json = await apiFetch("/api/roles");
            setRoles(json.data ?? []);
        } catch (e) {
            setError(e.message);
            toast.error({ title: "Failed to load roles", message: e.message });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRoles(); }, [fetchRoles]);

    /* ── Create ── */
    const handleCreate = async (data) => {
        setFormLoading(true);
        try {
            await apiFetch("/api/roles", {
                method: "POST",
                body: JSON.stringify({ name: data.name, description: data.description }),
            });
            toast.success({ title: "Role created", message: `"${data.name}" has been added successfully.` });
            setShowForm(false);
            fetchRoles();
        } catch (e) {
            toast.error({ title: "Failed to create role", message: e.message });
        } finally {
            setFormLoading(false);
        }
    };

    /* ── Update ── */
    const handleUpdate = async (data) => {
        setFormLoading(true);
        try {
            await apiFetch(`/api/roles/${editRole.id}`, {
                method: "PUT",
                body: JSON.stringify({ name: data.name, description: data.description }),
            });
            toast.success({ title: "Role updated", message: `"${data.name}" has been updated.` });
            setEditRole(null);
            setShowForm(false);
            fetchRoles();
        } catch (e) {
            toast.error({ title: "Failed to update role", message: e.message });
        } finally {
            setFormLoading(false);
        }
    };

    /* ── Delete (called from RoleCard, throws on error) ── */
    const handleDelete = async (role) => {
        await apiFetch(`/api/roles/${role.id}`, { method: "DELETE" });
        toast.success({ title: "Role deleted", message: `"${role.name}" has been removed.` });
        fetchRoles();
    };

    return (
        <div className="max-w-[1100px] mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-[22px] font-black text-[#1B2330] tracking-[-0.3px]">Roles</h1>
                    <p className="text-[13px] text-[#69788C] mt-0.5">Role templates with parent inheritance.</p>
                </div>
                <button
                    onClick={() => { setEditRole(null); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity shadow-sm shadow-[#3C80F5]/25"
                >
                    <Plus size={15} />
                    Add role
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20 gap-3 text-[#94A3B5]">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-[13px]">Loading roles...</span>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-[13px] font-medium">{error}</p>
                    <button onClick={fetchRoles} className="ml-auto text-[12.5px] font-bold underline">
                        Retry
                    </button>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && roles.length === 0 && (
                <div className="text-center py-20 text-[#94A3B5]">
                    <p className="text-[14px] font-semibold">No roles found</p>
                    <p className="text-[12.5px] mt-1">Click "Add role" to create your first role.</p>
                </div>
            )}

            {/* Grid */}
            {!loading && !error && roles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roles.map(role => (
                        <RoleCard
                            key={role.id}
                            role={role}
                            onEdit={(r) => { setEditRole(r); setShowForm(true); }}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Create / Edit modal */}
            {showForm && (
                <RoleForm
                    onClose={() => { setShowForm(false); setEditRole(null); }}
                    onSubmit={editRole ? handleUpdate : handleCreate}
                    loading={formLoading}
                    editData={editRole}
                />
            )}
        </div>
    );
}