import { apiFetch } from "./api";

export const createOrder = async (payload) => {
  const data = await apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data?.id;
};

export const getMyOrders = async () => {
  return await apiFetch("/api/orders/my");
};
