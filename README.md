# RepoLens AI (RepoFetcher)

**RepoLens** is an AI-powered software architecture intelligence platform. It analyzes repository structure, signals, and dependencies to predict architectural patterns, compare against curated benchmarks, detect structural gaps, and suggest flow improvements.

---

## Architecture Overview

The repository is organized into three production-ready layers:

```text
RepoFetcher/
├── api/                   # FastAPI Python backend (inference, similarity search, signals)
│   ├── main.py            # API routing, telemetry, CORS, and endpoints
│   ├── model.py           # DistilBERT transformer & nearest-neighbor semantic matcher
│   ├── idea_analyzer.py   # Project idea to architecture pattern & repository matcher
│   ├── github_detector.py # Live GitHub repository signal inspection
│   └── requirements.txt   # Python production dependencies
├── frontend/              # Next.js 16 (Turbopack + TailwindCSS) Web UI
│   ├── app/               # Next.js App Router (Studio, Explore, Dashboard)
│   ├── components/        # Architecture visualization & interactive components
│   └── package.json       # Frontend dependencies & scripts
├── src/                   # TypeScript dataset harvesting & adaptive balancing pipeline
│   ├── collectors/        # GitHub, Kaggle, and Web collectors
│   ├── cleaners/          # Feature normalizers and formatters
│   └── pipelines/         # Automated data cleaning & pruning
├── models/                # Production model weights, dense embeddings, & tokenizer
├── data/                  # Curated runtime datasets & architecture diagrams
├── Dockerfile             # Production Dockerfile for FastAPI backend
├── docker-compose.yml     # Multi-container orchestration (API + Frontend)
└── Procfile               # PaaS deployment specification (Render, Railway, Heroku)
```

---

## Deployment Guide

### Option 1: Docker Compose (Full Stack)

Deploy both the FastAPI backend and Next.js frontend together:

```bash
docker compose up --build -d
```

- **Frontend UI:** `http://localhost:3000`
- **FastAPI Docs:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

---

### Option 2: Cloud PaaS (Render / Railway / Fly.io / Heroku)

#### 1. Deploy API (Python Backend)
- **Root Directory:** `./`
- **Build Command:** `pip install -r api/requirements.txt`
- **Start Command:** `uvicorn api.main:app --host 0.0.0.0 --port $PORT` (or uses root `Procfile`)
- **Environment Variables:**
  - `PORT`: (set by host, defaults to 8000)
  - `CORS_ORIGINS`: `https://your-frontend-domain.vercel.app` (or `*`)
  - `GITHUB_TOKEN`: (optional, avoids GitHub rate-limits for `/detect-repo`)

#### 2. Deploy Frontend (Vercel / Netlify)
- **Root Directory:** `frontend`
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL`: `https://your-api-domain.onrender.com`

---

### Option 3: Local Development

#### 1. Backend (FastAPI)
```bash
# Install Python dependencies
pip install -r api/requirements.txt

# Start API server
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

#### 3. Harvesting Pipeline (TypeScript)
```bash
npm install
npm run dev
```

---

## Environment Variables

### Backend (`api/.env`)
| Variable | Default | Description |
|---|---|---|
| `PORT` | `8000` | HTTP port for uvicorn server |
| `HOST` | `0.0.0.0` | Host binding address |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed comma-separated origins or `*` |
| `GITHUB_TOKEN` | *(optional)* | Personal access token for live repo inspections |

### Frontend (`frontend/.env.local`)
| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base URL of the deployed FastAPI backend |

---

## Key API Endpoints

- `GET /health` — Service health and version status.
- `GET /stats` — Dataset summary metrics and real-time entropy/symmetry score.
- `POST /predict` — Predict architectural pattern from repository layers, language, frameworks, and README.
- `POST /detect-repo` — Automatically inspect a GitHub repository URL and return detected structure.
- `POST /analyze-idea` — Match free-text project ideas to similar architectural implementations.
- `GET /dataset/symmetry` — Dataset skewness and category deficit analytics.

---

## License

ISC License.
