import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Plus, Search, Link as LinkIcon, Image, FileText, HelpCircle, Database } from "lucide-react";
import { useProductContext } from "@/contexts/ProductContext";
import { useEntitiesByType, useCreateEntity } from "@/hooks/useEntities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Artifact, ArtifactType } from "@/lib/db";

const ARTIFACT_ICONS: Record<ArtifactType, React.ElementType> = {
  link: LinkIcon,
  image: Image,
  file: FileText,
  note: FileText,
  query: Database,
};

export default function ArtifactsPage() {
  const { productId } = useParams<{ productId: string }>();
  const { setCurrentProduct } = useProductContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: artifacts, isLoading } = useEntitiesByType(productId, "artifact");
  const createEntity = useCreateEntity();

  const [search, setSearch] = useState("");

  useEffect(() => {
    if (productId) setCurrentProduct(productId);
  }, [productId, setCurrentProduct]);

  const filteredArtifacts = useMemo(() => {
    if (!artifacts) return [];
    return (artifacts as Artifact[])
      .filter((a) => {
        if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [artifacts, search]);

  const handleCreate = async () => {
    if (!productId) return;
    try {
      const entity = await createEntity.mutateAsync({
        type: "artifact",
        productId,
        title: "Untitled Artifact",
        artifactType: "note",
      });
      navigate(`/product/${productId}/artifacts/${entity.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to create artifact", variant: "destructive" });
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
          <h1 className="text-2xl font-bold">Artifacts</h1>
          <p className="text-muted-foreground">
            Links, images, files, and notes that support your thinking
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Artifact
        </Button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artifacts..."
            className="pl-9"
          />
        </div>
      </div>

      {filteredArtifacts.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="mb-4 text-muted-foreground">
            {search
              ? "No artifacts match your search."
              : "No artifacts yet. Add links, images, or notes to support your thinking."}
          </p>
          {!search && (
            <Button onClick={handleCreate} variant="outline">
              Create your first artifact
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredArtifacts.map((artifact) => {
            const Icon = ARTIFACT_ICONS[artifact.artifactType] || HelpCircle;
            return (
              <Link
                key={artifact.id}
                to={`/product/${productId}/artifacts/${artifact.id}`}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{artifact.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Updated {formatDistanceToNow(new Date(artifact.updatedAt), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {artifact.artifactType}
                </Badge>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
