import { Trash2, Search } from "lucide-react";
import { useHistory } from "../../hooks/useHistory";
import type { HistoryItem } from "../../hooks/useHistory";
import { useRequest } from "../../contexts/RequestContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const HistoryPanel = () => {
  const { history, clearHistory } = useHistory();
  const { dispatch } = useRequest();

  const handleRestore = (item: HistoryItem) => {
    dispatch({ type: "SET_FIELD", field: "method", value: item.method });
    dispatch({ type: "SET_FIELD", field: "url", value: item.url });
  };

  return (
    <div className="flex flex-col h-full w-[250px] bg-muted/10 border-r">
      <div className="p-2 border-b flex gap-2 bg-background">
        <div className="relative flex-1">
          <Search
            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={12}
          />
          <Input
            className="h-8 pl-7 text-xs bg-muted/50 border-none focus-visible:ring-1"
            placeholder="Filter..."
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={clearHistory}
          title="Clear All"
        >
          <Trash2 size={14} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground font-mono">
            No history yet
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors font-mono text-xs group"
              onClick={() => handleRestore(item)}
            >
              <MethodBadge method={item.method} />
              <div
                className="flex-1 truncate text-muted-foreground group-hover:text-foreground transition-colors"
                title={item.url}
              >
                {item.url}
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MethodBadge = ({ method }: { method: string }) => {
  const color =
    {
      GET: "text-emerald-500",
      POST: "text-amber-500",
      PUT: "text-cyan-500",
      DELETE: "text-red-500",
      PATCH: "text-purple-500",
    }[method] || "text-foreground";

  return <span className={cn("font-bold min-w-[30px]", color)}>{method}</span>;
};

const StatusBadge = ({ status }: { status: number | null }) => {
  if (!status) return null;
  const isSuccess = status >= 200 && status < 300;
  return (
    <span className={cn(isSuccess ? "text-emerald-500" : "text-red-500")}>
      {status}
    </span>
  );
};
