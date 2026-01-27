import { apiFetch } from "./api";

export const getProducts = async (params = "") => {
  return await apiFetch(`/api/products${params}`);
};

export const getProductsAdminAll = async () => {
  return await apiFetch("/api/products/all");
};

export const addProduct = async (product) => {
  return await apiFetch("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
};

export const updateProduct = async (id, patch) => {
  return await apiFetch(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
};

export const deleteProduct = async (id) => {
  return await apiFetch(`/api/products/${id}`, {
    method: "DELETE",
  });
};