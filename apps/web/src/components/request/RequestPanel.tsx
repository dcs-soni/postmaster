import React from "react";
import { UrlBar } from "./UrlBar";
import { useRequest } from "../../contexts/RequestContext";
import { KeyValueEditor } from "../shared/KeyValueEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

export const RequestPanel = () => {
  const { state, dispatch } = useRequest();
  // const [activeTab, setActiveTab] = useState("params");

  const handleParamsChange = (items: any[]) => {
    dispatch({ type: "SET_FIELD", field: "queryParams", value: items });
  };

  const handleHeadersChange = (items: any[]) => {
    dispatch({ type: "SET_FIELD", field: "headers", value: items });
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({
      type: "SET_FIELD",
      field: "bodyContent",
      value: e.target.value,
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <UrlBar />

      <Tabs defaultValue="params" className="w-full flex-1 flex flex-col">
        <div className="border-b px-4 bg-muted/20">
          <TabsList className="h-9 bg-transparent p-0">
            <TabsTrigger
              value="params"
              className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Params
            </TabsTrigger>
            <TabsTrigger
              value="headers"
              className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Headers
            </TabsTrigger>
            <TabsTrigger
              value="body"
              className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Body
            </TabsTrigger>
            <TabsTrigger
              value="auth"
              className="h-9 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Auth
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 p-4">
          <TabsContent value="params" className="mt-0 border-0 p-0">
            <KeyValueEditor
              items={state.queryParams}
              onChange={handleParamsChange}
            />
          </TabsContent>

          <TabsContent value="headers" className="mt-0 border-0 p-0">
            <KeyValueEditor
              items={state.headers}
              onChange={handleHeadersChange}
            />
          </TabsContent>

          <TabsContent
            value="body"
            className="mt-0 border-0 p-0 h-full flex flex-col"
          >
            <div className="mb-2 text-xs text-muted-foreground">Raw JSON</div>
            <Textarea
              className="flex-1 font-mono text-xs min-h-[200px]"
              value={state.bodyContent}
              onChange={handleBodyChange}
              placeholder='{"key": "value"}'
            />
          </TabsContent>

          <TabsContent value="auth" className="mt-0 border-0 p-0">
            <div className="text-center text-muted-foreground py-8 text-sm">
              Auth configuration coming soon
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
