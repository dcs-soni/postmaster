import React from "react";
import { Play, RotateCcw } from "lucide-react";
import { useRequest } from "../../contexts/RequestContext";
import type { HttpMethod } from "../../contexts/RequestContext";
import { useHistory } from "../../hooks/useHistory";
import { ApiService } from "@/services/api.service";
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

  const [useProxy, setUseProxy] = React.useState(true);

  const handleSend = async () => {
    dispatch({ type: "START_REQUEST" });

    // 1. Prepare URL with Params
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

    // 2. Prepare Headers
    const headers: Record<string, string> = {};
    state.headers.forEach((h) => {
      if (h.enabled && h.key) headers[h.key] = h.value;
    });

    // 3. Prepare Body
    let body: any = undefined;
    if (["POST", "PUT", "PATCH"].includes(state.method) && state.bodyContent) {
      try {
        body = JSON.parse(state.bodyContent);
      } catch (e) {
        // If content type is not JSON, we might want to send as string
        // For now, let's keep it simple or log error
        console.warn("Body is not valid JSON", e);
      }
    }

    // 4. Send Request via Service
    const result = await ApiService.sendRequest(
      {
        url: finalUrl,
        method: state.method,
        headers,
        body,
      },
      useProxy,
    );

    dispatch({
      type: "SET_RESPONSE",
      response: result.data,
      status: result.status,
      time: result.time,
      size: result.size,
    });

    addToHistory(state, result.status);
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
    <div className="flex gap-2 p-4 border-b bg-background items-center">
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

      <div className="flex items-center gap-2 px-2">
        <input
          type="checkbox"
          id="proxy-toggle"
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          checked={useProxy}
          onChange={(e) => setUseProxy(e.target.checked)}
        />
        <label
          htmlFor="proxy-toggle"
          className="text-sm text-muted-foreground whitespace-nowrap cursor-pointer select-none"
        >
          Use Proxy
        </label>
      </div>

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
