import type { InterviewMode } from "./modes";

export type Difficulty = "easy" | "medium" | "hard";
export type SessionStatus = "active" | "evaluating" | "complete";
export type DurationMinutes = 15 | 30 | 45;
export type ProctoringStatus = "created" | "running" | "stopping" | "completed" | "failed";

export type Turn = {
  role: "interviewer" | "candidate";
  content: string;
  timestamp: string;
};

export type DimensionScore = {
  score: number;
  explanation: string;
};

export type Evaluation = {
  overall_score: number;
  dimensions: Record<string, DimensionScore>;
  strongest_areas: string[];
  weakest_areas: string[];
  specific_mistakes: string[];
  missed_opportunities: string[];
  struggled_questions: string[];
  practice_recommendations: string[];
  final_recommendation: string;
};

export type TokenCall = {
  type: string;
  prompt: number;
  output: number;
  total: number;
};

export type TokenUsage = {
  calls: TokenCall[];
  session_total: number;
};

export type Session = {
  id: string;
  mode: InterviewMode;
  custom_prompt: string;
  difficulty: Difficulty;
  duration_minutes: number;
  focus_areas: string[];
  status: SessionStatus;
  created_at: string;
  turns: Turn[];
  current_question: string | null;
  evaluation: Evaluation | null;
  context_summary?: string | null;
  token_usage?: TokenUsage | null;
  proctoring_enabled: boolean;
  proctoring_status: ProctoringStatus | null;
};

export type SessionSummary = {
  id: string;
  mode: InterviewMode;
  difficulty: Difficulty;
  duration_minutes: number;
  status: SessionStatus;
  created_at: string;
  overall_score: number | null;
  focus_areas: string[];
  proctoring_enabled: boolean;
  proctoring_status: ProctoringStatus | null;
  violation_count: number;
};

export type SessionDebug = {
  session_id: string;
  message_count: number;
  exchange_count: number;
  window_exchanges: number;
  recent_turn_count: number;
  summary_length: number;
  context_summary: string | null;
  token_usage: TokenUsage;
  interviewer_model: string;
  eval_model: string;
  summary_model: string;
};

export type CreateSessionPayload = {
  mode: InterviewMode;
  custom_prompt: string;
  difficulty: Difficulty;
  duration_minutes: DurationMinutes;
  focus_areas: string[];
  resume_text?: string | null;
  proctoring_enabled?: boolean;
};

export type Evidence = {
  id: string;
  kind: "image" | "video" | "audio" | "screen" | "report";
  path: string;
  created_at: string;
};

export type Incident = {
  id: string;
  session_id: string;
  type: string;
  severity: number;
  timestamp: string;
  status: string;
  metadata: Record<string, unknown>;
  evidence: Evidence[];
};

export type DetectionStatus = {
  session_id: string;
  face_present: boolean;
  gaze_direction: string;
  eye_ratio: number;
  mouth_moving: boolean;
  multiple_faces: boolean;
  objects_detected: boolean;
  audio_detected: boolean;
  error: string | null;
  timestamp: string;
};

export type ProctoringReportMeta = {
  id: string;
  session_id: string;
  status: "pending" | "ready" | "failed";
  path: string | null;
  created_at: string;
};

export type ProctoringSummary = {
  enabled: boolean;
  status: ProctoringStatus | null;
  violation_count: number;
  severity_total: number;
  counts_by_type: Record<string, number>;
  incidents: Incident[];
  reports: ProctoringReportMeta[];
  latest_status: DetectionStatus | null;
};

export type CombinedReport = {
  session: Session;
  proctoring: ProctoringSummary | null;
};

export type RealtimeEvent = {
  type: string;
  session_id: string | null;
  timestamp: string;
  payload: Record<string, unknown>;
};
