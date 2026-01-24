import { useState, useEffect, useCallback } from "react";
import type { RequestState } from "../contexts/RequestContext";

const STORAGE_KEY = "echo_history";
const EVENT_KEY = "echo_history_updated";

export interface HistoryItem {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  status: number | null;
}

export const useHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const loadHistory = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse history", e);
        setHistory([]);
      }
    } else {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    // Initial load
    loadHistory();

    const handleStorageChange = () => loadHistory();
    window.addEventListener(EVENT_KEY, handleStorageChange);

    return () => {
      window.removeEventListener(EVENT_KEY, handleStorageChange);
    };
  }, [loadHistory]);

  const addToHistory = (request: RequestState, status: number) => {
    const currentStored = localStorage.getItem(STORAGE_KEY);
    const currentHistory: HistoryItem[] = currentStored
      ? JSON.parse(currentStored)
      : [];

    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      method: request.method,
      url: request.url,
      status,
    };

    const newHistory = [newItem, ...currentHistory].slice(0, 50);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    window.dispatchEvent(new Event(EVENT_KEY));
  };

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT_KEY));
  };

  return { history, addToHistory, clearHistory };
};
