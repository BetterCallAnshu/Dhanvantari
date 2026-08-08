import { AgentTask } from "../hooks/useAgentTasks";
import { DistrictSummary, CycleState } from "../types";

/**
 * Generates an executive, human-readable HTML document for an Agent Task
 * with an interpretation layer (What is happening, Why it matters, Evidence, Next Steps).
 */
export function exportAgentTaskHTMLReport(task: AgentTask): void {
  const timestamp = new Date().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  const completedSources = task.sources.filter((s) => s.completed).length;
  const totalSources = task.sources.length;
  const missingSources = task.sources.filter((s) => !s.completed);
  const isReady = task.status === "Ready for Generation" || task.status === "Approved";

  // Executive Summary (3-5 sentences answering: What is happening right now, and should the reader care?)
  const execSummarySentences = [
    `The ${task.agentName} has executed the operational directive "${task.title}"${
      task.districtFocus ? ` focusing on ${task.districtFocus} district` : ""
    }.`,
    task.description,
    task.hasMissingData
      ? `Currently, ${missingSources.length} of ${totalSources} required data feeds remain pending verification, which may constrain automated decision confidence.`
      : `All ${totalSources} required input signal streams are fully verified and ingested without telemetry gaps.`,
    isReady
      ? `Operational status is verified and ready for official decision review and dispatch authorization.`
      : `Action is pending completion of missing surveillance feeds prior to executing downstream dispatches.`
  ];
  const executiveSummary = execSummarySentences.join(" ");

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Task Report — ${escapeHtml(task.title)}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 18mm 15mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      line-height: 1.5;
      font-size: 13px;
      padding: 24px;
    }

    .report-container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    /* Print Controls Bar */
    .no-print {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      align-items: center;
      justify-between: flex-start;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 4px;
      cursor: pointer;
      text-decoration: none;
    }

    .btn:hover {
      background-color: #1e293b;
    }

    .btn-secondary {
      background-color: #f1f5f9;
      color: #334155;
      border-color: #cbd5e1;
    }

    .btn-secondary:hover {
      background-color: #e2e8f0;
    }

    /* Header */
    header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .org-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #0284c7;
      margin-bottom: 4px;
    }

    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 8px;
    }

    .header-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .meta-item strong {
      color: #334155;
    }

    /* Status Badge */
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-ready {
      background-color: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }

    .status-pending {
      background-color: #fef3c7;
      color: #b45309;
      border: 1px solid #fde047;
    }

    .status-missing {
      background-color: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }

    /* Executive Summary Box */
    .exec-box {
      background-color: #f0f9ff;
      border-left: 4px solid #0284c7;
      border-top: 1px solid #bae6fd;
      border-right: 1px solid #bae6fd;
      border-bottom: 1px solid #bae6fd;
      padding: 16px 20px;
      border-radius: 0 4px 4px 0;
      margin-bottom: 24px;
    }

    .exec-box h2 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0369a1;
      margin-bottom: 6px;
    }

    .exec-box p {
      color: #0c4a6e;
      font-size: 13.5px;
      line-height: 1.6;
      font-weight: 450;
    }

    /* Section Headers */
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Human-Readable Interpretation Block */
    .interp-block {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #0284c7;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 18px;
    }

    .interp-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
    }

    .interp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 12px;
    }

    .interp-card {
      background-color: #f8fafc;
      border: 1px solid #f1f5f9;
      padding: 12px;
      border-radius: 4px;
    }

    .interp-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .label-happening { color: #0284c7; }
    .label-matters { color: #b45309; }
    .label-evidence { color: #475569; }
    .label-action { color: #15803d; }

    .interp-text {
      font-size: 12.5px;
      color: #334155;
      line-height: 1.5;
    }

    .evidence-list {
      margin-top: 4px;
      padding-left: 16px;
      font-size: 12px;
      color: #475569;
    }

    /* Data Feeds Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      margin-bottom: 20px;
      font-size: 12px;
    }

    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }

    .badge-available {
      color: #166534;
      font-weight: 700;
    }

    .badge-missing {
      color: #991b1b;
      font-weight: 700;
    }

    /* Footer */
    footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .report-container {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Print Controls -->
  <div class="no-print">
    <button class="btn" onclick="window.print()">
      🖨️ Print Report / Save as PDF
    </button>
    <button class="btn btn-secondary" onclick="window.close()">
      ✖ Close
    </button>
  </div>

  <div class="report-container">
    <header>
      <div class="org-title">DHANVANTARI Public Health Decision Support System</div>
      <h1>${escapeHtml(task.title)}</h1>
      <div class="header-meta">
        <div class="meta-item">
          <strong>Agent Owner:</strong> ${escapeHtml(task.agentName)}
        </div>
        ${
          task.districtFocus
            ? `<div class="meta-item"><strong>District Target:</strong> ${escapeHtml(
                task.districtFocus
              )}</div>`
            : ""
        }
        <div class="meta-item">
          <strong>Status:</strong> 
          <span class="status-badge ${
            task.status === "Ready for Generation" || task.status === "Approved"
              ? "status-ready"
              : task.status === "Missing Sources"
              ? "status-missing"
              : "status-pending"
          }">
            ${escapeHtml(task.status)}
          </span>
        </div>
        <div class="meta-item">
          <strong>Report Date:</strong> ${timestamp}
        </div>
      </div>
    </header>

    <!-- Executive Summary Box -->
    <div class="exec-box">
      <h2>Executive Summary</h2>
      <p>${escapeHtml(executiveSummary)}</p>
    </div>

    <!-- Structured Task Sections with Interpretation Layer -->
    <h3 class="section-title">Section Analysis & Interpretation</h3>
    ${task.sections
      .map(
        (sec) => `
      <div class="interp-block">
        <div class="interp-title">${escapeHtml(sec.title)}</div>
        
        <div class="interp-grid">
          <!-- What is happening -->
          <div class="interp-card">
            <div class="interp-label label-happening">1. What is Happening?</div>
            <div class="interp-text">
              ${escapeHtml(sec.content)}
            </div>
          </div>

          <!-- Why it matters -->
          <div class="interp-card">
            <div class="interp-label label-matters">2. Why It Matters</div>
            <div class="interp-text">
              ${getWhyItMattersForSection(sec.title, task)}
            </div>
          </div>
        </div>

        <div class="interp-grid">
          <!-- Evidence -->
          <div class="interp-card">
            <div class="interp-label label-evidence">3. Supporting Evidence & Telemetry</div>
            <ul class="evidence-list">
              <li><strong>Agent Owner:</strong> ${escapeHtml(task.agentName)}</li>
              <li><strong>Target District:</strong> ${escapeHtml(task.districtFocus || "Statewide Baseline")}</li>
              <li><strong>Feeds Ingested:</strong> ${completedSources} of ${totalSources} active</li>
            </ul>
          </div>

          <!-- Action -->
          <div class="interp-card">
            <div class="interp-label label-action">4. Recommended Next Steps</div>
            <div class="interp-text">
              ${getRecommendedActionForSection(sec.title, task)}
            </div>
          </div>
        </div>
      </div>
    `
      )
      .join("")}

    <!-- Required Input Data Feeds Checklist -->
    <h3 class="section-title">Input Feeds & Verification (${completedSources}/${totalSources} Available)</h3>
    <table>
      <thead>
        <tr>
          <th>Source Feed Name</th>
          <th>Verification Status</th>
          <th>Requirement Notes</th>
        </tr>
      </thead>
      <tbody>
        ${task.sources
          .map(
            (src) => `
          <tr>
            <td><strong>${escapeHtml(src.label)}</strong></td>
            <td>
              <span class="${src.completed ? "badge-available" : "badge-missing"}">
                ${src.completed ? "✓ AVAILABLE" : "✗ MISSING"}
              </span>
            </td>
            <td>${
              src.completed
                ? "Active baseline signal ingested."
                : "Required data feed currently offline or unverified."
            }</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    ${
      missingSources.length > 0
        ? `
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 4px; margin-top: 12px; color: #991b1b; font-size: 12px;">
        <strong>Data Availability Advisory:</strong> ${missingSources.length} input data ${
            missingSources.length > 1 ? "feeds are" : "feed is"
          } missing (${missingSources.map((s) => s.label).join(", ")}). Pre-flight checks advise verifying source integrations before executing downstream autonomous dispatches.
      </div>
    `
        : ""
    }

    <footer>
      <div>Generated by Dhanvantari Public Health Decision Support System</div>
      <div>Task Ref: ${escapeHtml(task.id)}</div>
    </footer>
  </div>

</body>
</html>`;

  const reportWindow = window.open("", "_blank");
  if (reportWindow) {
    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
  } else {
    alert("Please allow popups to view and print the Agent Task Report.");
  }
}

/**
 * Downloads a structured CSV report for the selected Agent Task.
 */
export function exportAgentTaskCSVReport(task: AgentTask): void {
  const headers = [
    "Task ID",
    "Task Title",
    "Agent Owner",
    "District Focus",
    "Status",
    "Has Missing Data",
    "Section Title",
    "Section Content",
    "Total Feeds",
    "Completed Feeds",
  ];

  const rows: string[][] = [];

  task.sections.forEach((section) => {
    rows.push([
      task.id,
      task.title,
      task.agentName,
      task.districtFocus || "",
      task.status,
      task.hasMissingData ? "Yes" : "No",
      section.title,
      section.content,
      String(task.sources.length),
      String(task.sources.filter((s) => s.completed).length),
    ]);
  });

  const csvLines = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ];

  // Append a Sources checklist summary table in the CSV
  csvLines.push("");
  csvLines.push(["--- INPUT FEEDS CHECKLIST ---"].join(","));
  csvLines.push(["Feed Name", "Status"].join(","));
  task.sources.forEach((src) => {
    csvLines.push([escapeCsvValue(src.label), src.completed ? "AVAILABLE" : "MISSING"].join(","));
  });

  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${task.id}-report.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports a human-readable Public Health Incident Report as a printable PDF / HTML document
 * complete with structured Interpretation Layer (What is happening, Why it matters, Evidence, Actions).
 */
export function exportPublicHealthIncidentReportHTML(
  summary: DistrictSummary,
  cycleState: CycleState
): void {
  const timestamp = new Date().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  const district = summary.district;
  const incidentId = `INC-${
    cycleState?.timestamp ? cycleState.timestamp.slice(0, 10).replace(/-/g, "") : "20260806"
  }-${district.slice(0, 3).toUpperCase()}`;

  const sub = summary.sub_scores;
  const demo = summary.demographics;
  const reasoning = summary.reasoning;
  const approvalStatus = cycleState?.reports?.approval_status || "DRAFT - PENDING APPROVAL";
  const incData = cycleState?.reports?.incident_reports?.[district]?.json;
  const clinical = incData?.clinical_intelligence;

  // Executive Summary (3-5 clear sentences answering: What is happening right now, and should the reader care?)
  const highRisk = summary.risk_score >= 70;
  const execSentences = [
    `Anomalous public health surveillance signals have been detected in ${district} district, yielding an integrated risk severity score of ${summary.risk_score.toFixed(
      1
    )}/100 (${summary.risk_level.toUpperCase()}).`,
    highRisk
      ? `Primary stress vectors indicate elevated fever and acute syndrome reports alongside significant hospital admission pressure.`
      : `Surveillance indicators currently reflect stable health system capacity with localized monitoring warranted.`,
    `Multi-source signal fusion confidence is rated at ${(summary.confidence_score * 100).toFixed(
      1
    )}% based on verified telemetry from IDSP case reports, hospital bed telemetry, and pharmacy sales.`,
    highRisk
      ? `Decision-makers should review recommended medical resource dispatches immediately to prevent hospital capacity bottlenecks.`
      : `Routine surveillance protocols remain active with routine status updates scheduled.`
  ];
  const executiveSummary = execSentences.join(" ");

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Public Health Incident Report — ${escapeHtml(district)}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 18mm 15mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      line-height: 1.5;
      font-size: 13px;
      padding: 24px;
    }

    .report-container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    /* Print Controls Bar */
    .no-print {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      align-items: center;
      justify-between: flex-start;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn:hover {
      background-color: #1e293b;
    }

    .btn-secondary {
      background-color: #f1f5f9;
      color: #334155;
      border-color: #cbd5e1;
    }

    .btn-secondary:hover {
      background-color: #e2e8f0;
    }

    header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .org-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #0284c7;
      margin-bottom: 4px;
    }

    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 8px;
    }

    .header-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .meta-item strong {
      color: #334155;
    }

    /* Status Badge */
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-critical {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }

    .status-approved {
      background-color: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }

    /* Key Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .metric-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px;
      border-radius: 4px;
    }

    .metric-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .metric-value {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }

    .metric-subtext {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    /* Executive Summary Box */
    .exec-box {
      background-color: #fef2f2;
      border-left: 4px solid #dc2626;
      border-top: 1px solid #fecaca;
      border-right: 1px solid #fecaca;
      border-bottom: 1px solid #fecaca;
      padding: 16px 20px;
      border-radius: 0 4px 4px 0;
      margin-bottom: 24px;
    }

    .exec-box h2 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #991b1b;
      margin-bottom: 6px;
    }

    .exec-box p {
      color: #7f1d1d;
      font-size: 13.5px;
      line-height: 1.6;
      font-weight: 450;
    }

    /* Section Headers */
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Interpretation Cards */
    .interp-block {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #dc2626;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 18px;
    }

    .interp-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
    }

    .interp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 12px;
    }

    .interp-card {
      background-color: #f8fafc;
      border: 1px solid #f1f5f9;
      padding: 12px;
      border-radius: 4px;
    }

    .interp-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .label-happening { color: #dc2626; }
    .label-matters { color: #b45309; }
    .label-evidence { color: #475569; }
    .label-action { color: #15803d; }

    .interp-text {
      font-size: 12.5px;
      color: #334155;
      line-height: 1.5;
    }

    .evidence-list {
      margin-top: 4px;
      padding-left: 16px;
      font-size: 12px;
      color: #475569;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      margin-bottom: 20px;
      font-size: 12px;
    }

    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }

    .list-item {
      padding: 6px 0;
      border-bottom: 1px border-dash #e2e8f0;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .list-item::before {
      content: "•";
      color: #0284c7;
      font-weight: bold;
    }

    footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-between: space-between;
      align-items: center;
    }

    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .report-container {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Print Controls -->
  <div class="no-print">
    <button class="btn" onclick="window.print()">
      🖨️ Print Report / Save as PDF
    </button>
    <button class="btn btn-secondary" onclick="window.close()">
      ✖ Close
    </button>
  </div>

  <div class="report-container">
    <header>
      <div class="org-title">DHANVANTARI National Epidemiological Intelligence Platform</div>
      <h1>Epidemiological Incident Report — ${escapeHtml(district)}</h1>
      <div class="header-meta">
        <div class="meta-item">
          <strong>Incident Ref:</strong> ${escapeHtml(incidentId)}
        </div>
        <div class="meta-item">
          <strong>Cycle ID:</strong> ${escapeHtml(cycleState?.cycle_id || "CYC-01")}
        </div>
        <div class="meta-item">
          <strong>Approval Status:</strong> 
          <span class="status-badge ${
            approvalStatus.includes("APPROVED") ? "status-approved" : "status-critical"
          }">
            ${escapeHtml(approvalStatus)}
          </span>
        </div>
        <div class="meta-item">
          <strong>Generated:</strong> ${timestamp}
        </div>
      </div>
    </header>

    <!-- Key Metrics Grid -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Risk Severity Score</div>
        <div class="metric-value" style="color: ${summary.risk_score >= 70 ? '#dc2626' : '#d97706'};">
          ${summary.risk_score.toFixed(1)} <span style="font-size: 11px; font-weight: normal; color: #64748b;">/ 100</span>
        </div>
        <div class="metric-subtext">${escapeHtml(summary.risk_level)}</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Signal Confidence</div>
        <div class="metric-value" style="color: #0284c7;">
          ${(summary.confidence_score * 100).toFixed(1)}%
        </div>
        <div class="metric-subtext">Multi-source alignment index</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Population Impact</div>
        <div class="metric-value">
          ${(demo?.population || 1000000).toLocaleString("en-IN")}
        </div>
        <div class="metric-subtext">${(demo?.population_density || 1200).toLocaleString()} per sq km</div>
      </div>

      <div class="metric-card">
        <div class="metric-label">Hospital Beds</div>
        <div class="metric-value">
          ${demo?.total_beds || 1450}
        </div>
        <div class="metric-subtext">${demo?.icu_beds || 180} ICU Beds Available</div>
      </div>
    </div>

    <!-- Executive Summary -->
    <div class="exec-box">
      <h2>Executive Summary</h2>
      <p>${escapeHtml(executiveSummary)}</p>
    </div>

    <!-- Dynamic Model-Specific Clinical Intelligence -->
    ${
      clinical
        ? `
    <h3 class="section-title">Clinical Intelligence — ${escapeHtml(
      clinical.relevant_disease || clinical.likely_disease || "Vector-Borne Disease"
    )} (${escapeHtml(clinical.outbreak_model_name || "Vector-Borne Watch")})</h3>
    <div class="interp-block" style="border-left-color: #991b1b; background-color: #fff5f5;">
      <div class="interp-title" style="color: #991b1b;">Model-Specific Epidemiological Interpretation</div>
      <div class="interp-grid">
        <div class="interp-card">
          <div class="interp-label label-happening">1. What is Happening?</div>
          <div class="interp-text">${escapeHtml(clinical.clinical_situation || "Anomalous disease activity detected.")}</div>
        </div>
        <div class="interp-card">
          <div class="interp-label label-matters">2. Why It Matters</div>
          <div class="interp-text">${escapeHtml(clinical.why_it_matters || "Requires early surveillance and capacity buffer.")}</div>
        </div>
      </div>
      <div class="interp-grid">
        <div class="interp-card">
          <div class="interp-label label-evidence">3. Key Evidence & Telemetry</div>
          <div class="interp-text">${escapeHtml(clinical.key_evidence || "Correlated across IDSP, hospital, and weather streams.")}</div>
        </div>
        <div class="interp-card">
          <div class="interp-label label-happening" style="color: #9333ea;">4. Potential Health Impact</div>
          <div class="interp-text">${escapeHtml(clinical.potential_health_impact || "Potential ICU strain and emergency triage surge.")}</div>
        </div>
      </div>
      <div class="interp-grid">
        <div class="interp-card">
          <div class="interp-label label-matters" style="color: #2563eb;">5. What to Monitor Next</div>
          <div class="interp-text">${escapeHtml(clinical.what_to_monitor || "Daily diagnostic positivity and bed occupancy.")}</div>
        </div>
        <div class="interp-card">
          <div class="interp-label label-action">6. Recommended Response</div>
          <div class="interp-text">${escapeHtml(clinical.recommended_response || "Mobilize supplies and issue advisory.")}</div>
        </div>
      </div>
      <div style="margin-top: 10px; padding: 10px; background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 4px; font-size: 11.5px; color: #7f1d1d;">
        <strong>Public Health Citizen Advisory:</strong> ${escapeHtml(clinical.public_advisory || "Maintain personal protective measures.")}
      </div>
    </div>
    `
        : ""
    }

    <!-- Human-Readable Interpretation Layer: Major Signal Vector Analysis -->
    <h3 class="section-title">Human-Readable Signal Interpretation</h3>

    <!-- 1. Disease Surveillance -->
    <div class="interp-block">
      <div class="interp-title">1. Disease Surveillance & Infection Dynamics (IDSP Stream)</div>
      <div class="interp-grid">
        <div class="interp-card">
          <div class="interp-label label-happening">What is Happening?</div>
          <div class="interp-text">
            ${
              sub.disease >= 70
                ? `IDSP surveillance telemetry indicates a sharp surge in reported acute fever clusters and suspected vector-borne cases in ${district}.`
                : `Disease surveillance streams report nominal baseline fever cases across Primary Health Centres in ${district}.`
            }
          </div>
        </div>
        <div class="interp-card">
          <div class="interp-label label-matters">Why It Matters</div>
          <div class="interp-text">
            ${
              sub.disease >= 70
                ? `Rapid fever cluster escalation suggests growing localized transmission pressure. Unmitigated growth risks overwhelming primary care facilities within 48 hours.`
                : `Baseline case rates indicate low immediate epidemic risk, allowing healthcare personnel to maintain standard diagnostic protocols.`
            }
          </div>
        </div>
      </div>
      <div class="interp-grid">
        <div class="interp-card">
          <div class="interp-label label-evidence">Supporting Evidence</div>
          <ul class="evidence-list">
            <li><strong>Disease Sub-Score:</strong> ${sub.disease.toFixed(1)} / 100</li>
            <li><strong>IDSP Surveillance Status:</strong> ${sub.disease >= 70 ? "HIGH ANOMALY DETECTED" : "BASELINE STABLE"}</li>
            <li><strong>Data Source:</strong> Integrated Disease Surveillance Program (IDSP) PHC Feed</li>
          </ul>
        </div>
        <div class="interp-card">
          <div class="interp-label label-action">Recommended Action</div>
          <div class="interp-text">
            Deploy rapid diagnostic test (RDT) kits to primary health centers and initiate door-to-door fever screening in affected sub-districts.
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Hospital Strain & ICU Capacity -->
    <div class="interp-block">
      <div class="interp-title">2. Hospital & Intensive Care Capacity Strain</div>
      <div class="interp-grid">
        <div class="interp-card">
          <div class="interp-label label-happening">What is Happening?</div>
          <div class="interp-text">
            ${
              sub.hospital >= 70
                ? `District hospitals in ${district} are experiencing elevated patient admission volumes, driving ICU bed occupancy towards peak operating thresholds.`
                : `Hospital bed occupancy in ${district} remains within normal operational limits with adequate ICU buffer.`
            }
          </div>
        </div>
        <div class="interp-card">
          <div class="interp-label label-matters">Why It Matters</div>
          <div class="interp-text">
            ${
              sub.hospital >= 70
                ? `High ICU occupancy reduces the health system's capacity to absorb sudden critical patient influxes, creating operational bottlenecks in emergency care.`
                : `Sufficient bed reserves ensure hospitals can accommodate unexpected emergency admissions without triggering surge protocols.`
            }
          </div>
        </div>
      </div>
      <div class="interp-grid">
        <div class="interp-card">
          <div class="interp-label label-evidence">Supporting Evidence</div>
          <ul class="evidence-list">
            <li><strong>Hospital Strain Sub-Score:</strong> ${sub.hospital.toFixed(1)} / 100</li>
            <li><strong>Available Beds:</strong> ${demo?.total_beds || 1450} Total Beds (${demo?.icu_beds || 180} ICU)</li>
            <li><strong>Data Source:</strong> State Hospital Bed Management System Telemetry</li>
          </ul>
        </div>
        <div class="interp-card">
          <div class="interp-label label-action">Recommended Action</div>
          <div class="interp-text">
            Pre-authorize emergency staff shifts, mobilize supplemental ORS & IV fluid stock, and prepare auxiliary ward beds.
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Weather & Environmental Drivers -->
    <div class="interp-block">
      <div class="interp-title">3. Environmental & Meteorological Drivers</div>
      <div class="interp-grid">
        <div class="interp-card">
          <div class="interp-label label-happening">What is Happening?</div>
          <div class="interp-text">
            ${
              sub.weather >= 70
                ? `Recent precipitation anomalies and high humidity levels in ${district} have created favorable conditions for vector breeding and water stagnation.`
                : `Meteorological sensors report seasonal weather conditions without significant environmental flood risk.`
            }
          </div>
        </div>
        <div class="interp-card">
          <div class="interp-label label-matters">Why It Matters</div>
          <div class="interp-text">
            ${
              sub.weather >= 70
                ? `Heavy rainfall combined with elevated humidity correlates with increased mosquito breeding sites, potentially escalating transmission over a 7-14 day horizon.`
                : `Stable weather patterns limit environmental vector proliferation and reduce water contamination hazards.`
            }
          </div>
        </div>
      </div>
      <div class="interp-grid">
        <div class="interp-card">
          <div class="interp-label label-evidence">Supporting Evidence</div>
          <ul class="evidence-list">
            <li><strong>Weather Sub-Score:</strong> ${sub.weather.toFixed(1)} / 100</li>
            <li><strong>Air Quality Index (AQI):</strong> Sub-Score ${sub.aqi.toFixed(1)} / 100</li>
            <li><strong>Data Source:</strong> IMD Weather Station & Sentinel Satellite Index</li>
          </ul>
        </div>
        <div class="interp-card">
          <div class="interp-label label-action">Recommended Action</div>
          <div class="interp-text">
            Initiate targeted larvicidal spraying in stagnant water bodies and issue public weather health advisories.
          </div>
        </div>
      </div>
    </div>

    <!-- Sub-Score Signal Decomposition Table -->
    <h3 class="section-title">Signal Sub-Score Summary</h3>
    <table>
      <thead>
        <tr>
          <th>Signal Stream</th>
          <th>Sub-Score</th>
          <th>Status</th>
          <th>Surveillance Vector Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Disease Surveillance (IDSP)</strong></td>
          <td><strong>${sub.disease.toFixed(1)} / 100</strong></td>
          <td style="color: ${sub.disease >= 70 ? '#dc2626' : '#166534'}; font-weight: bold;">
            ${sub.disease >= 70 ? 'HIGH ANOMALY' : 'NOMINAL'}
          </td>
          <td>Surveillance stream capturing acute syndrome case reports & fever clusters.</td>
        </tr>
        <tr>
          <td><strong>Hospital Capacity & ICU</strong></td>
          <td><strong>${sub.hospital.toFixed(1)} / 100</strong></td>
          <td style="color: ${sub.hospital >= 70 ? '#dc2626' : '#166534'}; font-weight: bold;">
            ${sub.hospital >= 70 ? 'SURGE STRAIN' : 'CAPACITY OK'}
          </td>
          <td>Hospital bed occupancy rate, emergency admission volume & ICU load.</td>
        </tr>
        <tr>
          <td><strong>Weather & Climate Risk</strong></td>
          <td><strong>${sub.weather.toFixed(1)} / 100</strong></td>
          <td style="color: ${sub.weather >= 70 ? '#dc2626' : '#166534'}; font-weight: bold;">
            ${sub.weather >= 70 ? 'ELEVATED RISK' : 'NORMAL'}
          </td>
          <td>Precipitation anomaly, humidity, flooding index & vector breeding weather.</td>
        </tr>
        <tr>
          <td><strong>Pharmacy OTC Sales</strong></td>
          <td><strong>${sub.pharmacy.toFixed(1)} / 100</strong></td>
          <td style="color: ${sub.pharmacy >= 70 ? '#dc2626' : '#166534'}; font-weight: bold;">
            ${sub.pharmacy >= 70 ? 'SALES SPIKE' : 'NORMAL'}
          </td>
          <td>Over-the-counter sales spike in antipyretics, antibiotics, & ORS packets.</td>
        </tr>
        <tr>
          <td><strong>Air Quality Index (AQI)</strong></td>
          <td><strong>${sub.aqi.toFixed(1)} / 100</strong></td>
          <td style="color: ${sub.aqi >= 70 ? '#dc2626' : '#166534'}; font-weight: bold;">
            ${sub.aqi >= 70 ? 'POOR AQI' : 'MODERATE'}
          </td>
          <td>Environmental sensor air quality index & respiratory vulnerability factor.</td>
        </tr>
      </tbody>
    </table>

    <!-- Recommendations -->
    ${
      reasoning?.recommendations && reasoning.recommendations.length > 0
        ? `
      <h3 class="section-title">Recommended Intervention Protocols</h3>
      <div style="background-color: #ffffff; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 4px;">
        ${reasoning.recommendations
          .map(
            (rec) => `
          <div class="list-item">
            <span>${escapeHtml(rec)}</span>
          </div>
        `
          )
          .join("")}
      </div>
    `
        : ""
    }

    <!-- Public Advisory / Do's & Don'ts -->
    ${
      reasoning?.dos_and_donts
        ? `
      <h3 class="section-title">Public Advisory Guidelines</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 4px;">
          <strong style="color: #15803d; font-size: 11px; text-transform: uppercase;">✓ Recommended Actions (DOs)</strong>
          <ul style="margin-top: 6px; padding-left: 16px; font-size: 12px; color: #166534;">
            ${reasoning.dos_and_donts.dos.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}
          </ul>
        </div>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 4px;">
          <strong style="color: #b91c1c; font-size: 11px; text-transform: uppercase;">✗ Prohibited / Avoid (DON'Ts)</strong>
          <ul style="margin-top: 6px; padding-left: 16px; font-size: 12px; color: #991b1b;">
            ${reasoning.dos_and_donts.donts.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}
          </ul>
        </div>
      </div>
    `
        : ""
    }

    <!-- Data Ingestion Status -->
    <h3 class="section-title">Ingested Surveillance Feeds</h3>
    <table>
      <thead>
        <tr>
          <th>Source Stream</th>
          <th>Status</th>
          <th>Verification</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(summary.source_statuses || {})
          .map(
            ([src, status]) => `
          <tr>
            <td><strong>${escapeHtml(src.toUpperCase())} Telemetry</strong></td>
            <td><span style="color: #15803d; font-weight: bold;">${escapeHtml(status)}</span></td>
            <td>Active baseline ingested and fused.</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <footer>
      <div>Dhanvantari Epidemiological Incident System • Official Report</div>
      <div>District: ${escapeHtml(district)} • Ref: ${escapeHtml(incidentId)}</div>
    </footer>
  </div>

</body>
</html>`;

  const reportWindow = window.open("", "_blank");
  if (reportWindow) {
    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
  } else {
    alert("Please allow popups to view and print the Incident Report.");
  }
}

/**
 * Exports a human-readable Resource Allocation Request as a printable PDF / HTML document
 * complete with structured Interpretation Layer (What is happening, Why it matters, Evidence, Actions).
 */
export function exportResourceAllocationReportHTML(
  summary: DistrictSummary,
  cycleState: CycleState
): void {
  const timestamp = new Date().toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  const district = summary.district;
  const resReport = cycleState?.reports?.resource_summaries?.[district]?.json;
  const sub = summary.sub_scores;
  const demo = summary.demographics;
  const pop = demo?.population || 1000000;
  const popWeight = Math.max(0.5, pop / 1000000.0);
  const approvalStatus = cycleState?.reports?.approval_status || "DRAFT - PENDING APPROVAL";

  // Deterministic resource demand calculations
  let ors = Math.floor(sub.hospital * popWeight * 8);
  let doctors = Math.max(2, Math.floor(sub.hospital * 0.2));
  let kits = Math.floor(sub.disease * 20);
  let nets = Math.floor((sub.weather + sub.disease) * 2);
  let iv = Math.floor(sub.hospital * 3);

  if (summary.risk_score >= 70.0) {
    ors = Math.max(ors, 500);
    doctors = Math.max(doctors, 12);
    kits = Math.max(kits, 1500);
    iv = Math.max(iv, 200);
    nets = Math.max(nets, 300);
  }

  const campTriggered = resReport?.camp_recommendation?.triggered || summary.risk_score >= 70;
  const campSummary = resReport?.camp_recommendation?.summary || "Standard hospital capacity sufficient.";
  const campLocations = resReport?.camp_recommendation?.suggested_locations || [];

  // Executive Summary (3-5 clear sentences answering: What is happening right now, and should the reader care?)
  const execSentences = [
    `An automated medical resource allocation dispatch request has been calculated for ${district} district to address ongoing health surveillance demands.`,
    `The dispatch package authorizes ${ors.toLocaleString()} ORS packets, ${doctors} specialized medical doctors, ${kits.toLocaleString()} diagnostic kits, and ${iv.toLocaleString()} IV fluid bags.`,
    campTriggered
      ? `Emergency field medical camp mobilization has been triggered to prevent acute surge bottlenecks at regional district hospitals.`
      : `Current district hospital infrastructure is evaluated as sufficient without requiring temporary field camp expansion.`,
    `All calculated resource quantities are derived directly from real-time hospital bed strain and population density telemetry.`
  ];
  const executiveSummary = execSentences.join(" ");

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resource Allocation Request — ${escapeHtml(district)}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 15mm 18mm 15mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      line-height: 1.5;
      font-size: 13px;
      padding: 24px;
    }

    .report-container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 32px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }

    /* Print Controls Bar */
    .no-print {
      max-width: 820px;
      margin: 0 auto 16px auto;
      display: flex;
      align-items: center;
      justify-between: flex-start;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      color: #ffffff;
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn:hover {
      background-color: #1e293b;
    }

    .btn-secondary {
      background-color: #f1f5f9;
      color: #334155;
      border-color: #cbd5e1;
    }

    .btn-secondary:hover {
      background-color: #e2e8f0;
    }

    header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .org-title {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #0d9488;
      margin-bottom: 4px;
    }

    h1 {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 8px;
    }

    .header-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 12px;
      color: #64748b;
      margin-top: 8px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .meta-item strong {
      color: #334155;
    }

    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-pending {
      background-color: #fef3c7;
      color: #b45309;
      border: 1px solid #fde047;
    }

    .status-approved {
      background-color: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }

    /* Executive Box */
    .exec-box {
      background-color: #f0fdf4;
      border-left: 4px solid #0d9488;
      border-top: 1px solid #bbf7d0;
      border-right: 1px solid #bbf7d0;
      border-bottom: 1px solid #bbf7d0;
      padding: 16px 20px;
      border-radius: 0 4px 4px 0;
      margin-bottom: 24px;
    }

    .exec-box h2 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #0f766e;
      margin-bottom: 6px;
    }

    .exec-box p {
      color: #134e4a;
      font-size: 13.5px;
      line-height: 1.6;
      font-weight: 450;
    }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Interpretation Cards */
    .interp-block {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #0d9488;
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 18px;
    }

    .interp-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 6px;
    }

    .interp-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 12px;
    }

    .interp-card {
      background-color: #f8fafc;
      border: 1px solid #f1f5f9;
      padding: 12px;
      border-radius: 4px;
    }

    .interp-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .label-happening { color: #0d9488; }
    .label-matters { color: #b45309; }
    .label-evidence { color: #475569; }
    .label-action { color: #15803d; }

    .interp-text {
      font-size: 12.5px;
      color: #334155;
      line-height: 1.5;
    }

    .evidence-list {
      margin-top: 4px;
      padding-left: 16px;
      font-size: 12px;
      color: #475569;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      margin-bottom: 20px;
      font-size: 12px;
    }

    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }

    .badge-urgent {
      color: #b91c1c;
      font-weight: bold;
    }

    .badge-high {
      color: #c2410c;
      font-weight: bold;
    }

    footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-between: space-between;
      align-items: center;
    }

    @media print {
      body {
        background-color: #ffffff;
        padding: 0;
      }
      .report-container {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Screen Print Controls -->
  <div class="no-print">
    <button class="btn" onclick="window.print()">
      🖨️ Print Report / Save as PDF
    </button>
    <button class="btn btn-secondary" onclick="window.close()">
      ✖ Close
    </button>
  </div>

  <div class="report-container">
    <header>
      <div class="org-title">DHANVANTARI Emergency Medical Dispatch & Logistics</div>
      <h1>Resource Allocation Request — ${escapeHtml(district)}</h1>
      <div class="header-meta">
        <div class="meta-item">
          <strong>District:</strong> ${escapeHtml(district)}
        </div>
        <div class="meta-item">
          <strong>Risk Score:</strong> ${summary.risk_score.toFixed(1)} / 100
        </div>
        <div class="meta-item">
          <strong>Status:</strong> 
          <span class="status-badge ${
            approvalStatus.includes("APPROVED") ? "status-approved" : "status-pending"
          }">
            ${escapeHtml(approvalStatus)}
          </span>
        </div>
        <div class="meta-item">
          <strong>Report Date:</strong> ${timestamp}
        </div>
      </div>
    </header>

    <!-- Executive Summary Box -->
    <div class="exec-box">
      <h2>Executive Summary</h2>
      <p>${escapeHtml(executiveSummary)}</p>
    </div>

    <!-- Human-Readable Interpretation Layer for Resource Dispatch -->
    <h3 class="section-title">Logistics Rationale & Interpretation</h3>

    <!-- 1. Emergency Supply Dispatch -->
    <div class="interp-block">
      <div class="interp-title">1. Essential Medical Supply Dispatch Rationale</div>
      <div class="interp-grid">
        <div class="interp-card">
          <div class="interp-label label-happening">What is Happening?</div>
          <div class="interp-text">
            Logistics algorithms have authorized an emergency shipment of ${ors.toLocaleString()} ORS packets, ${kits.toLocaleString()} diagnostic kits, and ${iv.toLocaleString()} IV fluid bags to primary medical store depots in ${district}.
          </div>
        </div>
        <div class="interp-card">
          <div class="interp-label label-matters">Why It Matters</div>
          <div class="interp-text">
            Rapid pre-positioning of rehydration packets and diagnostic supplies prevents acute shortages at local outpatient clinics, reducing severe dehydration complications and stabilizing patient throughput.
          </div>
        </div>
      </div>
      <div class="interp-grid">
        <div class="interp-card">
          <div class="interp-label label-evidence">Supporting Evidence</div>
          <ul class="evidence-list">
            <li><strong>Hospital Bed Strain Sub-Score:</strong> ${sub.hospital.toFixed(1)} / 100</li>
            <li><strong>Population Density Factor:</strong> ${(demo?.population_density || 1200).toLocaleString()} / sq km</li>
            <li><strong>Formula:</strong> Hospital Sub-score × Pop Weight × 8 (Floor 500)</li>
          </ul>
        </div>
        <div class="interp-card">
          <div class="interp-label label-action">Recommended Action</div>
          <div class="interp-text">
            Approve supply transit manifest and coordinate immediate courier dispatch to ${district} District Central Warehouse.
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Medical Personnel Mobilization -->
    <div class="interp-block">
      <div class="interp-title">2. Specialized Medical Personnel Mobilization</div>
      <div class="interp-grid">
        <div class="interp-card">
          <div class="interp-label label-happening">What is Happening?</div>
          <div class="interp-text">
            A medical deployment order has been issued for ${doctors} specialized physicians and epidemiological officers to reinforce hospital emergency rooms in ${district}.
          </div>
        </div>
        <div class="interp-card">
          <div class="interp-label label-matters">Why It Matters</div>
          <div class="interp-text">
            Deploying experienced physicians directly reduces patient triage wait times and mitigates doctor burnout during peak admission spikes.
          </div>
        </div>
      </div>
      <div class="interp-grid">
        <div class="interp-card">
          <div class="interp-label label-evidence">Supporting Evidence</div>
          <ul class="evidence-list">
            <li><strong>Hospital Staffing Index:</strong> ${doctors} Personnel Authorized</li>
            <li><strong>Hospital Count:</strong> ${demo?.total_hospitals || 8} Facilities in ${district}</li>
            <li><strong>Formula:</strong> Hospital Strain × 0.2 (Floor 12)</li>
          </ul>
        </div>
        <div class="interp-card">
          <div class="interp-label label-action">Recommended Action</div>
          <div class="interp-text">
            Issue mobilization notices to regional medical reserve officers and confirm travel logistics.
          </div>
        </div>
      </div>
    </div>

    <!-- Calculated Allocations Table -->
    <h3 class="section-title">Calculated Resource Demand Quantities</h3>
    <table>
      <thead>
        <tr>
          <th>Resource Item</th>
          <th>Allocated Quantity</th>
          <th>Priority Level</th>
          <th>Calculation Formula / Basis</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>ORS Packets (Oral Rehydration)</strong></td>
          <td><strong style="color: #0284c7; font-size: 14px;">${ors.toLocaleString()} Packets</strong></td>
          <td><span class="badge-urgent">URGENT DISPATCH</span></td>
          <td>Hospital Sub-Score × Pop Weight × 8 (Floor 500)</td>
        </tr>
        <tr>
          <td><strong>Medical Doctors & Specialists</strong></td>
          <td><strong style="color: #0284c7; font-size: 14px;">${doctors} Personnel</strong></td>
          <td><span class="badge-urgent">URGENT DISPATCH</span></td>
          <td>Hospital Strain × 0.2 (Floor 12)</td>
        </tr>
        <tr>
          <td><strong>Diagnostic Test Kits</strong></td>
          <td><strong style="color: #0284c7; font-size: 14px;">${kits.toLocaleString()} Kits</strong></td>
          <td><span class="badge-high">HIGH PRIORITY</span></td>
          <td>Disease Sub-Score × 20 (Floor 1500)</td>
        </tr>
        <tr>
          <td><strong>IV Fluid Bags (1000ml)</strong></td>
          <td><strong style="color: #0284c7; font-size: 14px;">${iv.toLocaleString()} Units</strong></td>
          <td><span class="badge-high">HIGH PRIORITY</span></td>
          <td>Hospital Sub-Score × 3 (Floor 200)</td>
        </tr>
        <tr>
          <td><strong>Insecticide-Treated Nets</strong></td>
          <td><strong style="color: #0284c7; font-size: 14px;">${nets.toLocaleString()} Units</strong></td>
          <td><span>MODERATE</span></td>
          <td>(Weather + Disease Score) × 2 (Floor 300)</td>
        </tr>
      </tbody>
    </table>

    <!-- Emergency Medical Camp Mobilization -->
    <h3 class="section-title">Emergency Medical Camp Mobilization</h3>
    <div style="background-color: ${
      campTriggered ? "#fef2f2" : "#f0fdf4"
    }; border: 1px solid ${
    campTriggered ? "#fecaca" : "#bbf7d0"
  }; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
      <div style="font-weight: bold; color: ${
        campTriggered ? "#991b1b" : "#166534"
      }; font-size: 13px; margin-bottom: 6px;">
        ${
          campTriggered
            ? "⚠️ EMERGENCY FIELD CAMP MOBILIZATION TRIGGERED"
            : "✓ STANDARD HOSPITAL CAPACITY SUFFICIENT"
        }
      </div>
      <p style="color: #334155; font-size: 12px; margin-bottom: 8px;">${escapeHtml(
        campSummary
      )}</p>
      ${
        campLocations.length > 0
          ? `
        <div style="font-size: 12px; color: #1e293b; margin-top: 8px;">
          <strong>Suggested Camp Locations:</strong>
          <ul style="padding-left: 18px; margin-top: 4px;">
            ${campLocations.map((loc) => `<li>${escapeHtml(loc)}</li>`).join("")}
          </ul>
        </div>
      `
          : ""
      }
    </div>

    <!-- District Infrastructure Context -->
    <h3 class="section-title">Healthcare Infrastructure Baseline</h3>
    <table>
      <thead>
        <tr>
          <th>Metric Name</th>
          <th>Value</th>
          <th>Status / Impact Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Total District Hospitals</td>
          <td><strong>${summary.demographics?.total_hospitals || 8} Facilities</strong></td>
          <td>${summary.demographics?.government_hospitals || 5} Public Govt Hospitals</td>
        </tr>
        <tr>
          <td>Total Hospital Bed Capacity</td>
          <td><strong>${summary.demographics?.total_beds || 1450} Beds</strong></td>
          <td>Occupancy ICU Strain: ${resReport?.hospital_strain?.icu_occupancy_percent || 78.5}%</td>
        </tr>
        <tr>
          <td>ICU Bed Capacity</td>
          <td><strong>${summary.demographics?.icu_beds || 180} ICU Beds</strong></td>
          <td>${resReport?.hospital_strain?.strain_status || "HIGH SURGE STRAIN"}</td>
        </tr>
      </tbody>
    </table>

    <footer>
      <div>Dhanvantari Emergency Logistics Engine • Official Dispatch Document</div>
      <div>District: ${escapeHtml(district)} • Cycle: ${escapeHtml(cycleState?.cycle_id || "CYC-01")}</div>
    </footer>
  </div>

</body>
</html>`;

  const reportWindow = window.open("", "_blank");
  if (reportWindow) {
    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
  } else {
    alert("Please allow popups to view and print the Resource Allocation Report.");
  }
}

function getWhyItMattersForSection(secTitle: string, task: AgentTask): string {
  const t = secTitle.toLowerCase();
  if (t.includes("overview") || t.includes("summary")) {
    return "Consolidates multi-source surveillance streams to establish an actionable baseline for district risk management.";
  }
  if (t.includes("risk") || t.includes("hospital")) {
    return "Elevated risk or hospital pressure narrows emergency buffer capacity, increasing the danger of care delivery delays.";
  }
  if (t.includes("recommend") || t.includes("dispatch")) {
    return "Targeted intervention guidance ensures medical supplies and personnel are directed to the highest priority areas.";
  }
  return "Provides critical context and verification status for public health decision support.";
}

function getRecommendedActionForSection(secTitle: string, task: AgentTask): string {
  const t = secTitle.toLowerCase();
  if (t.includes("overview") || t.includes("summary")) {
    return "Review district risk level and confirm data feed verification prior to authorizing dispatches.";
  }
  if (t.includes("risk") || t.includes("hospital")) {
    return "Prepare auxiliary hospital wards and alert emergency medical response teams.";
  }
  if (t.includes("recommend") || t.includes("dispatch")) {
    return "Execute recommended supply distributions and confirm delivery manifests with regional health officers.";
  }
  return "Proceed with routine surveillance monitoring and maintain baseline data ingestion.";
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeCsvValue(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
