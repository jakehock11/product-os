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
      <div className="p-8">
        <Skeleton className="mb-4 h-10 w-48" />
        <Skeleton className="mb-4 h-10 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Timeline</h1>
        <p className="text-muted-foreground">
          Chronological view of all your product thinking
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search timeline..."
            className="pl-9"
          />
        </div>
        <ToggleGroup
          type="multiple"
          value={typeFilters}
          onValueChange={(value) => setTypeFilters(value as EntityType[])}
          className="flex-wrap justify-start"
        >
          {Object.entries(TYPE_CONFIG).map(([type, config]) => (
            <ToggleGroupItem
              key={type}
              value={type}
              className="gap-2 text-xs"
              aria-label={`Filter ${config.label}`}
            >
              <config.icon className={`h-3 w-3 ${config.color}`} />
              {config.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {timelineItems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-muted-foreground">
            {search || typeFilters.length > 0
              ? "No items match your filters."
              : "No activity yet. Start capturing your product thinking."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {timelineItems.map((item) => {
            const config = TYPE_CONFIG[item.type];
            const Icon = config.icon;
            const status = getEntityStatus(item);

            return (
              <Link
                key={item.id}
                to={getEntityLink(item)}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted`}>
                  <Icon className={`h-5 w-5 ${config.color}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {config.label}
                    </Badge>
                    {status && (
                      <Badge variant="secondary" className="text-xs capitalize">
                        {status}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-1 truncate font-medium">{item.title}</h3>
                </div>
                <span className="text-sm text-muted-foreground">
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
