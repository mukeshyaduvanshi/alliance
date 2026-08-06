import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  AssignRateDto,
  BrandRateDto,
  CreateCategoryDto,
  CreateProductDto,
  Paginated,
  ProductCategoryDto,
  ProductDto,
  UpdateProductDto,
  UpdateRegionRatesDto,
} from "@cj/types";

import { api } from "@/lib/api";

export function useCategories(page = 1) {
  return useQuery({
    queryKey: ["product-categories", page],
    queryFn: () =>
      api.get<Paginated<ProductCategoryDto>>(
        `/product-categories?page=${page}&pageSize=${100}`
      ),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryDto) =>
      api.post<ProductCategoryDto>("/product-categories", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product-categories"] });
    },
  });
}

export function useProducts(page = 1) {
  return useQuery({
    queryKey: ["products", page],
    queryFn: () =>
      api.get<Paginated<ProductDto>>(`/products?page=${page}&pageSize=${20}`),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => api.get<ProductDto>(`/products/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductDto) => api.post<ProductDto>("/products", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      api.patch<ProductDto>(`/products/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateRegionRates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      type,
    }: {
      id: string;
      data: UpdateRegionRatesDto;
      type: "brand" | "vendor";
    }) =>
      api.patch(
        `/products/${id}/${type === "brand" ? "region-rates" : "vendor-region-rates"}`,
        data
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useBrandRates(brandId: string) {
  return useQuery({
    queryKey: ["brands", brandId, "rates"],
    queryFn: () => api.get<BrandRateDto[]>(`/brands/${brandId}/rates`),
    enabled: Boolean(brandId),
  });
}

export function useAssignRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ brandId, data }: { brandId: string; data: AssignRateDto }) =>
      api.post(`/brands/${brandId}/rates`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useDeleteRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ brandId, productId }: { brandId: string; productId: string }) =>
      api.delete(`/brands/${brandId}/rates/${productId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}
