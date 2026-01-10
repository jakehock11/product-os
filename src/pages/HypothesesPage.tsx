import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntitiesByType, useCreateEntity } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Hypothesis } from "@/lib/db";

export default function HypothesesPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: hypotheses, isLoading } = useEntitiesByType(productId, "hypothesis");
  const createEntity = useCreateEntity();

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  const filteredHypotheses = useMemo(() => {
    if (!hypotheses) return [];
    return (hypotheses as Hypothesis[])
      .filter((h) => {
        if (search && !h.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [hypotheses, search]);

  const handleCreate = async () => {
    if (!productId) return;
    try {
      const entity = await createEntity.mutateAsync({
        type: "hypothesis",
        productId,
        title: "Untitled Hypothesis",
      });
      navigate(`/product/${productId}/hypotheses/${entity.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to create hypothesis", variant: "destructive" });
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
          <h1 className="text-2xl font-bold">Hypotheses</h1>
          <p className="text-muted-foreground">
            Beliefs about problems and potential solutions
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Hypothesis
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hypotheses..."
            className="pl-9"
          />
        </div>
      </div>

      {filteredHypotheses.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-4 text-muted-foreground">
            {search
              ? "No hypotheses match your search."
              : "No hypotheses yet. Create one to start testing your beliefs."}
          </p>
          {!search && (
            <Button onClick={handleCreate} variant="outline">
              Create your first hypothesis
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredHypotheses.map((hypothesis) => (
            <Link
              key={hypothesis.id}
              to={`/product/${productId}/hypotheses/${hypothesis.id}`}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{hypothesis.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Updated {formatDistanceToNow(new Date(hypothesis.updatedAt), { addSuffix: true })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
