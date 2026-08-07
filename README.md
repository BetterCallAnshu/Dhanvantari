Dhanvantari — Public Health Signal Fusion & Early Warning Platform

Dhanvantari is an autonomous, AI-assisted early warning system for public health emergencies. It fuses multi-source syndromic signals — weather, disease surveillance, hospital load, pharmacy demand, and air quality — with demographic and healthcare-capacity datasets to compute deterministic, explainable risk scores for districts, then layers a Gemini-powered reasoning agent on top to generate human-readable incident reports, citizen advisories, and resource allocation recommendations.

Named after Dhanvantari, the physician-deity of Ayurveda, the system is built around one core principle: the AI never decides the numbers — Python does. Gemini is only ever allowed to explain and communicate what deterministic code has already calculated.

Built as a hackathon prototype. See Limitations before treating this as production-ready.

Table of Contents
How It Works
Key Design Principle: Deterministic Risk, AI Explanation
Tech Stack
Project Structure
Getting Started
Environment Variables
Running the Pipeline
API Reference
Risk Scoring Methodology
Alerting Rules
Reports Generated
Data Sources & Attribution
Limitations & Known Issues
Roadmap
How It Works

Every monitoring cycle runs through five stages, orchestrated by runner.py:

┌─────────────────┐   ┌──────────────┐   ┌────────────────────┐   ┌──────────────────┐   ┌───────────────────┐
│  1. Fusion       │──▶│  2. Risk     │──▶│  3. Gemini          │──▶│  4. Supervisor    │──▶│  5. Report         │
│     Engine       │   │     Engine   │   │     Reasoning Agent │   │     Agent          │   │     Generator      │
│                  │   │              │   │                     │   │                    │   │                    │
│ Normalizes raw   │   │ 100% pure    │   │ Translates          │   │ Enforces alert     │   │ Produces Incident, │
│ signals + Kaggle │   │ Python       │   │ pre-computed scores │   │ threshold rules,   │   │ District Priority, │
│ datasets into    │   │ deterministic│   │ into narrative      │   │ fires alerts,      │   │ and Resource       │
│ DistrictSnapshot │   │ scoring      │   │ reasoning &         │   │ writes audit log   │   │ Request reports    │
│ objects          │   │              │   │ citizen advisories  │   │                    │   │                    │
└─────────────────┘   └──────────────┘   └────────────────────┘   └──────────────────┘   └───────────────────┘

A React + Leaflet dashboard (served via Express) visualizes district risk on a map, and a Node backend (server.ts) exposes REST endpoints that shell out to the Python pipeline (runner.py) as the source of truth for every computation.

Key Design Principle: Deterministic Risk, AI Explanation

This is the most important architectural rule in the codebase, and it's enforced at every layer:

fusion/fusion_engine.py and fusion/risk_engine.py compute every sub-score (weather, disease, hospital surge, pharmacy demand, AQI), confidence, and overall risk in pure Python — zero LLM involvement.
reasoning_agent.py (GeminiReasoningAgent) receives those numbers as read-only input. Its system prompt explicitly forbids Gemini from recalculating, adjusting, or contradicting risk scores — it only explains them.
supervisor.py fires alerts strictly off risk_score >= 75 and confidence_score >= 70, computed entirely by the risk engine — never off Gemini's output.
report_generator.py sorts every district priority ranking using the deterministic risk scores, never any ordering Gemini might suggest.
Every AI-authored recommendation across the system is hard-prefixed with [DRAFT - PENDING APPROVAL] and every report carries an explicit "DRAFT - PENDING APPROVAL" status — this system recommends, it never autonomously acts on citizens or resources.
If Gemini is unconfigured or the API call fails, reasoning_agent.py falls back to a 100% deterministic local JSON generator with the same schema, so the pipeline never breaks due to AI unavailability.
Tech Stack
Layer	Technology
Frontend	React 19, Vite 6, TypeScript, Tailwind CSS 4, Leaflet / React-Leaflet, Framer Motion, Lucide Icons
Backend (API)	Express 4, Node.js, tsx (dev) / esbuild (prod bundle)
Pipeline / Scoring	Python 3 (standard library only — no external pip dependencies for the core pipeline)
AI Reasoning	Google Gemini (gemini-3.5-flash) via direct REST calls (urllib.request), with deterministic local fallback
Data	Static CSV snapshots (India Census, Hospitals & Beds, Indian AQI Trends) loaded in-memory
Project Structure
Dhanvantari/
├── agents/              # Agent interface re-exports
├── config/               # Settings, thresholds, demo district list
├── dashboard/            # (Frontend dashboard assets)
├── data/                 # Cached Kaggle CSV snapshots (census, hospitals, AQI)
├── fusion/                # fusion_engine.py, risk_engine.py — deterministic scoring core
├── logs/                  # alerts.json audit log (generated at runtime)
├── models/                # Typed data models (signals, snapshot, risk, alerts, gemini schema)
├── reasoning/             # Reasoning agent interface re-exports
├── services/               # Kaggle dataset loaders (census, hospital, AQI, unified context)
├── src/                    # React frontend source (entry: src/main.tsx)
├── utils/                  # Shared utilities
├── reasoning_agent.py       # Gemini Reasoning Agent
├── report_generator.py       # Incident / Priority / Resource report generation
├── runner.py                  # Central pipeline orchestrator (CLI + JSON bridge)
├── supervisor.py               # Alert threshold enforcement & audit logging
├── server.ts                    # Express API server (bridges to runner.py)
├── index.html                    # Vite entry HTML
├── vite.config.ts                 # Vite build config
├── package.json                    # Node dependencies & scripts
└── CHANGELOG.md                     # Full phase-by-phase build history
Getting Started
Prerequisites
Node.js 18+ and npm
Python 3.9+ (standard library only — no pip install required for the core pipeline)
Installation
bash
git clone https://github.com/BetterCallAnshu/Dhanvantari.git
cd Dhanvantari
npm install
Configure environment variables
bash
cp .env.example .env.local

Then open .env.local and set your Gemini API key (see Environment Variables below).

No Gemini key? No problem. The reasoning agent automatically falls back to a fully deterministic local reasoning generator with the same JSON schema, so the app runs and produces complete reports either way — with real Gemini narrative if a key is present, or rule-based narrative if not.

Run
bash
npm run dev

Then open the URL printed in your terminal (default: http://localhost:3000).

Environment Variables

Create .env.local in the project root with:

Variable	Required	Description
GEMINI_API_KEY	No (optional)	Your Google Gemini API key. Enables live AI-generated reasoning, citizen advisories, and WhatsApp-style alert messages. Without it, the system uses its deterministic fallback reasoning generator.

.env.local is gitignored and must never be committed. A .env.example with the variable name (no real value) is provided as a template.

Running the Pipeline

Beyond the web UI, the pipeline can be run directly from the CLI:

bash
# Run a full monitoring cycle across default districts
python3 runner.py --action=cycle

# Run against a custom district list
python3 runner.py --action=cycle --districts="Ludhiana,Amritsar,Chandigarh"

# Simulate a signal spike to test alerting (e.g. a vector-borne outbreak)
python3 runner.py --action=simulate --district="Pune" --spike_type=vector_borne

# View district demographic/healthcare context
python3 runner.py --action=context --district="Ernakulam"

# View the persisted alert log
python3 runner.py --action=alerts

Available --spike_type values for simulation: vector_borne (default), water_borne, respiratory, heatwave.

API Reference

All routes are served by server.ts and internally call runner.py.

Method	Route	Description
GET	/api/health	Service health check
GET	/api/cycle	Returns the cached latest cycle, or triggers a new one if none cached
POST	/api/cycle	Runs a fresh monitoring cycle. Optional body: { "districts": string[] }
POST	/api/simulate	Injects a simulated signal spike. Body: { district, disease_score, weather_score, hospital_score, spike_type }
GET	/api/alerts	Returns the persisted alert audit log
GET	/api/context/:district	Returns demographic & healthcare-capacity context for a district
Risk Scoring Methodology

Computed entirely in fusion/risk_engine.py, with zero LLM involvement:

Sub-scores (0–100 each): Weather, Disease, Hospital Surge (adjusted for bed-capacity pressure), Pharmacy Demand, AQI Health Risk.
Population exposure adjustment: weighted using Kaggle census density data.
Confidence score: derived from signal source availability and cross-signal agreement.
Severity levels: LOW (0–39), MEDIUM (40–59), HIGH (60–74), CRITICAL (75+).
District ranking: strictly sorted by Python-computed overall risk score — Gemini never influences ranking order.
Alerting Rules

supervisor.py autonomously fires an alert only when both conditions are met:

Overall Risk Score  >= 75
AND
Confidence Score    >= 70

Every firing generates a unique alert ID, ISO timestamp, and audit log entry, and is persisted to logs/alerts.json. When thresholds aren't met, the system returns MONITORING_NORMAL. The supervisor never computes or overrides risk — it only enforces the rule.

Reports Generated

report_generator.py produces, every cycle:

Incident Reports — per-district, with severity level, evidence footprint, and Gemini/fallback narrative.
District Priority Report — strictly risk-score-ranked district list for resource triage.
Resource Request Summary — transparent, formula-based resource math (e.g. ORS = Hospital Score × Population Weight × 8, Test Kits = Disease Score × 20), inter-district medicine redistribution suggestions, and emergency camp mobilization triggers.

Every report is hard-stamped "DRAFT - PENDING APPROVAL" and includes an Evidence Used & Confidence section listing each signal source as ✓ Active or ✗ Unavailable, for full explainability.

Data Sources & Attribution
India Census, Hospitals & Beds, Indian AQI Trends — cached CSV snapshots derived from publicly available Kaggle datasets, loaded in-memory via services/.
Google Gemini API (gemini-3.5-flash) — used for the optional narrative reasoning layer only, never for scoring or ranking.
All fusion, risk-scoring, alerting, and report-generation logic is original code written for this project.

Syndromic signal feeds (weather, disease surveillance, hospital admissions, pharmacy sales, AQI) are currently simulated for demo purposes; source availability is explicitly tracked (LIVE, CACHED, SIMULATED, UNAVAILABLE) so missing feeds never silently zero-fill a score.

Limitations & Known Issues

This is a hackathon prototype, not a production system:

Live signal feeds are simulated, not connected to real government/hospital data sources.
Alert persistence writes to local JSON files (logs/alerts.json, alerts.json) — not durable or safe for multi-instance deployment.
The Node server invokes Python via a subprocess per request; this assumes a Python 3 runtime is available alongside Node in whatever environment runs it.
All reports and recommendations are explicitly draft-only and require human review before any real-world action — this system is decision support, not an autonomous responder.
Roadmap
Replace simulated signal feeds with live data connectors.
Move alert persistence to a proper database.
Add authentication and role-based access for health authority dashboards.
Expand district coverage beyond the current demo list.
