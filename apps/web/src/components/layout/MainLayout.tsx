import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { RequestPanel } from "../request/RequestPanel";
import { ResponsePanel } from "../response/ResponsePanel";
import { HistoryPanel } from "./HistoryPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Badge } from "@/components/ui/badge";

const Header = () => (
  <header className="h-12 border-b bg-background flex items-center justify-between px-4 text-sm font-mono z-10">
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">My Workspace /</span>
      <span className="text-primary font-medium">New Request</span>
    </div>
    <div className="flex items-center gap-2">
      <Badge
        variant="outline"
        className="font-normal text-xs text-muted-foreground"
      >
        Environment: <strong className="ml-1 text-foreground">Prod</strong>
      </Badge>
    </div>
  </header>
);

export const MainLayout = () => {
  const [activeSidebarItem, setActiveSidebarItem] = useState<string>("history");

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      <Sidebar activeItem={activeSidebarItem} onSelect={setActiveSidebarItem} />

      {activeSidebarItem === "history" && <HistoryPanel />}

      <div className="flex-1 flex flex-col h-full min-w-0">
        <Header />
        <div className="flex-1 relative overflow-hidden">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize={40} minSize={20}>
              <RequestPanel />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={60}>
              <ResponsePanel />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};
