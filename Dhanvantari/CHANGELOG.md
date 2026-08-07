# CHANGELOG - Public Health Signal Fusion Agent

## [2026-08-07] - Phase 11: Deployment & Evaluation Readiness
### Added
- Created `/README.md` with setup, environment requirements, and run instructions.
- Added `/.env.example` placeholder.
- Added Python 3 preflight check in `/server.ts` to fail fast.
- Implemented `os.makedirs("logs", ...)` in `/supervisor.py` for filesystem robustness.
- Generated `/package-lock.json` and deleted `/bun.lock`.
- Documented deterministic local fallback in `/reasoning_agent.py` in `README.md`.

### Why
- Evaluator agents need a reliable, deterministic, simple setup path.
- Python dependencies are standard library, which simplifies setup and ensures reliability across diverse environments.
- Robustness against missing directories/read-only filesystem issues.

### Files Touched
- `/README.md`
- `/.env.example`
- `/server.ts`
- `/supervisor.py`
- `/CHANGELOG.md`
- `/package-lock.json`
- `/bun.lock` (deleted)

## [2026-08-06] - Phase 10: Report Generator
### Added
- Created `/report_generator.py` with `ReportGenerator`, `generate_incident_report()`, `generate_district_priority_report()`, `generate_resource_request_summary()`, and `generate_all_reports()`.
- Updated `/models/snapshot.py` with `to_evidence_list()` helper method.
- Added deterministic incident severity levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL` based on 0-39, 40-59, 60-74, 75+ risk score thresholds).
- Added transparent, formula-based resource calculations (ORS = Hospital Score × Pop Weight × 8, Doctors = Hospital Score × 0.2, Test Kits = Disease Score × 20, Mosquito Nets = (Weather + Disease) × 2, IV Fluids = Hospital Score × 3).
- Added multi-criteria emergency camp mobilization trigger logic (`Highest Risk District` AND `Hospital Score >= 60` AND `Disease Score >= 60` AND `Beds < 3000`).
- Added inter-district medicine redistribution calculations (`Low Risk Surplus` → `High Risk Deficit`).
- Added Explainable AI "Evidence Used & Confidence" footprint (`✓ Active` vs `✗ Unavailable` sources with confidence percentage) across all reports.

### Why
- Automatically generates Incident Reports, District Prioritization Reports, and Resource Allocation Request Summaries. Strictly sorts district priorities using Python deterministic risk scores (never Gemini ordering). Produces complete JSON, Markdown, and PDF-ready structural formats. Hard-enforces `"DRAFT - PENDING APPROVAL"` status across all outputs.

### Files Touched
- `/report_generator.py`
- `/models/snapshot.py`
- `/CHANGELOG.md`

## [2026-08-06] - Phase 9: Supervisor Agent
### Added
- Created `/supervisor.py` with `SupervisorAgent` and `evaluate_supervisor_rules()`.
- Updated `/agents/__init__.py` to re-export the supervisor agent interface.

### Why
- Evaluates outputs from Fusion Engine, Risk Engine, and Gemini Reasoning Agent. Enforces strict autonomous alert triggering rules (Risk >= 75 AND Confidence >= 70). Automatically generates unique alert IDs, ISO timestamps, and audit event logs, persisting triggered alerts directly to `logs/alerts.json` and `alerts.json`. Returns standard `MONITORING_NORMAL` state when thresholds are not met. Does NOT compute or alter risk scores.

### Files Touched
- `/supervisor.py`
- `/agents/__init__.py`
- `/CHANGELOG.md`

## [2026-08-06] - Phase 8: Gemini Reasoning Agent
### Added
- Created `/reasoning_agent.py` with `GeminiReasoningAgent` and `run_gemini_reasoning()`.
- Updated `/reasoning/__init__.py` to re-export the reasoning agent interface.
- Updated `/models/gemini.py` to match the exact JSON output contract.

### Why
- Provides qualitative epidemiological reasoning and operational recommendations for pre-computed risk metrics. Strictly receives Python pre-computed risk scores, confidence, sub-scores, evidence, and metadata. Strictly prohibited from computing or overriding risk, confidence, ranking, or thresholds. Enforces a strict JSON schema output (`risk_level`, `confidence`, `affected_district`, `reasoning_trace` with max 4 bullets, `recommendations` referencing weather, disease, hospital load, AQI, population, and resource availability, and `incident_summary`). Features 100% deterministic local fallback JSON generation if Gemini fails or is unconfigured.

### Files Touched
- `/reasoning_agent.py`
- `/reasoning/__init__.py`
- `/models/gemini.py`
- `/CHANGELOG.md`

## [2026-08-06] - Phase 7: Deterministic Risk Engine
### Added
- Created `/fusion/risk_engine.py` with `RiskEngine`, `compute_district_risk()`, and `evaluate_all_districts()`.
- Updated `/fusion/__init__.py` to re-export Risk Engine interfaces.

### Why
- Implements 100% pure Python deterministic scoring for Weather, Disease, Hospital Surge (with Kaggle bed capacity pressure modifier), Pharmacy Demand, and AQI Health Risk sub-scores. Calculates signal consensus/agreement, confidence, population exposure adjustments (Kaggle Census density), overall risk scores, district rankings, and autonomous alert criteria without invoking Gemini/LLM.

### Files Touched
- `/fusion/risk_engine.py`
- `/fusion/__init__.py`
- `/CHANGELOG.md`

## [2026-08-06] - Phase 6: Signal Fusion Engine
### Added
- Created `/fusion/fusion_engine.py` with `FusionEngine`, `fuse_district_signals()`, and `fuse_all_district_signals()`.
- Updated `/fusion/__init__.py` to re-export the fusion engine interface.

### Why
- Normalizes and consolidates multi-source syndromic signals (weather, disease, hospital, pharmacy, AQI, NDMA, RSS) alongside Kaggle census and healthcare capacity datasets into unified `DistrictSnapshot` objects. Explicitly tracks source availability (`LIVE`, `CACHED`, `SIMULATED`, `UNAVAILABLE`) so missing feeds never break the pipeline or silently zero-fill metrics. Zero LLM math, zero UI coupling.

### Files Touched
- `/fusion/fusion_engine.py`
- `/fusion/__init__.py`
- `/CHANGELOG.md`

## [2026-08-06] - Phase 3: Kaggle Dataset Integration Layer
### Added
- Created CSV cached snapshots for India Census (`/data/census_india.csv`), Hospitals & Beds (`/data/hospitals_beds_india.csv`), and Indian AQI Trends (`/data/indian_aqi_trends.csv`).
- Created `/services/census_loader.py` with `get_population()`, `get_population_density()`, `get_demographics()`, and fuzzy district name normalization.
- Created `/services/hospital_loader.py` with `get_hospital_capacity()`, `get_total_beds()`, and `get_healthcare_index()`.
- Created `/services/aqi_loader.py` with `get_aqi()` and `get_aqi_trend()`.
- Created `/services/dataset_loader.py` as a unified in-memory manager providing zero-dependency cached lookups and district context objects (`get_district_context()`).
- Updated `/services/__init__.py` to re-export dataset loaders.

### Why
- Provides fast, zero-dependency, in-memory enrichment data (demographics, hospital capacity, AQI) to contextualize syndromic signals during fusion and reasoning, while ensuring graceful fallback for unlisted districts without triggering Streamlit or Gemini dependencies.

### Files Touched
- `/data/census_india.csv`
- `/data/hospitals_beds_india.csv`
- `/data/indian_aqi_trends.csv`
- `/services/census_loader.py`
- `/services/hospital_loader.py`
- `/services/aqi_loader.py`
- `/services/dataset_loader.py`
- `/services/__init__.py`
- `/CHANGELOG.md`

## [2026-08-06] - Phase 2: Shared Data Models & System Configuration
### Added
- Created `/config/settings.py` containing polling intervals, signal weights, threshold constants (`ALERT_RISK_THRESHOLD=75.0`, `ALERT_CONFIDENCE_THRESHOLD=70.0`), demo districts list, and system prompt contracts.
- Created `/models/signals.py` defining data models for Weather, Disease, Hospital, Pharmacy, AQI, NDMA, RSS feeds, Census, and Hospital Capacity signals with source availability statuses (`LIVE`, `CACHED`, `SIMULATED`, `UNAVAILABLE`).
- Created `/models/snapshot.py` defining `DistrictSnapshot` which fuses multi-source raw & normalized signals for evaluation cycles.
- Created `/models/risk.py` defining `SubScores`, `DistrictRiskResult`, and `OverallRiskResult` (100% deterministic Python scoring targets).
- Created `/models/alerts.py` defining `AlertEvent`, `IncidentReport`, `ResourceRequestDraft`, and `DecisionRecommendation` (hard-enforced with `"DRAFT - PENDING APPROVAL"` status).
- Created `/models/gemini.py` defining `GeminiReasoningInput` and PRD Section 6 strict JSON schema contract `GeminiReasoningOutput`.
- Created `/models/schemas.py` defining dataset headers for synthetic generators and Kaggle loaders.
- Updated `/models/__init__.py` and `/config/__init__.py` to re-export clean interface models.

### Why
- Provides standard, strongly-typed internal interfaces and schemas across all pipeline agents without business logic coupling or premature LLM scoring dependencies.

### Files Touched
- `/config/settings.py`
- `/config/__init__.py`
- `/models/signals.py`
- `/models/snapshot.py`
- `/models/risk.py`
- `/models/alerts.py`
- `/models/gemini.py`
- `/models/schemas.py`
- `/models/__init__.py`
- `/CHANGELOG.md`

## [2026-08-06] - Initial Project Foundation & Directory Architecture
### Added
- Created PRD-compliant modular directory structure (`/config`, `/models`, `/agents`, `/fusion`, `/reasoning`, `/dashboard`, `/utils`, `/data`, `/logs`, `/services`).
- Added root `CHANGELOG.md` to track architectural changes, reasons, and file touch history per Section 8.
- Updated `metadata.json` app name and description to reflect the Public Health Signal Fusion Agent.

### Why
- Establishes clean separation of concerns and single-responsibility modules as mandated in Section 2.2 and Section 8 of the PRD.

### Files Touched
- `/CHANGELOG.md`
- `/config/__init__.py`
- `/models/__init__.py`
- `/agents/__init__.py`
- `/fusion/__init__.py`
- `/reasoning/__init__.py`
- `/dashboard/.gitkeep`
- `/utils/__init__.py`
- `/data/.gitkeep`
- `/logs/.gitkeep`
- `/services/__init__.py`
- `/metadata.json`
