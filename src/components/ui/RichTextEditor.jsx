"use client";
import dynamic from "next/dynamic";
import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { Loader2, ImagePlus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/components/ui/Toast";

const JoditEditor = dynamic(() => import("jodit-react"), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] flex items-center justify-center text-[#94A3B5] text-[12px] gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading editor...
        </div>
    ),
});

const DEFAULT_UPLOAD_URL = "/api/phases/editor/upload";

function extractUrl(json) {
    if (!json) return null;
    if (typeof json.data === "string") return json.data;
    if (json.data?.url) return json.data.url;
    if (json.url) return json.url;
    if (json.data?.data?.url) return json.data.data.url;
    return null;
}

function driveFileId(url) {
    if (!url) return null;
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (fileMatch) return fileMatch[1];
    const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
    if (openMatch) return openMatch[1];
    return null;
}

function driveImageUrl(fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
}


export default function RichTextEditor({
    value,
    onChange,
    placeholder = "Write something...",
    height = 400,
    uploadUrl = DEFAULT_UPLOAD_URL,
    disabled = false,
}) {
    const editorRef = useRef(null);
    const containerRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const latestValueRef = useRef(value);
    useEffect(() => {
        latestValueRef.current = value;
    }, [value]);

    const savedRangeRef = useRef(null);

    function getInstance() {
        const raw = editorRef.current;
        if (raw && typeof raw.value !== "undefined") return raw;
        if (raw?.editor && typeof raw.editor.value !== "undefined") return raw.editor;
        return null;
    }

    function getEditableElement() {
        const jodit = getInstance();
        if (jodit?.editor?.nodeType === 1) return jodit.editor;

        return containerRef.current?.querySelector(".jodit-wysiwyg") ?? null;
    }

    function saveCursorPosition() {
        const editableEl = getEditableElement();
        const sel = window.getSelection();
        if (!editableEl || !sel || sel.rangeCount === 0) {
            savedRangeRef.current = null;
            return;
        }
        const range = sel.getRangeAt(0);

        if (editableEl.contains(range.commonAncestorContainer)) {
            savedRangeRef.current = range.cloneRange();
        } else {
            savedRangeRef.current = null;
        }
    }

    function insertHtml(html) {
        const editableEl = getEditableElement();
        const range = savedRangeRef.current;

        if (editableEl && range) {
            try {
                editableEl.focus();
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);

                range.deleteContents();
                const fragment = range.createContextualFragment(html);
                const lastNode = fragment.lastChild;
                range.insertNode(fragment);

                if (lastNode) {
                    const after = document.createRange();
                    after.setStartAfter(lastNode);
                    after.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(after);
                }

                savedRangeRef.current = null;
                onChange?.(editableEl.innerHTML);
                return;
            } catch {

            }
        }

        const jodit = getInstance();
        if (jodit && typeof jodit.value !== "undefined") {
            jodit.value = (jodit.value || "") + html;
            onChange?.(jodit.value);
            return;
        }

        onChange?.((latestValueRef.current ?? "") + html);
    }

    const handleUpload = useCallback(async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const json = await apiFetch(uploadUrl, { method: "POST", body: formData });
            const rawUrl = extractUrl(json);
            if (!rawUrl) throw new Error("Upload succeeded but no URL was returned");

            const isVideo = file.type.startsWith("video/");
            const fileId = driveFileId(rawUrl);
            const html = fileId
                ? (isVideo
                    ? `<p><iframe src="https://drive.google.com/file/d/${fileId}/preview" style="width:100%;max-width:720px;height:400px;border:0;" allow="autoplay"></iframe></p>`
                    : `<p><img src="${driveImageUrl(fileId)}" alt="${file.name}" style="width:100%;max-width:720px;height:auto;display:block;" referrerpolicy="no-referrer" /></p>`)
                : isVideo
                    ? `<p><video src="${rawUrl}" controls style="width:100%;max-width:720px;height:auto;display:block;"></video></p>`
                    : `<p><img src="${rawUrl}" alt="${file.name}" style="width:100%;max-width:720px;height:auto;display:block;" /></p>`;

            insertHtml(html);
            toast.success({ title: isVideo ? "Video uploaded" : "Image uploaded", message: file.name });
        } catch (e) {
            toast.error({ title: "Upload failed", message: e.message });
        } finally {
            setUploading(false);
        }
        
    }, [uploadUrl]);

    const openPicker = useCallback(() => {
        if (uploading || disabled) return;
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*,video/*";
        input.onchange = () => handleUpload(input.files?.[0]);
        input.click();
    }, [uploading, disabled, handleUpload]);

    const config = useMemo(() => ({
        readonly: disabled,
        placeholder,
        height,
        minHeight: height,
        toolbarAdaptive: false,
        uploader: { insertImageAsBase64URI: false },
        buttons: [
            "paragraph", "fontsize", "|",
            "bold", "italic", "underline", "strikethrough", "|",
            "brush", "|",
            "ul", "ol", "|",
            "table", "|",
            "align", "|",
            "link", "|",
            "undo", "redo",
        ],
    }), [disabled, placeholder, height]);

    return (
        <div ref={containerRef} className="rounded-xl border border-[#E7EBF2] overflow-hidden">

            <style jsx global>{`
                .jodit-wysiwyg h1 { font-size: 2em; font-weight: 700; margin: 0.67em 0; line-height: 1.2; }
                .jodit-wysiwyg h2 { font-size: 1.5em; font-weight: 700; margin: 0.75em 0; line-height: 1.25; }
                .jodit-wysiwyg h3 { font-size: 1.25em; font-weight: 600; margin: 0.83em 0; line-height: 1.3; }
                .jodit-wysiwyg h4 { font-size: 1.1em; font-weight: 600; margin: 1em 0; }
                .jodit-wysiwyg h5 { font-size: 1em; font-weight: 600; margin: 1.1em 0; }
                .jodit-wysiwyg h6 { font-size: 0.9em; font-weight: 600; margin: 1.2em 0; }
                .jodit-wysiwyg p { margin: 0.5em 0; }
                .jodit-wysiwyg ul, .jodit-wysiwyg ol { padding-left: 1.5em; margin: 0.5em 0; }
                .jodit-wysiwyg table { border-collapse: collapse; }
                .jodit-wysiwyg table td, .jodit-wysiwyg table th { border: 1px solid #E7EBF2; padding: 6px 8px; }
            `}</style>
            <div className="flex items-center justify-between px-3 py-2 bg-[#F7F9FC] border-b border-[#E7EBF2]">
                <span className="text-[11px] font-semibold text-[#94A3B5]">Attach media</span>
                <button
                    type="button"
                    onMouseDown={saveCursorPosition}
                    onClick={openPicker}
                    disabled={uploading || disabled}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-semibold text-[#3C80F5] hover:bg-[#EEF3FE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
                    {uploading ? "Uploading..." : "Upload image / video"}
                </button>
            </div>
            <JoditEditor
                ref={editorRef}
                value={value ?? ""}
                config={config}

                onBlur={(newContent) => onChange?.(newContent)}
                onChange={() => {}}
            />
        </div>
    );
}