import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntitiesByType, useCreateEntity } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Decision } from "@/lib/db";

export default function DecisionsPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: decisions, isLoading } = useEntitiesByType(productId, "decision");
  const createEntity = useCreateEntity();

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  const filteredDecisions = useMemo(() => {
    if (!decisions) return [];
    return (decisions as Decision[])
      .filter((d) => {
        if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [decisions, search]);

  const handleCreate = async () => {
    if (!productId) return;
    try {
      const entity = await createEntity.mutateAsync({
        type: "decision",
        productId,
        title: "Untitled Decision",
      });
      navigate(`/product/${productId}/decisions/${entity.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to create decision", variant: "destructive" });
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
          <h1 className="text-2xl font-bold">Decisions</h1>
          <p className="text-muted-foreground">
            Document what was decided and why
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Decision
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions..."
            className="pl-9"
          />
        </div>
      </div>

      {filteredDecisions.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-4 text-muted-foreground">
            {search
              ? "No decisions match your search."
              : "No decisions recorded yet."}
          </p>
          {!search && (
            <Button onClick={handleCreate} variant="outline">
              Record your first decision
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDecisions.map((decision) => (
            <Link
              key={decision.id}
              to={`/product/${productId}/decisions/${decision.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{decision.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {decision.decidedAt
                    ? `Decided ${formatDistanceToNow(new Date(decision.decidedAt), { addSuffix: true })}`
                    : `Created ${formatDistanceToNow(new Date(decision.createdAt), { addSuffix: true })}`}
                </p>
              </div>
              {decision.decisionType && (
                <Badge variant="secondary" className="ml-4 capitalize">
                  {decision.decisionType}
                </Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
