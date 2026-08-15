"use client";

import { useEffect, useState } from "react";
import type { DetectionStatus, RealtimeEvent } from "@/lib/types";

const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://localhost:8000";

export function useProctoringEvents(sessionId: string, enabled: boolean) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<DetectionStatus | null>(null);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    const socket = new WebSocket(`${WS_BASE}/ws/sessions/${sessionId}`);

    socket.addEventListener("open", () => setConnected(true));
    socket.addEventListener("close", () => setConnected(false));
    socket.addEventListener("message", (message) => {
      const event = JSON.parse(message.data) as RealtimeEvent;
      setEvents((current) => [event, ...current].slice(0, 100));
      if (event.type === "detection.status") {
        setStatus(event.payload as DetectionStatus);
      }
    });

    return () => socket.close();
  }, [sessionId, enabled]);

  return { connected, events, status };
}
