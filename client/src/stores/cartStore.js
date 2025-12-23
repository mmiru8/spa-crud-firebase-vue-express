import { defineStore } from "pinia";

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: [], // [{ id, name, price, qty }]
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
      }
    },

    increase(id) {
      const it = this.items.find((x) => x.id === id);
      if (it) it.qty += 1;
    },

    decrease(id) {
      const it = this.items.find((x) => x.id === id);
      if (!it) return;
      it.qty -= 1;
      if (it.qty <= 0) this.items = this.items.filter((x) => x.id !== id);
    },

    remove(id) {
      this.items = this.items.filter((x) => x.id !== id);
    },

    clear() {
      this.items = [];
    },
  },
});
