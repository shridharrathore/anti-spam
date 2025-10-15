# AntiSpam Admin POC

Lightweight FastAPI + React dashboard to showcase SMS and call spam analytics.

## Prerequisites
- Python 3.9+
- Node 18+
- OpenAI account + API key for classification endpoint

## Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=backend uvicorn app.main:app --reload --port 8000
```

Defaults to SQLite `antispm.db` in project root; auto-seeded with sample data.

### Configure OpenAI
Create `backend/.env` (or export in shell):
```bash
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"      # optional override
OPENAI_TEMPERATURE=0.0           # optional
OPENAI_MAX_OUTPUT_TOKENS=256     # optional
```

> Render build note: pin Python to 3.11 by committing `runtime.txt` at the repo root with `python-3.11.9` (already in repo). This avoids pydantic-core from trying to compile for Python 3.13.

The `/api/classification` endpoint depends solely on the LLM. If the key is missing or the API call fails you will receive `503 Service Unavailable`.

## Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Vite dev server proxies `/api` to `http://localhost:8000`. If the backend runs elsewhere, add `frontend/.env.local` with `VITE_API_BASE_URL=http://localhost:PORT` and restart `npm run dev`.

## Testing Endpoints
```bash
curl http://localhost:8000/api/summary
curl http://localhost:8000/api/sms | jq '.stats'
curl http://localhost:8000/api/calls | jq '.stats'
curl -X POST http://localhost:8000/api/classification \
  -H 'Content-Type: application/json' \
  -d '{"text":"Win a free cruise now!"}'
```

## Frontend Walkthrough
- **Home**: Overall metrics with date filtering.
- **SMS**: Category breakdown, recents table with filters (search + date range).
- **Calls**: Parallel insight view for call events with the same date controls.
- **Test**: Dedicated message tester that calls the live LLM classifier.

## Free Deployment Guide

### Backend (Render Free Web Service)
1. Push this project to GitHub (or fork it to a new repo).
2. Option A – quickest: import the provided `render.yaml` blueprint when creating the service (Render will prefill build/start commands and pin Python 3.11.9).
3. Option B – manual setup via dashboard:
   - *Branch*: `main`
   - *Build Command*: `pip install -r requirements.txt`
   - *Start Command*: `PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port 10000`
   - Under **Environment → Add Environment Variable** set `PYTHON_VERSION=3.11.9` so Render provisions Python 3.11.
4. Add application environment variables:
   - `OPENAI_API_KEY` – required
   - `OPENAI_MODEL`, `OPENAI_TEMPERATURE`, `OPENAI_MAX_OUTPUT_TOKENS` (optional overrides)
   - `CORS_ALLOW_ORIGINS` – JSON list of allowed origins, e.g. `["https://antispam-demo.vercel.app", "http://localhost:5173"]`
6. Deploy. Render will expose a URL like `https://antispam-api.onrender.com`. Verify `/health`.

> _Note_: Render’s free plan sleeps after 15 minutes of inactivity; expect a cold-start delay on the first call.

### Frontend (Vercel Free Project)
1. Create a Vercel account → `New Project` → import the same GitHub repo.
2. When prompted, set build options:
   - *Framework Preset*: Vite
   - *Build Command*: `npm run build`
   - *Output Directory*: `frontend/dist`
   - *Install Command*: `npm install`
   - *Root Directory*: `frontend`
3. Under **Environment Variables**, add `VITE_API_BASE_URL=https://antispam-api.onrender.com` (replace with your Render URL).
4. Deploy and grab the publicly accessible Vercel domain (e.g. `https://antispam-demo.vercel.app`).
5. Update the Render CORS allow list if the domain changes, then redeploy or trigger a restart.

### Local Testing Against Hosted API
- Frontend dev mode: `cd frontend && VITE_API_BASE_URL=https://antispam-api.onrender.com npm run dev`
- CLI check: `curl -X POST https://antispam-api.onrender.com/api/classification -H 'Content-Type: application/json' -d '{"text":"Test message"}'`

### Operational Tips
- Store the OpenAI key using Render’s **Secret Files** or dashboard env vars; avoid committing it.
- Monitor usage via OpenAI’s dashboard; even with free tiers, API calls incur costs.
- Consider adding basic auth or request signing if the API is exposed publicly.
- For more resilience, swap SQLite for a managed Postgres free tier (Render/Neon) before user pilots.

## Next Ideas
1. Add auth & multi-tenant datasets.
2. Cache LLM responses + support batched scoring jobs.
3. Persist aggregates via scheduled jobs.
