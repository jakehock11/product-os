import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntitiesByType, useCreateEntity } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Experiment, ExperimentStatus } from "@/lib/db";

const STATUS_TABS: { value: ExperimentStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "planned", label: "Planned" },
  { value: "running", label: "Running" },
  { value: "paused", label: "Paused" },
  { value: "complete", label: "Complete" },
];

export default function ExperimentsPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: experiments, isLoading } = useEntitiesByType(productId, "experiment");
  const createEntity = useCreateEntity();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ExperimentStatus | "all">("all");

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  const filteredExperiments = useMemo(() => {
    if (!experiments) return [];
    return (experiments as Experiment[])
      .filter((e) => {
        if (statusFilter !== "all" && e.status !== statusFilter) return false;
        if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [experiments, statusFilter, search]);

  const handleCreate = async () => {
    if (!productId) return;
    try {
      const entity = await createEntity.mutateAsync({
        type: "experiment",
        productId,
        title: "Untitled Experiment",
      });
      navigate(`/product/${productId}/experiments/${entity.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to create experiment", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="mb-4 h-10 w-48" />
        <Skeleton className="mb-4 h-10 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Experiments</h1>
          <p className="text-muted-foreground">
            Test hypotheses and gather evidence
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Experiment
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search experiments..."
            className="pl-9"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ExperimentStatus | "all")}>
          <TabsList>
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filteredExperiments.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-4 text-muted-foreground">
            {search || statusFilter !== "all"
              ? "No experiments match your filters."
              : "No experiments yet. Create one to test a hypothesis."}
          </p>
          {!search && statusFilter === "all" && (
            <Button onClick={handleCreate} variant="outline">
              Create your first experiment
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExperiments.map((experiment) => (
            <Link
              key={experiment.id}
              to={`/product/${productId}/experiments/${experiment.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{experiment.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(experiment.updatedAt), { addSuffix: true })}
                </p>
              </div>
              <div className="ml-4 flex items-center gap-2">
                {experiment.outcome && (
                  <Badge 
                    variant={experiment.outcome === "win" ? "default" : "secondary"} 
                    className="capitalize"
                  >
                    {experiment.outcome}
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize">
                  {experiment.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
