"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, AlertCircle, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

function Toggle({ checked, onChange }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex w-10 h-[22px] rounded-full transition-colors duration-200 shrink-0",
                checked ? "bg-[#3C80F5]" : "bg-[#D1D9E6]"
            )}
        >
            <span className={cn(
                "absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                checked ? "translate-x-[18px]" : "translate-x-0"
            )} />
        </button>
    );
}

function ModuleRow({ moduleName, featureMap, onChange }) {
    const [open, setOpen] = useState(false);

    const keys         = Object.keys(featureMap);
    const enabledCount = keys.filter(k => featureMap[k]).length;
    const allEnabled   = enabledCount === keys.length;

    const toggleAll = (val) => {
        keys.forEach(k => onChange(moduleName, k, val));
    };

    const prettyLabel = (key) =>
        key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());

    return (
        <div className="border border-[#E7EBF2] rounded-2xl overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-[#F7F9FC] transition-colors"
            >
                <span className="text-[14px] font-bold text-[#1B2330]">{moduleName}</span>
                <div className="flex items-center gap-3">
                    <span className="text-[12.5px] text-[#69788C] font-medium">
                        {enabledCount}/{keys.length} features
                    </span>
                    {open
                        ? <ChevronUp size={15} className="text-[#94A3B5]" />
                        : <ChevronDown size={15} className="text-[#94A3B5]" />
                    }
                </div>
            </button>

            {open && (
                <div className="bg-[#F7F9FC] border-t border-[#E7EBF2]">
                    {/* Grant all */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-[#E7EBF2] bg-[#EEF3FE]">
                        <span className="text-[13px] font-bold text-[#1B2330]">
                            Grant all features in {moduleName}
                        </span>
                        <Toggle checked={allEnabled} onChange={toggleAll} />
                    </div>

                    {/* Individual features */}
                    {keys.map((key, i) => (
                        <div
                            key={key}
                            className={cn(
                                "flex items-center justify-between px-5 py-3",
                                i < keys.length - 1 && "border-b border-[#EEF1F6]"
                            )}
                        >
                            <span className="text-[13px] text-[#1B2330]">{prettyLabel(key)}</span>
                            <Toggle
                                checked={!!featureMap[key]}
                                onChange={(val) => onChange(moduleName, key, val)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PermissionsInner() {
    const searchParams = useSearchParams();
    const roleIdFromUrl   = searchParams.get("roleId");
    const roleNameFromUrl = searchParams.get("role");

    /* roles list for dropdown */
    const [roles,        setRoles]        = useState([]);
    const [rolesLoading, setRolesLoading] = useState(true);

    const [selectedId,   setSelectedId]   = useState(roleIdFromUrl ?? "");
    const [selectedName, setSelectedName] = useState(roleNameFromUrl ?? "");

    const [perms,        setPerms]        = useState({});
    const [permsLoading, setPermsLoading] = useState(false);
    const [permsError,   setPermsError]   = useState("");

    const [saving,       setSaving]       = useState(false);
    const [roleOpen,     setRoleOpen]     = useState(false);

    useEffect(() => {
        async function fetchRoles() {
            setRolesLoading(true);
            try {
                const json = await apiFetch("/api/roles");
                const list = json.data ?? [];
                setRoles(list);

                if (!selectedId && list.length > 0) {
                    setSelectedId(list[0].id);
                    setSelectedName(list[0].name);
                }
               
                if (roleIdFromUrl) {
                    const found = list.find(r => r.id === roleIdFromUrl);
                    if (found) setSelectedName(found.name);
                }
            } catch (e) {
                toast.error({ title: "Failed to load roles", message: e.message });
            } finally {
                setRolesLoading(false);
            }
        }
        fetchRoles();
    }, []);

    const fetchPerms = useCallback(async () => {
        if (!selectedId) return;
        setPermsLoading(true);
        setPermsError("");
        try {
            const json = await apiFetch(`/api/roles/${selectedId}/permissions`);
            setPerms(json.data?.permissions ?? {});
        } catch (e) {
            setPermsError(e.message);
            toast.error({ title: "Failed to load permissions", message: e.message });
        } finally {
            setPermsLoading(false);
        }
    }, [selectedId]);

    useEffect(() => { fetchPerms(); }, [fetchPerms]);

    const handleToggle = (moduleName, featureKey, val) => {
        setPerms(prev => ({
            ...prev,
            [moduleName]: {
                ...prev[moduleName],
                [featureKey]: val,
            },
        }));
    };

    const handleSave = async () => {
        if (!selectedId) return;
        setSaving(true);
        try {
            await apiFetch(`/api/roles/${selectedId}/permissions`, {
                method: "PUT",
                body: JSON.stringify({ permissions: perms }),
            });
            toast.success({
                title: "Permissions saved",
                message: `Permissions for "${selectedName}" updated successfully.`,
            });
        } catch (e) {
            toast.error({ title: "Failed to save", message: e.message });
        } finally {
            setSaving(false);
        }
    };

    const selectRole = (role) => {
        setSelectedId(role.id);
        setSelectedName(role.name);
        setRoleOpen(false);
    };

    const modules = Object.keys(perms);

    return (
        <div className="max-w-[860px] mx-auto">

            {/* Header */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-[22px] font-black text-[#1B2330] tracking-[-0.3px]">Permissions</h1>
                    <p className="text-[13px] text-[#69788C] mt-0.5">
                        Comprehensive access control — configurable per module <b>and</b> per internal feature.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* Role dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setRoleOpen(o => !o)}
                            disabled={rolesLoading}
                            className="flex items-center gap-2.5 px-4 py-2 bg-white border border-[#E7EBF2] rounded-xl text-[13px] font-semibold text-[#1B2330] hover:bg-[#F7F9FC] shadow-sm transition-colors min-w-[180px] justify-between disabled:opacity-60"
                        >
                            {rolesLoading ? (
                                <span className="flex items-center gap-2 text-[#94A3B5]">
                                    <Loader2 size={13} className="animate-spin" />
                                    Loading...
                                </span>
                            ) : (
                                <span>{selectedName || "Select role"}</span>
                            )}
                            <ChevronDown size={14} className="text-[#94A3B5]" />
                        </button>

                        {roleOpen && (
                            <div className="absolute top-full right-0 mt-1.5 bg-white border border-[#E7EBF2] rounded-xl shadow-lg z-20 overflow-hidden min-w-[200px] max-h-[280px] overflow-y-auto">
                                {roles.length === 0 && (
                                    <p className="px-4 py-3 text-[13px] text-[#94A3B5]">No roles found</p>
                                )}
                                {roles.map(role => (
                                    <button
                                        key={role.id}
                                        onClick={() => selectRole(role)}
                                        className={cn(
                                            "w-full text-left px-4 py-2.5 text-[13px] font-medium transition-colors",
                                            role.id === selectedId
                                                ? "bg-[#EEF3FE] text-[#3C80F5] font-semibold"
                                                : "text-[#1B2330] hover:bg-[#F7F9FC]"
                                        )}
                                    >
                                        {role.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Save button */}
                    {modules.length > 0 && (
                        <button
                            onClick={handleSave}
                            disabled={saving || permsLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
                        >
                            {saving
                                ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
                                : <><Save size={13} /> Save</>
                            }
                        </button>
                    )}
                </div>
            </div>

            {/* Loading permissions */}
            {permsLoading && (
                <div className="flex items-center justify-center py-20 gap-3 text-[#94A3B5]">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-[13px]">Loading permissions...</span>
                </div>
            )}

            {/* Error */}
            {!permsLoading && permsError && (
                <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-[13px] font-medium">{permsError}</p>
                    <button onClick={fetchPerms} className="ml-auto text-[12.5px] font-bold underline">
                        Retry
                    </button>
                </div>
            )}

            {/* No role selected */}
            {!permsLoading && !permsError && !selectedId && (
                <div className="text-center py-20 text-[#94A3B5]">
                    <p className="text-[14px] font-semibold">No role selected</p>
                    <p className="text-[12.5px] mt-1">Select a role from the dropdown to manage permissions.</p>
                </div>
            )}

            {/* Modules list */}
            {!permsLoading && !permsError && modules.length > 0 && (
                <div className="space-y-3">
                    {modules.map(moduleName => (
                        <ModuleRow
                            key={moduleName}
                            moduleName={moduleName}
                            featureMap={perms[moduleName]}
                            onChange={handleToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PermissionsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20 gap-3 text-[#94A3B5]">
                <Loader2 size={20} className="animate-spin" />
                <span className="text-[13px]">Loading...</span>
            </div>
        }>
            <PermissionsInner />
        </Suspense>
    );
}