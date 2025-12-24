import { apiFetch } from "./api";

export const getProducts = async () => {
  return await apiFetch("/api/products");
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
