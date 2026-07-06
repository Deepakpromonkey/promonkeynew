"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, Wifi, WifiOff } from "lucide-react";
import { io } from "socket.io-client";
import { apiFetch, SOCKET_BASE, getToken } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
 
const COLORS = [
    "from-[#3C80F5] to-[#763CF6]", "from-[#763CF6] to-[#3C80F5]",
    "from-[#16A34A] to-[#3C80F5]", "from-[#E08600] to-[#763CF6]",
    "from-[#DC2626] to-[#E08600]", "from-[#0891B2] to-[#3C80F5]",
];
 
function colorFor(name = "") {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return COLORS[h % COLORS.length];
}
 
function initials(name = "") {
    return name.split(" ").filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}
 
function Avatar({ name = "?", size = "md" }) {
    const sz = size === "sm" ? "w-8 h-8 text-[11px]" : "w-9 h-9 text-[12px]";
    return (
        <div className={cn("rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold shrink-0", sz, colorFor(name))}>
            {initials(name)}
        </div>
    );
}
 
function fmtTime(d) {
    if (!d) return "";
    return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}
 
function resolveName(msg) {
    return msg.sender?.legalName ?? msg.sender?.name ?? msg.sender?.employeeProfile?.legalName ?? msg.author?.legalName ?? msg.author?.name ?? msg.author?.employeeProfile?.legalName ?? "User";
}
 
function resolveBody(msg) { return msg.text ?? msg.content ?? msg.message ?? ""; }
 
function resolveSenderId(msg) { return msg.senderId ?? msg.authorId ?? msg.sender?.id ?? msg.author?.id ?? msg.sender ?? null; }
 
export default function ChatTab({ projectId }) {
    const { user: currentUser, ready: authReady } = useAuth();
 
    const myId = currentUser?.employeeProfile?.id ?? currentUser?.id ?? null;
    const myName = currentUser?.employeeProfile?.legalName ?? currentUser?.name ?? "Me";
 
    const [messages,  setMessages]  = useState([]);
    const [loading,   setLoading]   = useState(true);
    const [text,      setText]      = useState("");
    const [sending,   setSending]   = useState(false);
    const [connected, setConnected] = useState(false);
    const [error,     setError]     = useState("");
 
    const socketRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef  = useRef(null);
 
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
 
    useEffect(() => {
        if (!projectId || !authReady) return;
        setLoading(true);
        setError("");
        apiFetch(`/api/chat/${projectId}`)
            .then(json => {
                const list = json.data ?? json.messages ?? json ?? [];
                setMessages(Array.isArray(list) ? list : []);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [projectId, authReady]);
 
    useEffect(() => {
        if (!projectId || !authReady) return;
 
        const token = getToken();
        const socket = io(SOCKET_BASE, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
        });
        socketRef.current = socket;
 
        const onMsg = (msg) => {
            setMessages(prev => {
                const withoutOpt = prev.filter(m =>
                    !(m._optimistic && resolveBody(m) === resolveBody(msg))
                );
                if (msg.id && withoutOpt.some(m => m.id === msg.id)) return withoutOpt;
                return [...withoutOpt, msg];
            });
        };
 
        socket.on("connect", () => {
            setConnected(true);
            socket.emit("join_project_room", String(projectId));
        });
 
        socket.on("disconnect", () => setConnected(false));
        socket.on("connect_error", () => setConnected(false));
        socket.on("receive_message", onMsg);
 
        return () => {
            socket.off("receive_message", onMsg);
            socket.disconnect();
        };
    }, [projectId, authReady]);
 
    const handleSend = useCallback(async () => {
        const trimmed = text.trim();
        if (!trimmed || sending) return;
 
        setSending(true);
        setText("");
        const optimisticId = `opt-${Date.now()}`;
        const optimistic = {
            id:          optimisticId,
            text:        trimmed, 
            createdAt:   new Date().toISOString(),
            _optimistic: true,
            _mine:       true,
            sender:      { id: myId, legalName: myName }, 
        };
        
        setMessages(prev => [...prev, optimistic]);
 
        try {
            const payload = {
                projectId: String(projectId),  
                text: trimmed,
                senderId: myId ?? undefined, 
            };
 
            if (socketRef.current?.connected) {
                // 🟢 Added JSON tracking callback to communicate back with our server
                socketRef.current.emit("send_message", payload, (response) => {
                    if (response?.error) {
                        // Rollback state if database execution fails
                        setMessages(prev => prev.filter(m => m.id !== optimisticId));
                        setText(trimmed);
                    } else if (response?.data || response) {
                        // Replace fallback data with true Prisma structural properties
                        const realMsg = response.data ?? response;
                        setMessages(prev => prev.map(m => m.id === optimisticId ? realMsg : m));
                    }
                });
            } else {
                throw new Error("Socket disconnected");
            }
 
        } catch (e) {
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
            setText(trimmed);
        } finally {
            setSending(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [text, sending, projectId, myId, myName]);
 
    function handleKey(e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
    }
 
    function isMine(msg) {
        if (msg._mine) return true;
        const sid = resolveSenderId(msg);
        return sid && myId && String(sid) === String(myId);
    }
 
    function isSameGroup(msg, prev) {
        if (!prev) return false;
        if (isMine(msg) !== isMine(prev)) return false;
        if (resolveName(msg) !== resolveName(prev)) return false;
        if (!msg.createdAt || !prev.createdAt) return false;
        return Math.abs(new Date(msg.createdAt) - new Date(prev.createdAt)) < 3 * 60 * 1000;
    }
 
    if (!authReady) {
        return (
            <div className="flex items-center justify-center h-[560px] bg-white border border-[#E7EBF2] rounded-2xl">
                <Loader2 size={24} className="animate-spin text-[#3C80F5]" />
            </div>
        );
    }
 
    return (
        <div className="flex flex-col bg-white border border-[#E7EBF2] rounded-2xl shadow-[0_1px_2px_rgba(27,35,48,.06)] overflow-hidden" style={{ height: "560px" }}>
            {/* Connection Bar */}
            <div className={cn("flex items-center gap-1.5 px-4 py-2 text-[11.5px] font-semibold border-b border-[#EEF1F6] shrink-0", connected ? "text-[#16A34A] bg-[#F0FDF4]" : "text-[#94A3B5] bg-[#F7F9FC]")}>
                {connected ? <><Wifi size={12} /> Live · Connected</> : <><WifiOff size={12} /> Connecting...</>}
            </div>
 
            {/* Messages Stream viewport */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                {loading && (
                    <div className="flex items-center justify-center h-full gap-3 text-[#94A3B5]">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-[13px]">Loading messages...</span>
                    </div>
                )}
 
                {!loading && error && (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-[13px] text-[#DC2626]">Failed to load: {error}</p>
                    </div>
                )}
 
                {!loading && !error && messages.length === 0 && (
                    <div className="flex items-center justify-center h-full flex-col gap-2 text-[#94A3B5]">
                        <p className="text-[14px] font-semibold">No messages yet</p>
                        <p className="text-[12.5px]">Start the conversation below.</p>
                    </div>
                )}
 
                {!loading && !error && messages.map((msg, i) => {
                    const mine = isMine(msg);
                    const name = mine ? myName : resolveName(msg);
                    const body = resolveBody(msg);
                    const time = fmtTime(msg.createdAt);
                    const prev = messages[i - 1];
                    const grouped = isSameGroup(msg, prev);
 
                    if (!body) return null;
 
                    return (
                        <div key={msg.id ?? i} className={cn("flex items-end gap-2.5", mine ? "flex-row-reverse" : "flex-row", grouped ? "mt-0.5" : "mt-4")}>
                            <div className="shrink-0 w-9">{!grouped && <Avatar name={name} />}</div>
                            <div className={cn("flex flex-col max-w-[65%]", mine ? "items-end" : "items-start")}>
                                {!grouped && (
                                    <div className={cn("flex items-center gap-1.5 mb-1", mine ? "flex-row-reverse" : "flex-row")}>
                                        <span className="text-[12px] font-semibold text-[#1B2330]">{name}</span>
                                        <span className="text-[11px] text-[#94A3B5]">· {time}</span>
                                    </div>
                                )}
                                <div className={cn("px-4 py-2.5 text-[13.5px] leading-relaxed break-words", mine ? "bg-gradient-to-r from-[#3C80F5] to-[#763CF6] text-white rounded-2xl rounded-br-sm" : "bg-[#F7F9FC] border border-[#E7EBF2] text-[#1B2330] rounded-2xl rounded-bl-sm", msg._optimistic && "opacity-70")}>
                                    {body}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
 
            {/* Input Action Panel */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-[#EEF1F6] bg-white shrink-0">
                <input
                    ref={inputRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Message the project team..."
                    className="flex-1 h-11 px-4 rounded-xl border border-[#E7EBF2] bg-[#F7F9FC] text-[13.5px] text-[#1B2330] placeholder:text-[#94A3B5] outline-none focus:border-[#3C80F5] focus:ring-2 focus:ring-[#3C80F5]/15 transition-colors"
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="h-11 px-5 rounded-xl text-[13.5px] font-bold text-white bg-gradient-to-r from-[#3C80F5] to-[#763CF6] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    Send
                </button>
            </div>
        </div>
    );
}