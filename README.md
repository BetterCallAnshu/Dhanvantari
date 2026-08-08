# Dhanvantari - Multi-Signal Public Health Fusion Engine

> **AI-Powered Epidemic Early Warning & Multi-Agent Intelligence Platform**  
> *Fusing real-time epidemiological signals, environmental telemetry, hospital infrastructure load, census demographics, and pharmaceutical surge trends to prevent healthcare system collapse.*

🌐 **Live Application**: [https://dhanvantari-t2so.onrender.com/](https://dhanvantari-t2so.onrender.com/)

---

## 🏆 System Overview & Value Proposition

**Dhanvantari** is an enterprise-grade public health surveillance platform designed to detect epidemic outbreaks and resource bottlenecks days before traditional reporting channels.

By orchestrating a **multi-agent AI workflow**, Dhanvantari aggregates 5 non-linearly correlated data streams across Indian districts, calculates deterministic sub-risk indices, and applies LLM clinical reasoning (Google Gemini) alongside deterministic supervisor safety checks to issue proactive mobilization triggers.

### Key Pillars of Innovation

- **Multi-Signal Data Fusion**: Fuses 5 distinct data streams into a normalized Composite District Risk Index (CDRI).
- **Hierarchical Multi-Agent Architecture**: Separates deterministic mathematical risk scoring from generative clinical reasoning and rule-bound safety supervision.
- **Resilient Hybrid Fallback Engine**: Seamlessly executes using Python standard library & Gemini API or auto-degrades gracefully to an internal TypeScript engine if external microservices or API keys are unconfigured.
- **Actionable Decision Support**: Automatically generates executive SITREPs (Situation Reports) and stock-level mobilization recommendations for public health officers.

---

## 🏗️ Technical Architecture & Agent Orchestration

```text
                                 ┌─────────────────────────┐
                                 │   Multi-Signal Inputs   │
                                 └────────────┬────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
         [Disease Cluster Data]      [AQI Telemetry Data]      [Hospital Load & ICU]
                    │                         │                         │
                    └─────────────────────────┼─────────────────────────┘
                                              │
                                              ▼
                                 ┌─────────────────────────┐
                                 │  1. Signal Fusion Engine│
                                 │    (Normalization &     │
                                 │     Weighting Matrix)   │
                                 └────────────┬────────────┘
                                              │
                                              ▼
                                 ┌─────────────────────────┐
                                 │    2. Risk Engine       │
                                 │  (Deterministic Score)  │
                                 └────────────┬────────────┘
                                              │
                                 ┌────────────┴────────────┐
                                 ▼                         ▼
                    ┌─────────────────────────┐ ┌─────────────────────────┐
                    │ 3. Gemini Reasoning     │ │ 4. Supervisor Safety    │
                    │    Agent                │ │    Agent                │
                    │ (Clinical Risk Analysis)│ │ (Rule & Bounds Check)   │
                    └────────────┬────────────┘ └────────────┬────────────┘
                                 │                         │
                                 └────────────┬────────────┘
                                              │
                                              ▼
                                 ┌─────────────────────────┐
                                 │ 5. Report & Alert Engine│
                                 │ (SITREP & Action Logs)  │
                                 └─────────────────────────┘
```

### Agent Roles & Responsibilities

1. **Signal Fusion Engine**: Loads and harmonizes heterogeneous data formats (CSV/JSON) across 5 parameters: Disease Incident Spike, Environmental AQI Index, Hospital Bed Occupancy, Pharmacy Antibiotic Surge, and Census Vulnerability.
2. **Deterministic Risk Engine**: Computes weighted risk sub-scores, determining categorical risk levels (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
3. **Gemini Reasoning Agent**: Receives fused context to synthesize narrative epidemiological assessments, potential disease vectors, and recommended clinical countermeasures.
4. **Supervisor Agent**: Validates AI outputs against hard safety boundaries (e.g., verifying confidence thresholds, preventing false positives, checking stockpile threshold bounds).
5. **Report Generator**: Compiles rich, structured Markdown SITREPs for district healthcare administration.

---

## 🛠️ Tech Stack & Dependencies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion
- **Backend / Microservices**: Express.js (Node.js CJS/ESM), Python 3 (Standard Library + Gemini REST Integration)
- **AI Framework**: `@google/genai` / Gemini 1.5/2.0 API Integration with deterministic rule-based fallbacks

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Python** (Optional): `3.10+` (Uses Python standard library; zero extra pip dependencies required)

### 2. Installation & Running
```bash
# Clone the repository
git clone https://github.com/BetterCallAnshu/Dhanvantari.git
cd Dhanvantari

# Install Node.js dependencies
npm install

# Configure Environment Variables (Optional)
cp .env.example .env

# Launch Development Server
npm run dev
```

The application will be accessible at **`http://localhost:3000`**.

---

## 🌐 Deployment Configuration (Render, Railway, Cloud Run)

When deploying to platforms like **Render**:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Root Directory**: `./` (Ensure the root directory points to the repository base where `package.json` resides).
- **Environment Variables**:
  - `GEMINI_API_KEY`: *(Optional)* API key for live Gemini AI synthesis.

---

## 🎯 Evaluation Checklist & Highlights

| Evaluation Criteria | Implementation Details |
| :--- | :--- |
| **System Architecture** | Clean multi-agent decoupled pipeline separating math logic, LLM reasoning, and safety guardrails. |
| **Technical Rigor** | Full TypeScript type-safety across frontend and server, graceful fallback mechanisms, responsive charting. |
| **Real-World Impact** | Solves critical public health bottleneck by fusing non-traditional early indicator signals (pharmacy trends + AQI) with traditional hospital load. |
| **User Experience** | Interactive district heatmaps, signal breakdown modal dialogs, real-time alert logs, and printable report generation. |

---

## 📜 License & Acknowledgments

Built for public health monitoring and early outbreak intervention. Integrates public Indian census, hospital capacity, and air quality indices.
