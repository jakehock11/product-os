import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Search, 
  AlertCircle, 
  Lightbulb, 
  FlaskConical, 
  CheckCircle, 
  Paperclip, 
  Zap 
} from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntities } from "@/hooks/useEntities";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDistanceToNow } from "date-fns";
import type { Entity, EntityType } from "@/lib/db";

const TYPE_CONFIG: Record<EntityType, { icon: React.ElementType; label: string; color: string }> = {
  problem: { icon: AlertCircle, label: "Problem", color: "text-red-500" },
  hypothesis: { icon: Lightbulb, label: "Hypothesis", color: "text-yellow-500" },
  experiment: { icon: FlaskConical, label: "Experiment", color: "text-blue-500" },
  decision: { icon: CheckCircle, label: "Decision", color: "text-green-500" },
  artifact: { icon: Paperclip, label: "Artifact", color: "text-purple-500" },
  quick_capture: { icon: Zap, label: "Capture", color: "text-orange-500" },
};

export default function TimelinePage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  
  const { data: entities, isLoading } = useEntities(productId);

  const [search, setSearch] = useState("");
  const [typeFilters, setTypeFilters] = useState<EntityType[]>([]);

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  const timelineItems = useMemo(() => {
    if (!entities) return [];
    return entities
      .filter((e) => {
        if (typeFilters.length > 0 && !typeFilters.includes(e.type)) return false;
        if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [entities, typeFilters, search]);

  const getEntityLink = (entity: Entity) => {
    const typeToPath: Record<EntityType, string> = {
      problem: "problems",
      hypothesis: "hypotheses",
      experiment: "experiments",
      decision: "decisions",
      artifact: "artifacts",
      quick_capture: "quick-captures",
    };
    return `/product/${productId}/${typeToPath[entity.type]}/${entity.id}`;
  };

  const getEntityStatus = (entity: Entity): string | undefined => {
    if (entity.type === "problem") return (entity as any).status;
    if (entity.type === "experiment") return (entity as any).status;
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="mb-4 h-8 w-48" />
        <Skeleton className="mb-4 h-10 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex h-full flex-col">
      <div className="page-header">
        <h1 className="text-lg font-semibold text-foreground">Timeline</h1>
        <p className="text-sm text-muted-foreground">
          Chronological view of all your product thinking
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 content-max-width">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search timeline..."
            className="h-9 pl-9 text-sm"
          />
        </div>
        <ToggleGroup
          type="multiple"
          value={typeFilters}
          onValueChange={(value) => setTypeFilters(value as EntityType[])}
          className="flex-wrap justify-start gap-1.5"
        >
          {Object.entries(TYPE_CONFIG).map(([type, config]) => (
            <ToggleGroupItem
              key={type}
              value={type}
              className="h-7 gap-1.5 px-2.5 text-xs"
              aria-label={`Filter ${config.label}`}
            >
              <config.icon className={`h-3 w-3 ${config.color}`} />
              {config.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {timelineItems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {search || typeFilters.length > 0
              ? "No items match your filters."
              : "No activity yet. Start capturing your product thinking."}
          </p>
        </div>
      ) : (
        <div className="content-max-width space-y-1.5 scrollbar-thin">
          {timelineItems.map((item) => {
            const config = TYPE_CONFIG[item.type];
            const Icon = config.icon;
            const status = getEntityStatus(item);

            return (
              <Link
                key={item.id}
                to={getEntityLink(item)}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-3 shadow-xs transition-all hover:border-border hover:bg-muted/50 hover:shadow-sm"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-medium">
                      {config.label}
                    </Badge>
                    {status && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-medium capitalize">
                        {status}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-1 truncate text-sm font-medium">{item.title}</h3>
                </div>
                <span className="flex-shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
