import React from "react";

interface HighlightTextProps {
  text: string;
  match?: string;
  className?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  match,
  className = "",
}) => {
  if (!match || !match.trim()) {
    return <span className={className}>{text}</span>;
  }

  const query = match.trim();
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-amber-400/30 text-amber-200 font-semibold px-0.5 py-0.2 rounded-xs border-b border-amber-400/80"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};
