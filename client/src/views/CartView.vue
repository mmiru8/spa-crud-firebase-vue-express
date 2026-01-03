<template>
  <div class="page">
    <header class="header">
      <div>
        <h1>Coș</h1>
        <p class="sub">Produsele selectate de client</p>
      </div>

      <div class="actions">
        <button class="btn" @click="placeOrder" :disabled="!items.length || placing">
          {{ placing ? "Se finalizează..." : "Finalizează comanda" }}
        </button>

        <button class="btnDanger" @click="clear" :disabled="!items.length || placing">
          Golește coșul
        </button>
      </div>
    </header>

    <p v-if="placeError" class="error">{{ placeError }}</p>

    <section v-if="!items.length" class="empty">
      Coșul este gol.
    </section>

    <section v-else class="list">
      <article v-for="it in items" :key="it.id" class="row">
        <div class="info">
          <div class="name">{{ it.name }}</div>
          <div class="muted">{{ formatPrice(it.price) }} / buc</div>
        </div>

        <div class="qty">
          <button class="btnSmall" @click="decrease(it.id)" :disabled="placing">−</button>
          <div class="count">{{ it.qty }}</div>
          <button class="btnSmall" @click="increase(it.id)" :disabled="placing">+</button>
        </div>

        <div class="sum">
          {{ formatPrice(it.price * it.qty) }}
        </div>

        <button class="btnLink" @click="remove(it.id)" :disabled="placing">Șterge</button>
      </article>

      <div class="total">
        <div><strong>Total produse:</strong> {{ totalItems }}</div>
        <div><strong>Total:</strong> {{ formatPrice(totalPrice) }}</div>
      </div>
    </section>
  </div>
</template>


<script setup>
import { computed, ref } from "vue";
import { useCartStore } from "../stores/cartStore";
import { createOrder } from "../services/ordersService";
import { useRouter } from "vue-router";

const router = useRouter();
const cart = useCartStore();

const placing = ref(false);
const placeError = ref("");

const items = computed(() => cart.items);
const totalItems = computed(() => cart.totalItems);
const totalPrice = computed(() => cart.totalPrice);

const formatPrice = (v) => `${Number(v || 0).toFixed(2)} RON`;

const placeOrder = async () => {
  placeError.value = "";
  if (!cart.items.length) return;

  placing.value = true;
  try {
await createOrder({
  items: cart.items.map((it) => ({
    productId: it.id,
    qty: Number(it.qty || 1),
  })),
});


    cart.clear();
    router.push("/comenzi");
  } catch (e) {
    console.error(e);
    placeError.value =
      e?.message?.includes("authenticated")
        ? "Trebuie să fii logat ca să finalizezi comanda."
        : "Nu am putut finaliza comanda. Verifică Firestore Rules.";
  } finally {
    placing.value = false;
  }
};

const increase = (id) => cart.increase(id);
const decrease = (id) => cart.decrease(id);
const remove = (id) => cart.remove(id);
const clear = () => cart.clear();
</script>


<style scoped>
.page { max-width: 980px; margin: 24px auto; padding: 0 16px; font-family: system-ui; }
.header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
.actions { display:flex; gap:10px; }

h1 { margin:0; font-size:28px; }
.sub { margin:6px 0 0; color:#555; font-size:13px; }

.btn {
  padding: 10px 12px;
  border: 1px solid #111;
  background: #111;
  color: #fff;
  border-radius: 10px;
  cursor: pointer;
}
.btn:disabled { opacity: .6; cursor: not-allowed; }

.btnDanger {
  padding:10px 12px;
  border:1px solid #b00020;
  background:#b00020;
  color:#fff;
  border-radius:10px;
  cursor:pointer;
}
.btnDanger:disabled { opacity:.6; cursor:not-allowed; }

.error {
  margin-top: 12px;
  background: #ffecec;
  color: #a40000;
  border: 1px solid #ffb3b3;
  padding: 10px 12px;
  border-radius: 10px;
}

.empty { margin-top:16px; padding:16px; border:1px dashed #ddd; border-radius:12px; color:#666; }

.list { margin-top:16px; border:1px solid #eee; border-radius:14px; overflow:hidden; background:#fff; }
.row {
  display:grid;
  grid-template-columns: 1fr 160px 140px 90px;
  gap:12px;
  padding:12px 14px;
  border-top:1px solid #f2f2f2;
  align-items:center;
}
.row:first-child { border-top:none; }
.name { font-weight:700; }
.muted { color:#666; font-size:12px; margin-top:2px; }

.qty { display:flex; align-items:center; justify-content:center; gap:8px; }
.count { min-width:28px; text-align:center; font-weight:700; }
.sum { text-align:right; font-weight:700; }

.btnSmall { width:34px; height:34px; border:1px solid #ddd; background:#fff; border-radius:10px; cursor:pointer; }
.btnSmall:disabled { opacity:.6; cursor:not-allowed; }

.btnLink { border:none; background:transparent; color:#b00020; cursor:pointer; text-align:right; }
.btnLink:disabled { opacity:.6; cursor:not-allowed; }

.total { display:flex; justify-content:space-between; padding:14px; border-top:1px solid #eee; background:#fafafa; }

@media (max-width: 760px) {
  .header { flex-direction:column; align-items:stretch; }
  .actions { justify-content:flex-start; flex-wrap:wrap; }
  .row { grid-template-columns: 1fr; }
  .sum { text-align:left; }
  .total { flex-direction:column; gap:6px; }
}
</style>
