import { History, LayoutGrid, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  activeItem: string | null;
  onSelect: (item: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem, onSelect }) => {
  return (
    <aside className="w-[60px] h-full bg-muted/30 border-r flex flex-col items-center py-4 z-20">
      <div className="mb-8">
        <div className="w-8 h-8 flex items-center justify-center rounded-md font-bold text-primary-foreground bg-gradient-to-br from-cyan-500 to-amber-500 font-mono shadow-lg">
          E
        </div>
      </div>

      <nav className="flex flex-col gap-4 flex-1 w-full items-center">
        <NavItem
          icon={<History size={20} />}
          active={activeItem === "history"}
          onClick={() => onSelect(activeItem === "history" ? "" : "history")}
          title="History"
        />
        <NavItem
          icon={<LayoutGrid size={20} />}
          active={activeItem === "collections"}
          onClick={() =>
            onSelect(activeItem === "collections" ? "" : "collections")
          }
          title="Collections"
        />
      </nav>

      <div className="mt-auto">
        <button className="w-10 h-10 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
          <Settings size={20} />
        </button>
      </div>
    </aside>
  );
};

const NavItem = ({
  icon,
  active,
  onClick,
  title,
}: {
  icon: any;
  active?: boolean;
  onClick: () => void;
  title: string;
}) => (
  <button
    className={cn(
      "w-10 h-10 flex items-center justify-center rounded-md transition-all duration-200",
      active
        ? "bg-muted text-primary shadow-sm"
        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
    )}
    onClick={onClick}
    title={title}
  >
    {icon}
  </button>
);
