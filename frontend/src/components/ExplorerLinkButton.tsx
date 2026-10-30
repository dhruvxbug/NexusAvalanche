import { useState, type MouseEvent } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useExplorer } from "../lib/explorer";

interface ExplorerLinkButtonProps {
  type: "address" | "tx" | "block";
  value: string | number;
  label?: string;
  showCopy?: boolean;
  truncate?: boolean;
  variant?: "primary" | "secondary" | "subtle" | "inline" | "icon";
  className?: string;
  title?: string;
}

export default function ExplorerLinkButton({
  type,
  value,
  label,
  showCopy = true,
  truncate = false,
  variant = "subtle",
  className = "",
  title,
}: ExplorerLinkButtonProps) {
  const { getExplorerAddressUrl, getExplorerTxUrl, getExplorerBlockUrl, activePreset } = useExplorer();
  const [copied, setCopied] = useState(false);

  const valStr = String(value || "").trim();
  if (!valStr) return null;

  let url = "#";
  if (type === "address") url = getExplorerAddressUrl(valStr);
  else if (type === "tx") url = getExplorerTxUrl(valStr);
  else if (type === "block") url = getExplorerBlockUrl(valStr);

  const handleCopy = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(valStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayText = label
    ? label
    : truncate
    ? `${valStr.slice(0, 8)}...${valStr.slice(-6)}`
    : valStr;

  const defaultTitle = title || `View ${type} on ${activePreset.shortName}`;

  if (variant === "primary") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={defaultTitle}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <span>{label || `View on ${activePreset.shortName}`}</span>
          <ExternalLink className="h-3.5 w-3.5 stroke-[2.2]" />
        </a>
        {showCopy && (
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className="p-2 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    );
  }

  if (variant === "secondary") {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={defaultTitle}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-medium text-xs rounded-lg border border-border transition-colors font-mono"
        >
          <span>{displayText}</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </a>
        {showCopy && (
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className="p-1.5 rounded-lg border border-border/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <div className={`inline-flex items-center gap-1 ${className}`}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={defaultTitle}
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {showCopy && (
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={defaultTitle}
        className={`inline-flex items-center gap-1 text-primary hover:underline font-mono text-xs ${className}`}
      >
        <span>{displayText}</span>
        <ExternalLink className="h-3 w-3 stroke-[2]" />
      </a>
    );
  }

  // Default "subtle"
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={defaultTitle}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
      >
        <span>{label || "Explorer"}</span>
        <ExternalLink className="h-3 w-3" />
      </a>
      {showCopy && (
        <button
          onClick={handleCopy}
          title="Copy"
          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
        </button>
      )}
    </div>
  );
}
