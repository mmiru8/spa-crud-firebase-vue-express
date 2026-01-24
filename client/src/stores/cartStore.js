import { defineStore } from "pinia";
const STORAGE_KEY = "nailshop_cart_v1";

const loadCartState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveCartState = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: loadCartState() || [], // [{ id, name, price, qty }]
  }),

  getters: {
    totalItems: (state) => state.items.reduce((s, it) => s + it.qty, 0),
    totalPrice: (state) =>
      state.items.reduce((s, it) => s + Number(it.price || 0) * it.qty, 0),
  },

  actions: {
    addToCart(product) {
      if (!product?.id) return;

      const idx = this.items.findIndex((it) => it.id === product.id);

      if (idx !== -1) {
        this.items[idx].qty += 1;
      } else {
        this.items.push({
          id: product.id,
          name: product.name || "Produs",
          price: Number(product.price || 0),
          qty: 1,
        });
         saveCartState(this.items);
      }
    },

    increase(id) {
      const it = this.items.find((x) => x.id === id);
      if (it) it.qty += 1;
      saveCartState(this.items);
    },

    decrease(id) {
      const it = this.items.find((x) => x.id === id);
      if (!it) return;
      it.qty -= 1;
      if (it.qty <= 0) this.items = this.items.filter((x) => x.id !== id);
      saveCartState(this.items);
    },

    remove(id) {
      this.items = this.items.filter((x) => x.id !== id);
    },

    clear() {
      this.items = [];
      saveCartState(this.items);
    },
  },
});
