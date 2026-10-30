import { useState } from "react";
import { ExternalLink, Check, Globe, X } from "lucide-react";
import { useExplorer, EXPLORER_PRESETS } from "../lib/explorer";

interface ExplorerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExplorerSelectorModal({ isOpen, onClose }: ExplorerSelectorModalProps) {
  const { explorerId, customUrl, selectExplorer, activePreset } = useExplorer();
  const [tempCustomUrl, setTempCustomUrl] = useState<string>(customUrl);

  if (!isOpen) return null;

  const handleSelectPreset = (id: string) => {
    if (id === "custom") {
      selectExplorer("custom", tempCustomUrl.trim() || "http://localhost:4000");
    } else {
      selectExplorer(id);
      onClose();
    }
  };

  const handleApplyCustom = () => {
    selectExplorer("custom", tempCustomUrl.trim() || "http://localhost:4000");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-body animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-foreground">Avalanche Explorer Settings</h3>
              <p className="text-xs text-muted-foreground">Select where smart contract and transaction links open</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Options */}
        <div className="py-4 space-y-3">
          {EXPLORER_PRESETS.map((preset) => {
            const isSelected = explorerId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-primary/5 border-primary shadow-sm"
                    : "bg-white border-border hover:bg-secondary/40 hover:border-border/80"
                }`}
              >
                <div className="space-y-1 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{preset.name}</span>
                    {isSelected && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{preset.description}</p>
                  <code className="text-[11px] font-mono text-primary/80 block pt-0.5">
                    {preset.id === "custom" ? (tempCustomUrl || preset.baseUrl) : preset.baseUrl}
                  </code>
                </div>

                <div className="pt-1">
                  <div
                    className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 bg-white"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Custom URL Input if Custom is selected */}
          {explorerId === "custom" && (
            <div className="pt-2 p-3.5 bg-white rounded-xl border border-border shadow-sm space-y-2">
              <label className="block text-xs font-semibold text-foreground">
                Custom Explorer Base URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempCustomUrl}
                  onChange={(e) => setTempCustomUrl(e.target.value)}
                  placeholder="e.g. http://localhost:4000 or https://my-explorer.io"
                  className="flex-1 bg-white border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                />
                <button
                  onClick={handleApplyCustom}
                  className="bg-primary text-primary-foreground px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
                >
                  Apply
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Point this to your local Blockscout, Otterscan, or sovereign L1 explorer instance.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
          <a
            href={activePreset.baseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            Open {activePreset.shortName} in new tab <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
