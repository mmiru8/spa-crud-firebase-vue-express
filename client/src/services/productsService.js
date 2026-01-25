import { apiFetch } from "./api";

/**
 * PRODUSE – CLIENT (cu paginare / infinite scroll)
 */
export const getProducts = async (params = "") => {
  return await apiFetch(`/api/products${params}`);
};

/**
 * PRODUSE – ADMIN (TOATE, fără paginare)
 * GET /api/products/all
 */
export const getProductsAdminAll = async () => {
  return await apiFetch("/api/products/all");
};

/**
 * CREATE PRODUCT (admin)
 */
export const addProduct = async (product) => {
  return await apiFetch("/api/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
};

/**
 * UPDATE PRODUCT (admin)
 */
export const updateProduct = async (id, patch) => {
  return await apiFetch(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
};

/**
 * DELETE PRODUCT (admin)
 */
export const deleteProduct = async (id) => {
  return await apiFetch(`/api/products/${id}`, {
    method: "DELETE",
  });
};
