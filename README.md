# Dhanvantari — Multi-Signal Public Health Fusion Engine

> **AI-powered epidemic early-warning platform.**
> Fuses disease surveillance, air quality, hospital load, pharmacy demand, and weather/census signals into a deterministic district risk score, then uses an LLM reasoning agent — bounded by a rule-based supervisor — to turn that score into an actionable SITREP.

### 🌐 [**Live Demo → dhanvantari-t2so.onrender.com**](https://dhanvantari-t2so.onrender.com/)

---

> ⚠️ **Important — repo layout:** the actual project (`package.json`, `server.ts`, all source folders) lives inside the **`Dhanvantari core/`** subfolder, not the repo root. `cd "Dhanvantari core"` before running any command below, and set `Dhanvantari core` as the root directory in any hosting dashboard.

---

## What it does

Dhanvantari monitors a set of Indian districts and, on each cycle, answers three questions for public health officers:

1. **How bad is it right now?** — a 0–100 Composite District Risk Index, computed deterministically.
2. **Why?** — a plain-language epidemiological explanation of which signals are driving the score.
3. **What should we do?** — draft mobilization/resource recommendations, gated so they only fire when risk *and* confidence both clear a hard threshold.

The system is explicitly split so that **no single LLM call can invent a risk score or silently trigger a real-world alert** — math and policy are deterministic Python; only the narrative layer is generative.

---

## Architecture

```
 Data sources                     Deterministic core                    AI + policy layer
 ─────────────                    ──────────────────                    ─────────────────
 Disease surveillance   ┐
 AQI telemetry          │
 Hospital bed capacity  ├──▶  Fusion Engine   ──▶  Risk Engine   ──▶  Gemini Reasoning Agent
 Pharmacy demand        │     (normalizes into        (weighted           (explains the score,
 Weather / IMD alerts   │      a DistrictSnapshot)      sub-scores,         drafts a SITREP —
 Census & NDMA/RSS      ┘                               confidence,        never recalculates it)
                                                         agreement bonus)          │
                                                              │                    ▼
                                                              └──▶  Supervisor Agent
                                                                    (Risk ≥ 75 AND Confidence ≥ 70
                                                                     → auto-fires alert, else monitors)
                                                                              │
                                                                              ▼
                                                                    Report Generator → SITREP + alerts.json
```

### Components

| Component | File(s) | Responsibility |
|---|---|---|
| **Fusion Engine** | `fusion/fusion_engine.py` | Pulls weather, disease, hospital, pharmacy, AQI, NDMA, RSS, and census signals per district and normalizes them into a single `DistrictSnapshot`. Never touches Gemini, never scores risk. |
| **Risk Engine** | `fusion/risk_engine.py` | 100% pure-Python, deterministic. Computes per-signal sub-scores (weather, disease, hospital, pharmacy, AQI — weighted 0.20 / 0.35 / 0.25 / 0.15 / 0.05), an inter-signal agreement bonus, a confidence score, and the final `overall_risk_score` + `risk_level` (LOW/MODERATE/HIGH/CRITICAL). Identical inputs always produce identical outputs. |
| **Reasoning Agent** | `reasoning_agent.py` | Calls Gemini with the pre-computed scores and a strict system prompt forbidding it from altering any number. Returns structured JSON: narrative assessment, likely disease vectors, recommended countermeasures. If no `GEMINI_API_KEY` is set (or the call fails), it deterministically falls back to a local rule-based generator — the app never breaks from a missing key. |
| **Supervisor Agent** | `supervisor.py` | Policy enforcement only — does not compute risk. Checks `risk_score ≥ 75` **and** `confidence_score ≥ 70`; if both hold, auto-fires an `AlertEvent`, logs an audit entry, and persists it to `logs/alerts.json` / `alerts.json`. Otherwise the district is logged as `MONITORING_NORMAL`. |
| **Report Generator** | `report_generator.py` | Compiles the fused snapshot, risk breakdown, reasoning output, and supervisor decision into a structured Markdown SITREP per district. |
| **Pipeline Runner** | `runner.py` | Orchestrates one full cycle (Fusion → Risk → Reasoning → Supervisor → Report) across the monitored districts; used by both the CLI and the Express backend. |
| **Frontend** | `src/` (React 19 + TypeScript + Vite) | District risk map, signal breakdown modals, live alert log, printable SITREPs. |
| **Backend** | `server.ts` (Express) | Serves the frontend and bridges to the Python pipeline; if Python isn't available on the host, degrades gracefully to a built-in TypeScript fallback data engine. |

`agents/` and `reasoning/` are currently placeholder packages (`__init__.py` only) reserved for further agent decomposition — the working agent logic lives in the top-level `reasoning_agent.py`, `supervisor.py`, and `fusion/` today.

---

## Monitored districts (demo scope)

Kamrup Metropolitan, Patna, Ernakulam, Wayanad, Pune, Chennai, Ludhiana, Amritsar, Jalandhar, Patiala, SAS Nagar (Mohali), Chandigarh — configurable in `config/settings.py`.

---

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Leaflet/react-leaflet, Motion
- **Backend:** Express (Node.js, ESM/CJS build via esbuild), Python 3 (standard library — zero extra `pip` installs)
- **AI:** `@google/genai`, Gemini (with deterministic local fallback if no API key is configured)

---

## Quickstart

**Prerequisites:** Node.js 18+, npm 9+, Python 3.10+ (optional — used for the deterministic pipeline; the app falls back to a TypeScript engine if Python isn't found).

```bash
git clone https://github.com/BetterCallAnshu/Dhanvantari.git
cd "Dhanvantari/Dhanvantari core"

npm install

cp .env.example .env.local
# set GEMINI_API_KEY in .env.local (optional — omit it to run on the local fallback reasoning engine)

npm run dev
```

App runs at `http://localhost:3000`.

### Running the deterministic pipeline standalone (CLI)

```bash
python3 runner.py
```

---

## Deployment (Render / Railway / Cloud Run)

- **Build command:** `npm install && npm run build`
- **Start command:** `npm start`
- **Root directory:** `Dhanvantari core` — the project (`package.json`, `server.ts`, all source folders) lives inside this subfolder, not the repo root. Set this explicitly in your hosting provider's dashboard (e.g. Render's "Root Directory" field) or the build will fail to find `package.json`.
- **Env vars:** `GEMINI_API_KEY` (optional)

---

## Design principles

- **Separation of computation and generation.** All numeric scoring is deterministic Python. The LLM only ever explains or narrates numbers it's handed — it's explicitly instructed never to recalculate them.
- **Graceful degradation.** No Gemini key → local fallback reasoning. No Python on host → TypeScript fallback data engine. The app is designed to never hard-fail from a missing external dependency.
- **Auditable alerting.** Every auto-triggered alert is logged with its risk score, confidence score, and the exact threshold rule that fired it, persisted to `alerts.json`.

---

## Attribution & originality

- **Third-party:** Google Gemini API (`@google/genai`) for reasoning/narrative generation; public Indian census, hospital-capacity, and AQI datasets as fusion inputs.
- **Original:** signal fusion logic, deterministic risk-scoring formula, alert threshold rules, supervisor policy enforcement, and report/visualization layer are original code for this project.

---

## License

Built for public health monitoring and early outbreak intervention.
