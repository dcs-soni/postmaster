import { useRequest } from "../../contexts/RequestContext";
import { ScrollArea } from "@/components/ui/scroll-area";
// import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const ResponsePanel = () => {
  const { state } = useRequest();

  if (!state.response && !state.isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground font-mono text-sm">
        <div className="p-4 bg-muted/20 rounded-lg border border-dashed">
          Enter a URL and click Send to get a response
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex gap-4 px-4 py-2 border-b text-sm font-mono bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status:</span>
          <span
            className={cn(
              "font-bold",
              state.responseStatus && state.responseStatus < 300
                ? "text-emerald-500"
                : "text-red-500",
            )}
          >
            {state.responseStatus || "-"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Time:</span>
          <span className="text-primary font-medium">
            {state.responseTime || "-"}ms
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Size:</span>
          <span className="text-primary font-medium">
            {state.responseSize || "-"} B
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full p-4">
        {state.isLoading ? (
          <div className="flex items-center justify-center h-full p-8 text-muted-foreground animate-pulse">
            Processing Request...
          </div>
        ) : (
          <pre className="text-sm font-mono text-foreground">
            {JSON.stringify(state.response, null, 2)}
          </pre>
        )}
      </ScrollArea>
    </div>
  );
};
