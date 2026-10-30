import { useState, useEffect } from "react";

export interface ExplorerPreset {
  id: string;
  name: string;
  shortName: string;
  baseUrl: string;
  description: string;
  formatAddressUrl: (address: string, baseUrl: string) => string;
  formatTxUrl: (txHash: string, baseUrl: string) => string;
  formatBlockUrl: (block: string | number, baseUrl: string) => string;
}

export const EXPLORER_PRESETS: ExplorerPreset[] = [
  {
    id: "fuji",
    name: "Avalanche Fuji Testnet Explorer",
    shortName: "Fuji Explorer",
    baseUrl: "https://explorer-test.avax.network",
    description: "Official Ava Labs Avalanche Fuji Testnet Explorer",
    formatAddressUrl: (address, base) => `${base.replace(/\/$/, "")}/c-chain/address/${address}`,
    formatTxUrl: (tx, base) => `${base.replace(/\/$/, "")}/c-chain/tx/${tx}`,
    formatBlockUrl: (block, base) => `${base.replace(/\/$/, "")}/c-chain/block/${block}`,
  },
  {
    id: "subnets-test",
    name: "Avalanche Subnet Testnet",
    shortName: "Subnet Testnet",
    baseUrl: "https://subnets-test.avax.network",
    description: "Avalanche Fuji Testnet Explorer mirror",
    formatAddressUrl: (address, base) => `${base.replace(/\/$/, "")}/c-chain/address/${address}`,
    formatTxUrl: (tx, base) => `${base.replace(/\/$/, "")}/c-chain/tx/${tx}`,
    formatBlockUrl: (block, base) => `${base.replace(/\/$/, "")}/c-chain/block/${block}`,
  },
  {
    id: "mainnet",
    name: "Avalanche Mainnet (Snowtrace)",
    shortName: "Snowtrace Mainnet",
    baseUrl: "https://snowtrace.io",
    description: "Production Avalanche C-Chain explorer",
    formatAddressUrl: (address, base) => `${base.replace(/\/$/, "")}/address/${address}`,
    formatTxUrl: (tx, base) => `${base.replace(/\/$/, "")}/tx/${tx}`,
    formatBlockUrl: (block, base) => `${base.replace(/\/$/, "")}/block/${block}`,
  },
  {
    id: "custom",
    name: "Custom / Local Explorer",
    shortName: "Custom Explorer",
    baseUrl: "http://localhost:4000",
    description: "Local Blockscout, Otterscan, or private devnet explorer",
    formatAddressUrl: (address, base) => `${base.replace(/\/$/, "")}/address/${address}`,
    formatTxUrl: (tx, base) => `${base.replace(/\/$/, "")}/tx/${tx}`,
    formatBlockUrl: (block, base) => `${base.replace(/\/$/, "")}/block/${block}`,
  },
];

const STORAGE_KEY_ID = "nexus_explorer_id";
const STORAGE_KEY_CUSTOM_URL = "nexus_explorer_custom_url";

export function getActiveExplorerId(): string {
  if (typeof window === "undefined") return "fuji";
  const stored = localStorage.getItem(STORAGE_KEY_ID);
  if (!stored) {
    const envUrl = import.meta.env.VITE_EXPLORER_URL;
    return envUrl ? "custom" : "fuji";
  }
  if (stored === "snowtrace-testnet" || stored === "testnet" || stored === "snowtrace") {
    localStorage.setItem(STORAGE_KEY_ID, "fuji");
    return "fuji";
  }
  return stored;
}

export function getCustomExplorerUrl(): string {
  if (typeof window === "undefined") return "http://localhost:4000";
  const envUrl = import.meta.env.VITE_EXPLORER_URL;
  return localStorage.getItem(STORAGE_KEY_CUSTOM_URL) || envUrl || "http://localhost:4000";
}

export function getActivePreset(): ExplorerPreset {
  const id = getActiveExplorerId();
  const preset = EXPLORER_PRESETS.find((p) => p.id === id) || EXPLORER_PRESETS[0];
  if (preset.id === "custom") {
    return {
      ...preset,
      baseUrl: getCustomExplorerUrl(),
    };
  }
  return preset;
}

export function setActiveExplorer(id: string, customUrl?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_ID, id);
  if (customUrl) {
    localStorage.setItem(STORAGE_KEY_CUSTOM_URL, customUrl);
  }
  window.dispatchEvent(new Event("nexus_explorer_changed"));
}

export function getExplorerAddressUrl(address: string, network?: string): string {
  if (!address) return "#";
  if (network === "fuji") {
    return `https://explorer-test.avax.network/c-chain/address/${address.trim()}`;
  }
  const preset = getActivePreset();
  return preset.formatAddressUrl(address.trim(), preset.baseUrl);
}

export function getExplorerTxUrl(txHash: string, network?: string): string {
  if (!txHash) return "#";
  if (network === "fuji") {
    return `https://explorer-test.avax.network/c-chain/tx/${txHash.trim()}`;
  }
  const preset = getActivePreset();
  return preset.formatTxUrl(txHash.trim(), preset.baseUrl);
}

export function getExplorerBlockUrl(blockNumber: number | string, network?: string): string {
  if (!blockNumber) return "#";
  if (network === "fuji") {
    return `https://explorer-test.avax.network/c-chain/block/${blockNumber}`;
  }
  const preset = getActivePreset();
  return preset.formatBlockUrl(blockNumber, preset.baseUrl);
}

export function getExplorerHomeUrl(network?: string): string {
  if (network === "fuji") {
    return "https://explorer-test.avax.network";
  }
  const preset = getActivePreset();
  return preset.baseUrl;
}

/** React hook for responsive Explorer configuration across all components */
export function useExplorer() {
  const [explorerId, setExplorerIdState] = useState<string>(getActiveExplorerId);
  const [customUrl, setCustomUrlState] = useState<string>(getCustomExplorerUrl);

  useEffect(() => {
    const handleUpdate = () => {
      setExplorerIdState(getActiveExplorerId());
      setCustomUrlState(getCustomExplorerUrl());
    };
    window.addEventListener("nexus_explorer_changed", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("nexus_explorer_changed", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const selectExplorer = (id: string, newCustomUrl?: string) => {
    setActiveExplorer(id, newCustomUrl);
    setExplorerIdState(id);
    if (newCustomUrl) setCustomUrlState(newCustomUrl);
  };

  const preset = EXPLORER_PRESETS.find((p) => p.id === explorerId) || EXPLORER_PRESETS[0];
  const activeBaseUrl = explorerId === "custom" ? customUrl : preset.baseUrl;

  return {
    explorerId,
    activePreset: {
      ...preset,
      baseUrl: activeBaseUrl,
    },
    customUrl,
    selectExplorer,
    getExplorerAddressUrl: (address: string, network?: string) => {
      if (!address) return "#";
      if (network === "fuji") return `https://explorer-test.avax.network/c-chain/address/${address.trim()}`;
      return preset.formatAddressUrl(address.trim(), activeBaseUrl);
    },
    getExplorerTxUrl: (tx: string, network?: string) => {
      if (!tx) return "#";
      if (network === "fuji") return `https://explorer-test.avax.network/c-chain/tx/${tx.trim()}`;
      return preset.formatTxUrl(tx.trim(), activeBaseUrl);
    },
    getExplorerBlockUrl: (block: string | number, network?: string) => {
      if (!block) return "#";
      if (network === "fuji") return `https://explorer-test.avax.network/c-chain/block/${block}`;
      return preset.formatBlockUrl(block, activeBaseUrl);
    },
    getExplorerHomeUrl: (network?: string) => {
      if (network === "fuji") return "https://explorer-test.avax.network";
      return activeBaseUrl;
    },
    presets: EXPLORER_PRESETS,
  };
}
