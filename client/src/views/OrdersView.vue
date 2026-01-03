<template>
  <div class="page">
    <header class="header">
      <div>
        <h1>Comenzi</h1>
        <p class="sub">Comenzi salvate în Firestore</p>
      </div>

      <button class="btn" @click="load" :disabled="loading">
        {{ loading ? "Se încarcă..." : "Reîmprospătează" }}
      </button>
    </header>

<p v-if="error" class="error">{{ error }}</p>

<section v-if="loading" class="empty">
  Se încarcă...
</section>

<section v-else-if="!error && orders.length === 0" class="empty">
  Nu există comenzi.
</section>
    <section v-else class="list">
      <article v-for="o in orders" :key="o.id" class="card">
        <div class="top">
          <div>
            <div class="id">Comanda: {{ o.id }}</div>
            <div class="muted">Status: {{ o.status || "noua" }}</div>
            <div class="muted">
              Data:
              {{ formatDate(o.createdAt) }}
            </div>
          </div>
          <div class="sum">{{ formatPrice(o.totalPrice) }}</div>
        </div>

        <div class="muted">
          Produse: {{ o.totalItems || (o.products ? o.products.length : 0) }}
        </div>

        <ul class="items" v-if="o.products?.length">
          <li v-for="it in o.products" :key="it.productId">
            {{ it.productSnapshot.name }} × {{ it.quantity }} ({{ formatPrice(it.priceAtPurchase) }})
          </li>
        </ul>
      </article>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { getMyOrders } from "../services/ordersService";

const orders = ref([]);
const loading = ref(false);
const error = ref("");

const formatPrice = (v) => `${Number(v || 0).toFixed(2)} RON`;

const formatDate = (ts) => {
  // ts poate fi Firestore Timestamp sau null
  if (!ts) return "—";
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString("ro-RO");
  } catch {
    return "—";
  }
};

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    
    orders.value = await getMyOrders(); 
  } catch (e) {
    console.error(e);
error.value = "Nu am putut încărca comenzile. Verifică Firestore Rules / index / conexiunea.";
    orders.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.page { max-width: 980px; margin: 24px auto; padding: 0 16px; font-family: system-ui; }
.header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
h1 { margin:0; font-size:28px; }
.sub { margin:6px 0 0; color:#555; font-size:13px; }

.btn { padding:10px 12px; border:1px solid #111; background:#111; color:#fff; border-radius:10px; cursor:pointer; }
.btn:disabled { opacity:.6; cursor:not-allowed; }

.error { margin-top: 12px; background:#ffecec; color:#a40000; border:1px solid #ffb3b3; padding:10px 12px; border-radius:10px; }
.empty { margin-top:16px; padding:16px; border:1px dashed #ddd; border-radius:12px; color:#666; }

.list { margin-top: 16px; display:grid; gap:12px; }
.card { border:1px solid #eee; border-radius:14px; padding:14px; background:#fff; }
.top { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
.id { font-weight:700; }
.muted { color:#666; font-size:12px; margin-top:4px; }
.sum { font-weight:800; white-space:nowrap; }
.items { margin:10px 0 0; padding-left:18px; }
</style>
