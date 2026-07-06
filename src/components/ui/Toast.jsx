"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, XCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

// ─── Variants ────────────────────────────────────────────────────────────────
const VARIANTS = {
    error: {
        icon:        XCircle,
        bg:          "#fef2f2",
        border:      "#fecaca",
        iconColor:   "#ef4444",
        titleColor:  "#991b1b",
        bodyColor:   "#b91c1c",
        progress:    "#ef4444",
        defaultTitle:"Authentication Failed",
    },
    success: {
        icon:        CheckCircle2,
        bg:          "#f0fdf4",
        border:      "#bbf7d0",
        iconColor:   "#22c55e",
        titleColor:  "#14532d",
        bodyColor:   "#15803d",
        progress:    "#22c55e",
        defaultTitle:"Success",
    },
    warning: {
        icon:        AlertTriangle,
        bg:          "#fffbeb",
        border:      "#fde68a",
        iconColor:   "#f59e0b",
        titleColor:  "#78350f",
        bodyColor:   "#b45309",
        progress:    "#f59e0b",
        defaultTitle:"Warning",
    },
    info: {
        icon:        Info,
        bg:          "#eff6ff",
        border:      "#bfdbfe",
        iconColor:   "#3b82f6",
        titleColor:  "#1e3a8a",
        bodyColor:   "#1d4ed8",
        progress:    "#3b82f6",
        defaultTitle:"Info",
    },
};

// ─── Single toast item ────────────────────────────────────────────────────────
function ToastItem({ id, type = "error", title, message, duration = 5000, onDismiss }) {
    const [visible,  setVisible]  = useState(false);
    const [leaving,  setLeaving]  = useState(false);
    const [progress, setProgress] = useState(100);
    const intervalRef = useRef(null);
    const v    = VARIANTS[type] ?? VARIANTS.error;
    const Icon = v.icon;

    const dismiss = useCallback(() => {
        setLeaving(true);
        clearInterval(intervalRef.current);
        setTimeout(() => onDismiss(id), 320);
    }, [id, onDismiss]);

    useEffect(() => {
        requestAnimationFrame(() => setVisible(true));
        const step = 100 / (duration / 50);
        intervalRef.current = setInterval(() => {
            setProgress(p => {
                const next = p - step;
                if (next <= 0) { clearInterval(intervalRef.current); dismiss(); }
                return Math.max(next, 0);
            });
        }, 50);
        return () => clearInterval(intervalRef.current);
    }, [duration, dismiss]);

    return (
        <div
            style={{
                width: "360px",
                background: v.bg,
                border: `1px solid ${v.border}`,
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden",
                transition: "transform 0.32s cubic-bezier(0.32,0.72,0,1), opacity 0.32s ease",
                transform: visible && !leaving ? "translateX(0)" : "translateX(110%)",
                opacity:   visible && !leaving ? 1 : 0,
                willChange: "transform, opacity",
            }}
        >
            {/* Body */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px 16px 12px" }}>
                {/* Icon */}
                <div style={{ color: v.iconColor, flexShrink: 0, marginTop: "1px" }}>
                    <Icon size={20} strokeWidth={2} />
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                        margin: 0,
                        fontSize: "13px",
                        fontWeight: 700,
                        color: v.titleColor,
                        lineHeight: 1.3,
                    }}>
                        {title ?? v.defaultTitle}
                    </p>
                    {message && (
                        <p style={{
                            margin: "3px 0 0",
                            fontSize: "12px",
                            color: v.bodyColor,
                            lineHeight: 1.4,
                        }}>
                            {message}
                        </p>
                    )}
                </div>

                {/* Close */}
                <button
                    type="button"
                    onClick={dismiss}
                    style={{
                        flexShrink: 0,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: v.iconColor,
                        padding: "2px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0.7,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}
                >
                    <X size={14} />
                </button>
            </div>

            {/* Progress bar */}
            <div style={{ height: "3px", background: "rgba(0,0,0,0.06)" }}>
                <div style={{
                    height: "100%",
                    width: `${progress}%`,
                    background: v.progress,
                    transition: "width 50ms linear",
                }} />
            </div>
        </div>
    );
}

// ─── Global dispatch ref ──────────────────────────────────────────────────────
let _dispatch = null;

// ─── Container (mount once in layout) ────────────────────────────────────────
export function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    _dispatch = useCallback((toast) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { ...toast, id }]);
    }, []);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <div style={{
            position:       "fixed",
            top:            "20px",
            right:          "20px",
            zIndex:         9999,
            display:        "flex",
            flexDirection:  "column",
            gap:            "10px",
            pointerEvents:  "none",
        }}>
            {toasts.map(t => (
                <div key={t.id} style={{ pointerEvents: "auto" }}>
                    <ToastItem {...t} onDismiss={dismiss} />
                </div>
            ))}
        </div>
    );
}

// ─── toast() helper — call from anywhere ─────────────────────────────────────
// Usage:
//   toast.error("Wrong credentials")
//   toast.success({ title: "Logged in", message: "Welcome back!" })
//   toast.warning("Session expiring soon")
//   toast({ type: "info", title: "Note", message: "..." })

export function toast(options) {
    if (typeof options === "string") options = { type: "info", message: options };
    _dispatch?.(options);
}

toast.error   = (msg, opts = {}) => toast({ type: "error",   message: typeof msg === "string" ? msg : undefined, ...(typeof msg === "object" ? msg : {}), ...opts });
toast.success = (msg, opts = {}) => toast({ type: "success", message: typeof msg === "string" ? msg : undefined, ...(typeof msg === "object" ? msg : {}), ...opts });
toast.warning = (msg, opts = {}) => toast({ type: "warning", message: typeof msg === "string" ? msg : undefined, ...(typeof msg === "object" ? msg : {}), ...opts });
toast.info    = (msg, opts = {}) => toast({ type: "info",    message: typeof msg === "string" ? msg : undefined, ...(typeof msg === "object" ? msg : {}), ...opts });