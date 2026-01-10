import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getAllProducts, 
  getProduct, 
  saveProduct, 
  deleteProduct,
  generateId,
  type Product,
  type Taxonomy
} from "@/lib/db";

const PRODUCTS_KEY = ["products"];

export function useProducts() {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: getAllProducts,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, id],
    queryFn: () => (id ? getProduct(id) : undefined),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; icon?: Product["icon"] }) => {
      const now = new Date().toISOString();
      const emptyTaxonomy: Taxonomy = {
        personas: [],
        featureAreas: [],
        dimensions: [],
      };

      const product: Product = {
        id: generateId(),
        name: data.name,
        icon: data.icon,
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
        taxonomy: emptyTaxonomy,
      };

      await saveProduct(product);
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product) => {
      const updated = {
        ...product,
        updatedAt: new Date().toISOString(),
      };
      await saveProduct(updated);
      return updated;
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
      queryClient.invalidateQueries({ queryKey: [...PRODUCTS_KEY, product.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
    },
  });
}
