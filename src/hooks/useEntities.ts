import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEntitiesByProduct,
  getEntitiesByProductAndType,
  getEntity,
  saveEntity,
  deleteEntity,
  generateId,
  type Entity,
  type EntityType,
  type Problem,
  type Hypothesis,
  type Experiment,
  type Decision,
  type Artifact,
  type QuickCapture,
} from "@/lib/db";

const ENTITIES_KEY = ["entities"];

export function useEntities(productId: string | undefined) {
  return useQuery({
    queryKey: [...ENTITIES_KEY, productId],
    queryFn: () => (productId ? getEntitiesByProduct(productId) : []),
    enabled: !!productId,
  });
}

export function useEntitiesByType(productId: string | undefined, type: EntityType) {
  return useQuery({
    queryKey: [...ENTITIES_KEY, productId, type],
    queryFn: () => (productId ? getEntitiesByProductAndType(productId, type) : []),
    enabled: !!productId,
  });
}

export function useEntity(id: string | undefined) {
  return useQuery({
    queryKey: [...ENTITIES_KEY, "single", id],
    queryFn: () => (id ? getEntity(id) : undefined),
    enabled: !!id,
  });
}

type CreateEntityInput = 
  | { type: "problem"; productId: string; title: string; body?: string; status?: Problem["status"] }
  | { type: "hypothesis"; productId: string; title: string; body?: string }
  | { type: "experiment"; productId: string; title: string; body?: string; status?: Experiment["status"] }
  | { type: "decision"; productId: string; title: string; body?: string }
  | { type: "artifact"; productId: string; title: string; body?: string; artifactType?: Artifact["artifactType"] }
  | { type: "quick_capture"; productId: string; title: string; body?: string };

export function useCreateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEntityInput) => {
      const now = new Date().toISOString();

      const baseEntity = {
        id: generateId(),
        productId: input.productId,
        title: input.title,
        body: input.body || "",
        createdAt: now,
        updatedAt: now,
        personaIds: [],
        featureAreaIds: [],
        dimensionValueIdsByDimension: {},
        linkedIds: {},
      };

      let entity: Entity;

      switch (input.type) {
        case "problem":
          entity = { ...baseEntity, type: "problem", status: input.status || "active" } as Problem;
          break;
        case "hypothesis":
          entity = { ...baseEntity, type: "hypothesis" } as Hypothesis;
          break;
        case "experiment":
          entity = { ...baseEntity, type: "experiment", status: input.status || "planned" } as Experiment;
          break;
        case "decision":
          entity = { ...baseEntity, type: "decision" } as Decision;
          break;
        case "artifact":
          entity = { ...baseEntity, type: "artifact", artifactType: input.artifactType || "note" } as Artifact;
          break;
        case "quick_capture":
          entity = { ...baseEntity, type: "quick_capture" } as QuickCapture;
          break;
      }

      await saveEntity(entity);
      return entity;
    },
    onSuccess: (entity) => {
      queryClient.invalidateQueries({ queryKey: ENTITIES_KEY });
    },
  });
}

export function useUpdateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entity: Entity) => {
      const updated = {
        ...entity,
        updatedAt: new Date().toISOString(),
      };
      await saveEntity(updated);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTITIES_KEY });
    },
  });
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEntity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTITIES_KEY });
    },
  });
}

// Helper to get entities by type with proper typing
export function filterEntitiesByType<T extends Entity>(
  entities: Entity[] | undefined,
  type: EntityType
): T[] {
  if (!entities) return [];
  return entities.filter((e) => e.type === type) as T[];
}
