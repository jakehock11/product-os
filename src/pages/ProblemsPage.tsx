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
import type { Problem, ProblemStatus } from "@/lib/db";

const STATUS_TABS: { value: ProblemStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "exploring", label: "Exploring" },
  { value: "blocked", label: "Blocked" },
  { value: "solved", label: "Solved" },
  { value: "archived", label: "Archived" },
];

export default function ProblemsPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: problems, isLoading } = useEntitiesByType(productId, "problem");
  const createEntity = useCreateEntity();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProblemStatus | "all">("all");

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  const filteredProblems = useMemo(() => {
    if (!problems) return [];
    return (problems as Problem[])
      .filter((p) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [problems, statusFilter, search]);

  const handleCreate = async () => {
    if (!productId) return;
    try {
      const entity = await createEntity.mutateAsync({
        type: "problem",
        productId,
        title: "Untitled Problem",
      });
      navigate(`/product/${productId}/problems/${entity.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to create problem", variant: "destructive" });
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
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Problems</h1>
          <p className="text-muted-foreground">
            Track and explore problems worth solving
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Problem
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search problems..."
            className="pl-9"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProblemStatus | "all")}>
          <TabsList>
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filteredProblems.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-4 text-muted-foreground">
            {search || statusFilter !== "all"
              ? "No problems match your filters."
              : "No problems yet. Create one to get started."}
          </p>
          {!search && statusFilter === "all" && (
            <Button onClick={handleCreate} variant="outline">
              Create your first problem
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProblems.map((problem) => (
            <Link
              key={problem.id}
              to={`/product/${productId}/problems/${problem.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{problem.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(problem.updatedAt), { addSuffix: true })}
                </p>
              </div>
              <Badge variant="secondary" className="ml-4 capitalize">
                {problem.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
