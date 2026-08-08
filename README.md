# Dhanvantari - Multi-Signal Public Health Fusion Engine

Dhanvantari is an AI-powered public health multi-signal fusion and early-warning platform. It aggregates and synthesizes disparate signals—including vector-borne disease clusters, real-time Air Quality Index (AQI), hospital bed/ICU occupancy rates, demographic census data, and pharmaceutical surge trends—to forecast health risks across districts in India and trigger proactive emergency interventions.

---

## 🌟 Key Features

- **Multi-Signal Data Fusion**: Fuses 5 distinct data streams (Disease Trends, Air Quality/Environmental, Hospital Load, Pharmacy Demands, and Demographics) into a unified district composite risk score.
- **Multi-Agent AI Architecture**:
  - **Fusion Engine**: Normalizes and weights real-time data signals across districts.
  - **Risk Engine**: Calculates deterministic sub-scores and composite risk levels (`LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
  - **Gemini Reasoning Agent**: Utilizes Google's Gemini API for contextual clinical analysis and epidemic synthesis.
  - **Supervisor Agent**: Evaluates safety rules, validates model confidence, and issues automated public health alerts.
  - **Report Generator**: Produces executive markdown synthesis reports for health authorities.
- **Interactive Dashboard**:
  - Real-time heatmaps and risk level indicators.
  - Deep-dive district modal with signal radar breakdown.
  - Emergency stockpile mobilization triggers and alert logs.
- **Graceful High-Availability**: Automatically operates with Python 3 + Gemini API or falls back seamlessly to an internal TypeScript engine if Python is unavailable in the host environment.

---

## 🏗️ Architecture & Technology Stack

```text
├── src/                    # Frontend React + Vite Application
│   ├── components/         # Dashboard UI, Maps, Charts, Alert Panels
│   └── App.tsx             # Main Dashboard Controller
├── server.ts               # Express Backend API & Vite Dev Middleware
├── runner.py               # Python Multi-Agent Execution Entrypoint
├── supervisor.py           # Public Health Supervisor Agent & Safety Rules
├── reasoning_agent.py      # Gemini AI Clinical Reasoning Agent
├── fusion/                 # Signal Fusion & Deterministic Risk Engines
├── services/               # Data Loaders (AQI, Census, Hospital Capacity, Signals)
├── data/                   # Public Health CSV Datasets (India Census, Hospitals, AQI)
└── requirements.txt        # Python Requirements Documentation
```

### Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, Motion
- **Backend**: Express.js (Node.js ESM)
- **AI & Analytics Engine**: Python 3 (Standard Library + Gemini REST API)

---

## 📋 Prerequisites

- **Node.js**: `v18.0.0` or higher (Recommended `v20+` or `v22+`)
- **npm**: `v9.0.0` or higher
- **Python**: `3.10+` (Optional but recommended for running the Python multi-agent pipeline)
- **Gemini API Key**: Optional (Enables enhanced AI reasoning; default fallback provides deterministic risk scoring)

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

Define the following environment variable in `.env`:

```env
# Optional: Google Gemini API Key for AI Reasoning Agent
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🚀 How to Run Locally

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/dhanvantari-signal-fusion.git
cd dhanvantari-signal-fusion
```

### 2. Install Node Dependencies
```bash
npm install
```

*Note on Python Dependencies:* The Python multi-agent engine is built entirely with Python's standard library (`json`, `urllib.request`, `dataclasses`, `csv`, `argparse`). No extra `pip install` commands are required!

### 3. Start the Development Server
```bash
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`**.

---

## 📦 Production Build & Testing

### Build the Application
To verify TypeScript types and build the production bundle:

```bash
npm run build
```

### Start Production Server
```bash
npm start
```

---

## 🌐 Deploying to Hosting Platforms (e.g., Render)

When deploying to **Render**, **Railway**, or **Heroku**:

1. **Service Type**: Select **Web Service** (Node.js environment).
2. **Build Command**:
   ```bash
   npm install && npm run build
   ```
3. **Start Command**:
   ```bash
   npm start
   ```
4. **Environment Variables**:
   Add `GEMINI_API_KEY` under Environment Variables if you wish to enable live Gemini API calls.

---

## 📜 Attribution & Data Sources

- **Google Gemini API**: Used for public health scenario synthesis and narrative reasoning.
- **Public Datasets**: Integrated datasets derived from public health records, Indian Census records, hospital bed availability indices, and air quality monitor trends.
- **Originality**: All signal fusion algorithms, multi-agent orchestration pipelines, supervisor safety evaluation logic, and custom dashboard components were designed and developed specifically for Dhanvantari.
