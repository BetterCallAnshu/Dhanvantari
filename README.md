# Dhanvantari - Public Health Signal Fusion Agent - Setup Guide

## Requirements
- Node.js v22+
- Python 3.x

## Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
   (Python dependencies: This project uses only Python standard library modules, no `pip` install required.)
3. Create environment file:
   ```bash
   cp .env.example .env.local
   ```
4. Set your `GEMINI_API_KEY` in `.env.local`. 
   *Note: If no API key is provided, the reasoning agent will automatically use a deterministic local fallback.*

## Running the App
```bash
npm run dev
```
Open your browser to `http://localhost:3000`.

## Attribution & Originality
- **Third-Party Libraries/Datasets**: This project utilizes the Google Gemini API (`@google/genai`) for automated reasoning and analysis. It integrates public datasets (e.g., Kaggle census, healthcare, and air quality index data) as input for the fusion engine.
- **Originality**: The core signal fusion logic, risk-scoring algorithms, alert threshold definitions, and reporting/visualization components are original code written specifically for this project.
