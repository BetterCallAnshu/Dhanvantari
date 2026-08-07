import React from "react";
import { FileText, CheckCircle2, AlertTriangle, Table as TableIcon, ChevronRight } from "lucide-react";

interface FormattedMarkdownProps {
  content: string;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content }) => {
  if (!content) {
    return <div className="text-gray-500 italic p-4 text-xs font-mono">No report content available.</div>;
  }

  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 1. Skip empty lines or pure dividers
    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.trim() === "---" || line.trim() === "***") {
      blocks.push(
        <hr key={`hr-${i}`} className="border-hud my-4" />
      );
      i++;
      continue;
    }

    // 2. Markdown Table Detection (Line contains '|')
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableRows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableRows.push(lines[i].trim());
        i++;
      }

      if (tableRows.length > 0) {
        // Parse header row, separator, and data rows
        const parseRow = (r: string) =>
          r
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim());

        const headerCols = parseRow(tableRows[0]);
        // Skip table separator line (e.g. |---|---|)
        const dataRows = tableRows.slice(1).filter((r) => !r.includes("---") && !r.includes(":---"));

        blocks.push(
          <div key={`table-${i}`} className="my-4 overflow-x-auto border border-hud rounded-sm bg-black/40">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-panel-container border-b border-hud text-cyan-primary text-[11px] uppercase tracking-wider font-bold">
                  {headerCols.map((col, cIdx) => (
                    <th key={cIdx} className="p-2.5 border-r border-hud last:border-r-0">
                      {col.replace(/\*\*/g, "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hud">
                {dataRows.map((dRow, rIdx) => {
                  const cols = parseRow(dRow);
                  return (
                    <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                      {cols.map((cell, cIdx) => {
                        // Render inline bold formatting
                        const isHighPriority = cell.includes("HIGH") || cell.includes("URGENT") || cell.includes("CRITICAL");
                        const isMedPriority = cell.includes("MEDIUM");
                        const cleanCell = cell.replace(/\*\*/g, "").replace(/`/g, "");

                        return (
                          <td key={cIdx} className="p-2.5 border-r border-hud last:border-r-0 text-gray-200">
                            {isHighPriority ? (
                              <span className="px-2 py-0.5 rounded-sm bg-red-500/20 text-red-300 border border-red-500/40 font-bold text-[10px]">
                                {cleanCell}
                              </span>
                            ) : isMedPriority ? (
                              <span className="px-2 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[10px]">
                                {cleanCell}
                              </span>
                            ) : (
                              <span>{cleanCell}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // 3. Headings
    if (line.startsWith("# ")) {
      blocks.push(
        <div key={`h1-${i}`} className="my-4 pb-2 border-b-2 border-cyan-primary flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-primary shrink-0" />
          <h1 className="font-display font-extrabold text-lg text-white tracking-wide">
            {line.replace("# ", "").replace(/\*\*/g, "")}
          </h1>
        </div>
      );
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        <div key={`h2-${i}`} className="mt-5 mb-2 pb-1.5 border-b border-hud flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-cyan-primary shrink-0" />
          <h2 className="font-display font-bold text-sm text-cyan-primary uppercase tracking-wider">
            {line.replace("## ", "").replace(/\*\*/g, "")}
          </h2>
        </div>
      );
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={`h3-${i}`} className="font-display font-bold text-xs text-amber-300 mt-4 mb-2 uppercase tracking-wide flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block"></span>
          {line.replace("### ", "").replace(/\*\*/g, "")}
        </h3>
      );
      i++;
      continue;
    }

    // 4. Bullet lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))
      ) {
        listItems.push(lines[i].trim().substring(2));
        i++;
      }

      blocks.push(
        <ul key={`ul-${i}`} className="my-2 space-y-1.5 pl-2 font-mono text-xs">
          {listItems.map((item, lIdx) => {
            const hasCheck = item.startsWith("✓") || item.startsWith("[x]");
            const cleanItem = item.replace("✓", "").replace("[x]", "").trim();
            const parts = cleanItem.split("**");

            return (
              <li key={lIdx} className="flex items-start gap-2 text-gray-300">
                {hasCheck ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <span className="text-cyan-primary font-bold text-xs shrink-0 mt-0.5">›</span>
                )}
                <span>
                  {parts.map((p, pIdx) =>
                    pIdx % 2 === 1 ? (
                      <strong key={pIdx} className="text-white font-bold">
                        {p}
                      </strong>
                    ) : (
                      p
                    )
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      );
      continue;
    }

    // 5. Blockquotes / Callout boxes
    if (line.startsWith("> ")) {
      const quoteText = line.replace("> ", "").trim();
      blocks.push(
        <blockquote
          key={`quote-${i}`}
          className="my-3 p-3 bg-amber-950/20 border-l-4 border-amber-400 text-amber-200 text-xs font-mono rounded-r-sm space-y-1"
        >
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>CRITICAL DISPATCH GUIDANCE:</span>
          </div>
          <div>{quoteText.replace(/\*\*/g, "")}</div>
        </blockquote>
      );
      i++;
      continue;
    }

    // 6. Key-Value or Bold Paragraphs
    const parts = line.split("**");
    blocks.push(
      <p key={`p-${i}`} className="my-1.5 text-gray-300 font-mono text-xs leading-relaxed">
        {parts.map((part, pIdx) => {
          if (pIdx % 2 === 1) {
            // Check if bold text is a status or badge keyword
            const isStatus = part.includes("STATUS") || part.includes("SEVERITY") || part.includes("CRITICAL") || part.includes("HIGH");
            if (isStatus) {
              return (
                <strong key={pIdx} className="text-amber-400 font-extrabold px-1 bg-amber-950/40 rounded border border-amber-500/30">
                  {part}
                </strong>
              );
            }
            return (
              <strong key={pIdx} className="text-white font-bold">
                {part}
              </strong>
            );
          }
          return part;
        })}
      </p>
    );

    i++;
  }

  return <div className="space-y-2">{blocks}</div>;
};
