"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch, API_BASE, getToken } from "@/lib/api";
import { connectSocket } from "@/lib/socket";

export function useChat(type, id) {
    const [comments,  setComments]  = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [sending,   setSending]   = useState(false);
    const [error,     setError]     = useState("");
    const socketRef = useRef(null);

    const fetchComments = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError("");
        try {
            const json = await apiFetch(`/api/comments?${type}=${id}`);
            setComments(Array.isArray(json) ? json : json.comments ?? json.data ?? []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [type, id]);

    useEffect(() => {
        if (!id) return;

        fetchComments();

        const socket    = connectSocket();
        socketRef.current = socket;

        /* join room */
        const roomEvent =
            type === "project" ? "join_project" :
            type === "phase"   ? "join_phase"   :
                                 "join_task";
        const leaveEvent =
            type === "project" ? "leave_project" :
            type === "phase"   ? "leave_phase"   :
                                 "leave_task";

        socket.emit(roomEvent, id);

        /* new comment */
        function onNew(comment) {
            setComments(prev => {
                const exists = prev.some(c => c._id === comment._id);
                return exists ? prev : [...prev, comment];
            });
        }

        /* deleted comment */
        function onDelete({ commentId }) {
            setComments(prev => prev.filter(c => c._id !== commentId));
        }

        socket.on("new_comment",    onNew);
        socket.on("delete_comment", onDelete);

        return () => {
            socket.emit(leaveEvent, id);
            socket.off("new_comment",    onNew);
            socket.off("delete_comment", onDelete);
        };
    }, [type, id]);

    /* ── send comment ── */
    const sendComment = useCallback(async (text) => {
        if (!text.trim() || !id) return;
        setSending(true);
        try {
            const body =
                type === "project" ? { projectId: id, text } :
                type === "phase"   ? { phaseId:   id, text } :
                                     { taskId:    id, text };

            await fetch(`${API_BASE}/api/comments`, {
                method:  "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:  `Bearer ${getToken()}`,
                },
                body: JSON.stringify(body),
            });
            // socket will push the new_comment event back
        } catch (e) {
            setError(e.message);
        } finally {
            setSending(false);
        }
    }, [type, id]);

    /* ── delete comment ── */
    const deleteComment = useCallback(async (commentId) => {
        try {
            await apiFetch(`/api/comments/${commentId}`, { method: "DELETE" });
            // socket will push the delete_comment event back
        } catch (e) {
            setError(e.message);
        }
    }, []);

    return { comments, loading, sending, error, sendComment, deleteComment, refetch: fetchComments };
}