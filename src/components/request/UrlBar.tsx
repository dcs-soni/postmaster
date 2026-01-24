import React from "react";
import { Play, RotateCcw } from "lucide-react";
import { useRequest } from "../../contexts/RequestContext";
import type { HttpMethod } from "../../contexts/RequestContext";
import { useHistory } from "../../hooks/useHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export const UrlBar = () => {
  const { state, dispatch } = useRequest();
  const { addToHistory } = useHistory();

  const handleMethodChange = (value: string) => {
    dispatch({
      type: "SET_FIELD",
      field: "method",
      value: value as HttpMethod,
    });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: "SET_FIELD", field: "url", value: e.target.value });
  };

  const handleSend = async () => {
    dispatch({ type: "START_REQUEST" });

    let finalUrl = state.url;
    try {
      const activeParams = state.queryParams.filter((p) => p.enabled && p.key);
      if (activeParams.length > 0) {
        const u = new URL(state.url);
        activeParams.forEach((p) => u.searchParams.append(p.key, p.value));
        finalUrl = u.toString();
      }
    } catch (e) {
      console.warn("Invalid URL for params", e);
    }

    const headers: Record<string, string> = {};
    state.headers.forEach((h) => {
      if (h.enabled && h.key) headers[h.key] = h.value;
    });

    const startTime = performance.now();
    try {
      const options: RequestInit = {
        method: state.method,
        headers,
      };

      if (
        ["POST", "PUT", "PATCH"].includes(state.method) &&
        state.bodyContent
      ) {
        options.body = state.bodyContent;
      }

      const res = await fetch(finalUrl, options);
      const data = await res.json();
      const endTime = performance.now();

      dispatch({
        type: "SET_RESPONSE",
        response: data,
        status: res.status,
        time: Math.round(endTime - startTime),
        size: JSON.stringify(data).length,
      });

      addToHistory(state, res.status);
    } catch (e) {
      console.error(e);
      dispatch({
        type: "SET_RESPONSE",
        response: { error: "Network Error", details: String(e) },
        status: 0,
        time: 0,
        size: 0,
      });
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "text-emerald-500";
      case "POST":
        return "text-amber-500";
      case "PUT":
        return "text-cyan-500";
      case "DELETE":
        return "text-red-500";
      default:
        return "";
    }
  };

  return (
    <div className="flex gap-2 p-4 border-b bg-background">
      <Select value={state.method} onValueChange={handleMethodChange}>
        <SelectTrigger
          className={cn("w-[100px] font-bold", getMethodColor(state.method))}
        >
          <SelectValue placeholder="Method" />
        </SelectTrigger>
        <SelectContent>
          {METHODS.map((m) => (
            <SelectItem
              key={m}
              value={m}
              className={cn("font-bold", getMethodColor(m))}
            >
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="text"
        className="flex-1 font-mono"
        value={state.url}
        onChange={handleUrlChange}
        placeholder="Enter request URL"
      />

      <Button
        onClick={handleSend}
        disabled={state.isLoading}
        className="min-w-[100px]"
      >
        {state.isLoading ? (
          <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Play className="mr-2 h-4 w-4" fill="currentColor" />
        )}
        {state.isLoading ? "Sending" : "Send"}
      </Button>
    </div>
  );
};
