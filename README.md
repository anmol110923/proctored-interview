# Proctored mock interview platform

Local practice interviews (CASE_AI) with optional webcam/mic/screen proctoring from exam-cheating-detection. You answer by voice, get a Gemini evaluation, and — if proctoring is on — a discipline summary of presence, gaze, extra faces, and prohibited objects.

Sessions live in SQLite (`backend/data/proctored_interview.db`). Detection thresholds live in `config/config.yaml`. API keys live in `backend/.env`.

## Modes

- **PM Cases** — product sense, guesstimates, design, metrics
- **Resume Round** — questions grounded in a pasted or uploaded resume
- **HR Round** — behavioral / STAR, culture, motivation
- **Technical Round** — spoken Q&A on a stack you specify
- **Consulting Round** — classic case interviews

Proctoring is **off by default** on the setup screen. Turn it on only when you want camera/mic (and optional screen) monitoring.

## Prerequisites

- Python 3.11+
- Node 20+
- ffmpeg (Whisper audio decode; macOS: `brew install ffmpeg`)
- For proctoring: portaudio (`brew install portaudio`), a webcam, and enough disk for recordings

## Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

`playsound` is omitted because it does not build on Python 3.14. Spoken alerts use `pygame` + `gTTS`.

Set `GEMINI_API_KEY` in `backend/.env`. Optional model split (defaults fall back to `GEMINI_MODEL`):

```
GEMINI_MODEL_INTERVIEWER=gemini-3.1-flash-lite
GEMINI_MODEL_EVAL=gemini-3.1-flash-lite
GEMINI_MODEL_SUMMARY=gemini-3.1-flash-lite
```

### Optional proctoring / ML stack

Interview practice works without this. Install only if you will enable proctoring:

```bash
pip install -r requirements-ml.txt
```

First object-detection run downloads YOLO weights. `faster-whisper` (not `openai-whisper`) transcribes answers; the first transcription downloads the Whisper `small` model (~500 MB).

Backend audio monitoring uses the **system** microphone. Browser Whisper uses the **page** microphone. Both can compete if proctoring audio is enabled in `config/config.yaml`.

Start the API from `backend/` so `app` imports resolve:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)

## Frontend setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set `NEXT_PUBLIC_DEBUG=true` to show the token/context debug panel.

`NEXT_PUBLIC_API_URL` should be `http://localhost:8000/api`. `NEXT_PUBLIC_WS_BASE_URL` should be `ws://localhost:8000` for live proctoring events.

## Flow

1. Choose a mode and paste your prompt (optional resume PDF for Resume Round).
2. Optionally enable proctoring (camera/mic permissions).
3. The interviewer asks an opening question (browser TTS). You answer by voice (Whisper).
4. If proctoring is on, a compact status strip shows face / gaze / multi-face / object flags from the WebSocket feed.
5. End the interview (or wait for the timer). You get the Gemini evaluation plus a Session Discipline section when proctoring was enabled.
6. History shows interview scores and a proctoring badge per session.

## Config files

| File | Purpose |
|------|---------|
| `backend/.env` | Secrets and Gemini/Whisper/SQLite settings |
| `config/config.yaml` | Detection thresholds, recording, reporting paths |
| `frontend/.env.local` | API and WebSocket URLs |

Do not put API keys in the YAML file.

## Layout

```
proctored-interview/
├── backend/app/     FastAPI: interview + proctoring + combined report
├── frontend/        Next.js UI
├── src/detection/   Face, gaze, mouth, multi-face, object, audio (ported as-is)
├── src/reporting/   HTML/PDF proctoring reports
├── src/utils/       Recording / screenshots / alerts
└── config/          Detection YAML
```
