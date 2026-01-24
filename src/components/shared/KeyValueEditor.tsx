import React from "react";
import { Trash2 } from "lucide-react";
import type { KeyValue } from "../../contexts/RequestContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface KeyValueEditorProps {
  items: KeyValue[];
  onChange: (items: KeyValue[]) => void;
}

export const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  items,
  onChange,
}) => {
  const handleUpdate = (index: number, field: keyof KeyValue, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);

    // Auto-add new row if editing the last one
    if (
      index === items.length - 1 &&
      (field === "key" || field === "value") &&
      value
    ) {
      if (items[index].key || items[index].value) {
        onChange([
          ...newItems,
          { id: crypto.randomUUID(), key: "", value: "", enabled: true },
        ]);
      }
    }
  };

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  return (
    <div className="flex flex-col border rounded-md overflow-hidden">
      <div className="flex items-center text-xs font-medium text-muted-foreground bg-muted/50 border-b">
        <div className="w-10 p-2 text-center"></div>
        <div className="flex-1 p-2 border-l border-r border-border/50">KEY</div>
        <div className="flex-1 p-2 border-r border-border/50">VALUE</div>
        <div className="w-10 p-2 text-center"></div>
      </div>

      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center border-b last:border-0 group"
        >
          <div className="w-10 flex justify-center items-center">
            <Checkbox
              checked={item.enabled}
              onCheckedChange={(checked) =>
                handleUpdate(index, "enabled", checked)
              }
            />
          </div>
          <div className="flex-1 border-l border-r border-border/50">
            <Input
              className="border-none shadow-none rounded-none focus-visible:ring-0 h-8 font-mono text-sm"
              placeholder="Key"
              value={item.key}
              onChange={(e) => handleUpdate(index, "key", e.target.value)}
            />
          </div>
          <div className="flex-1 border-r border-border/50">
            <Input
              className="border-none shadow-none rounded-none focus-visible:ring-0 h-8 font-mono text-sm"
              placeholder="Value"
              value={item.value}
              onChange={(e) => handleUpdate(index, "value", e.target.value)}
            />
          </div>
          <div className="w-10 flex justify-center items-center">
            {index !== items.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
              >
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
