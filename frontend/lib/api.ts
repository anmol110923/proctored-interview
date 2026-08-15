import type {
  CombinedReport,
  CreateSessionPayload,
  Session,
  SessionDebug,
  SessionSummary,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return response.json() as Promise<T>;
}

export function createSession(payload: CreateSessionPayload): Promise<Session> {
  return request<Session>("/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function createSessionWithResume(form: FormData): Promise<Session> {
  return request<Session>("/sessions/with-resume", {
    method: "POST",
    body: form,
  });
}

export function listSessions(): Promise<SessionSummary[]> {
  return request<SessionSummary[]>("/sessions");
}

export function getSession(id: string): Promise<Session> {
  return request<Session>(`/sessions/${id}`);
}

export function getSessionDebug(id: string): Promise<SessionDebug> {
  return request<SessionDebug>(`/sessions/${id}/debug`);
}

export function getCombinedReport(id: string): Promise<CombinedReport> {
  return request<CombinedReport>(`/sessions/${id}/report`);
}

export function startProctoring(id: string): Promise<unknown> {
  return request(`/sessions/${id}/proctoring/start`, { method: "POST" });
}

export function submitTurn(id: string, answer: string): Promise<Session> {
  return request<Session>(`/sessions/${id}/turns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer }),
  });
}

export function endInterview(id: string): Promise<Session> {
  return request<Session>(`/sessions/${id}/end`, { method: "POST" });
}

export function mediaUrl(path: string): string {
  const encoded = encodeURIComponent(path);
  return `${API_URL}/media/${encoded}`;
}

export function reportDownloadUrl(reportId: string): string {
  return `${API_URL}/reports/${reportId}/download`;
}

function audioFilename(blob: Blob): string {
  if (blob.type.includes("mp4")) return "answer.mp4";
  if (blob.type.includes("ogg")) return "answer.ogg";
  return "answer.webm";
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, audioFilename(blob));
  const data = await request<{ transcript: string }>("/transcribe", {
    method: "POST",
    body: form,
  });
  return data.transcript;
}
