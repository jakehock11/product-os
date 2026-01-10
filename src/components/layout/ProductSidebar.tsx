import { NavLink } from "react-router-dom";
import {
  Zap,
  Home,
  AlertCircle,
  Lightbulb,
  FlaskConical,
  CheckCircle,
  Paperclip,
  Clock,
  Download,
  Settings,
  Tags,
} from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QuickCaptureButton } from "@/components/quick-capture/QuickCaptureButton";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

function NavItem({ to, icon: Icon, label }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground"
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

export function ProductSidebar() {
  const { currentProductId, currentProduct } = useProductContext();

  if (!currentProductId) return null;

  const basePath = `/product/${currentProductId}`;

  return (
    <div className="flex h-full w-56 flex-col border-r border-border bg-sidebar">
      {/* Product Name Header */}
      <div className="flex h-14 items-center border-b border-border px-4">
        <h2 className="truncate text-sm font-semibold text-sidebar-foreground">
          {currentProduct?.name || "Loading..."}
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {/* Quick Capture CTA */}
        <QuickCaptureButton />

        <Separator className="my-2" />

        <NavItem to={`${basePath}/home`} icon={Home} label="Home" />

        <Separator className="my-2" />

        <NavItem to={`${basePath}/problems`} icon={AlertCircle} label="Problems" />
        <NavItem to={`${basePath}/hypotheses`} icon={Lightbulb} label="Hypotheses" />
        <NavItem to={`${basePath}/experiments`} icon={FlaskConical} label="Experiments" />
        <NavItem to={`${basePath}/decisions`} icon={CheckCircle} label="Decisions" />
        <NavItem to={`${basePath}/artifacts`} icon={Paperclip} label="Artifacts" />

        <Separator className="my-2" />

        <NavItem to={`${basePath}/timeline`} icon={Clock} label="Timeline" />

        <Separator className="my-2" />

        <NavItem to={`${basePath}/taxonomy`} icon={Tags} label="Manage Context" />
        <NavItem to={`${basePath}/exports`} icon={Download} label="Exports" />
        <NavItem to={`${basePath}/settings`} icon={Settings} label="Settings" />
      </nav>
    </div>
  );
}
