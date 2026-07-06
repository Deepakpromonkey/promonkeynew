"use client";
import { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, Plus, FileText, FileImage, FileVideo, FileAudio, FileArchive, FileSpreadsheet, Play, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

/* ---------------- File type helpers ---------------- */

// The API returns `type` as one of: "image" | "video" | "audio" | "doc" | "sheet" | "archive" (no slash),
// so match it directly first and only fall back to sniffing the extension.
function kindOf(type = "", name = "") {
    const t = (type || "").toLowerCase();
    if (["image", "video", "audio", "archive", "sheet", "doc"].includes(t)) return t;

    const ext = (name.split(".").pop() || "").toLowerCase();
    if (["mp4", "mov", "webm", "avi", "mkv"].includes(ext)) return "video";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
    if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return "audio";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
    if (["xls", "xlsx", "csv"].includes(ext)) return "sheet";
    return "doc";
}

function KindIcon({ kind, size = 22, className }) {
    const Icon = {
        video: FileVideo,
        image: FileImage,
        audio: FileAudio,
        archive: FileArchive,
        sheet: FileSpreadsheet,
        doc: FileText,
    }[kind] ?? FileText;
    return <Icon size={size} className={className} />;
}

function fmtSize(bytes) {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Repairs the most common UTF-8/Latin-1 mojibake patterns seen in filenames
// (e.g. a narrow no-break space around "PM" turning into "â¯").
function sanitizeName(name = "") {
    return name
        .replace(/â€¯|â¯/g, " ")
        .replace(/â€™/g, "'")
        .replace(/â€œ|â€\u009d/g, '"')
        .replace(/â€“/g, "–")
        .replace(/â€”/g, "—")
        .trim();
}

// Google Drive "view" links (.../file/d/<id>/view) can't be used as an <img src> —
// they return an HTML page, not image bytes. This builds the actual thumbnail endpoint.
function driveThumbnail(driveFileId, size = 400) {
    return driveFileId ? `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w${size}` : null;
}

/* ---------------- API <-> UI mapping ---------------- */

function mapFile(f) {
    return {
        id:          f.id,
        name:        sanitizeName(f.name ?? f.fileName ?? f.originalName ?? "Untitled file"),
        url:         f.url ?? f.fileUrl ?? f.path ?? null,
        driveFileId: f.driveFileId ?? null,
        type:        f.type ?? f.mimeType ?? f.mimetype ?? "",
        size:        f.size ?? f.fileSize ?? null,
        createdAt:   f.createdAt,
    };
}

/* ---------------- File tile ---------------- */

function FileTile({ file, onDelete }) {
    const kind = kindOf(file.type, file.name);
    const thumbUrl = kind === "image" ? driveThumbnail(file.driveFileId) : null;
    const [thumbFailed, setThumbFailed] = useState(false);
    const showThumb = thumbUrl && !thumbFailed;

    return (
        <div className="group relative border border-[#E7EBF2] rounded-2xl p-4 flex flex-col items-center gap-2 text-center hover:border-[#D1D9E6] transition-colors">
            <button
                onClick={() => onDelete(file.id, file.name)}
                className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center text-white/80 bg-black/20 hover:bg-[#DC2626] opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete file"
            >
                <Trash2 size={12} />
            </button>

            <a
                href={file.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    "w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden",
                    kind === "video" ? "bg-gradient-to-br from-[#3C80F5] to-[#763CF6]" : "bg-[#F7F9FC]"
                )}
            >
                {kind === "video" ? (
                    <Play size={26} className="text-white" fill="white" />
                ) : showThumb ? (
                    <img
                        src={thumbUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={() => setThumbFailed(true)}
                    />
                ) : (
                    <KindIcon kind={kind} size={28} className="text-[#94A3B5]" />
                )}
            </a>

            <p className="text-[11.5px] font-medium text-[#69788C] truncate w-full" title={file.name}>
                {file.name}
            </p>
            {file.size != null && (
                <p className="text-[10.5px] text-[#B8C1D1]">{fmtSize(file.size)}</p>
            )}
        </div>
    );
}

/* ---------------- Main tab ---------------- */

export default function FilesTab({ projectId }) {
    const [files, setFiles]     = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState("");
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef(null);

    async function loadFiles() {
        if (!projectId) return;
        setLoading(true); setError("");
        try {
            const json = await apiFetch(`/api/files/project/${projectId}`);
            const list = json.data?.files ?? json.data ?? json.files ?? [];
            setFiles(list.map(mapFile));
        } catch (e) {
            setError(e.message);
        } finally { setLoading(false); }
    }

    useEffect(() => { loadFiles(); }, [projectId]);

    async function handleFilesSelected(e) {
        const selected = Array.from(e.target.files ?? []);
        if (selected.length === 0) return;
        setUploading(true);
        try {
            for (const file of selected) {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("projectId", projectId);
                await apiFetch("/api/files/upload", { method: "POST", body: formData });
            }
            toast.success({ title: "Uploaded", message: selected.length > 1 ? `${selected.length} files uploaded.` : `"${selected[0].name}" uploaded.` });
            loadFiles();
        } catch (err) {
            toast.error({ title: "Upload failed", message: err.message });
        } finally {
            setUploading(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    }

    async function handleDelete(fileId, name) {
        if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
        try {
            await apiFetch(`/api/files/${fileId}`, { method: "DELETE" });
            toast.success({ title: "File deleted", message: `"${name}" has been removed.` });
            setFiles(fs => fs.filter(f => f.id !== fileId));
        } catch (e) {
            toast.error({ title: "Delete failed", message: e.message });
        }
    }

    return (
        <div className="bg-white border border-[#E7EBF2] rounded-2xl px-5 py-4 shadow-[0_1px_2px_rgba(27,35,48,.06)]">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] tracking-[1.4px] font-bold text-[#94A3B5]">PROJECT FILES</p>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-16 gap-3 text-[#94A3B5]">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-[13px]">Loading files...</span>
                </div>
            )}

            {!loading && error && (
                <div className="flex items-center gap-3 bg-[#FCEDED] border border-[#F3C9C9] rounded-2xl px-5 py-4 text-[#DC2626]">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-[13px] font-medium">{error}</p>
                </div>
            )}

            {!loading && !error && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {files.map(file => (
                        <FileTile key={file.id} file={file} onDelete={handleDelete} />
                    ))}

                    <label
                        className={cn(
                            "border border-dashed border-[#D1D9E6] rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center text-[#94A3B5] hover:border-[#3C80F5] hover:text-[#3C80F5] transition-colors cursor-pointer aspect-square",
                            uploading && "opacity-50 pointer-events-none"
                        )}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFilesSelected}
                            disabled={uploading}
                        />
                        {uploading ? <Loader2 size={22} className="animate-spin" /> : <Plus size={22} />}
                        <p className="text-[11.5px] font-medium">{uploading ? "Uploading..." : "Upload file"}</p>
                    </label>
                </div>
            )}

            {!loading && !error && files.length === 0 && (
                <p className="text-[12.5px] text-[#94A3B5] mt-3">No files yet — upload the first one above.</p>
            )}
        </div>
    );
}