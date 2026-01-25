<template>
  <div class="page">
    <header class="header">
      <div>
        <h1>Catalog produse</h1>
        <p class="sub">Produse pentru unghii – listare (client)</p>
      </div>

      <button class="btn" @click="refresh" :disabled="loading">
        {{ loading ? "Se încarcă..." : "Reîmprospătează" }}
      </button>
    </header>

    <section class="controls">
      <input
        v-model.trim="query"
        class="input"
        type="text"
        placeholder="Caută după nume..."
      />

      <select v-model="sortKey" class="select">
        <option value="newest">Cele mai noi</option>
        <option value="name-asc">Nume (A → Z)</option>
        <option value="name-desc">Nume (Z → A)</option>
        <option value="price-asc">Preț (mic → mare)</option>
        <option value="price-desc">Preț (mare → mic)</option>
        <option value="cat-price-name-asc">Categorie → Preț → Nume (↑)</option>
        <option value="cat-price-name-desc">Categorie → Preț → Nume (↓)</option>
      </select>
    </section>

    <p v-if="error" class="error">{{ error }}</p>

    <section v-if="!loading && filteredSorted.length === 0" class="empty">
      Nu există produse.
    </section>

    <section class="grid" v-else>
      <article v-for="p in filteredSorted" :key="p.id" class="card">
        <div class="cardTop">
          <h3 class="title">{{ p.name }}</h3>
          <div class="price">{{ formatPrice(p.price) }}</div>
        </div>

        <p class="desc">
          {{ p.description || "Fără descriere" }}
        </p>

        <div class="meta" v-if="p.category?.name">
          <span class="badge">{{ p.category.name }}</span>
        </div>

        <div class="actions">
          <BaseButton variant="primary" @click="addToCart(p)">
            Adaugă în coș
          </BaseButton>
        </div>
      </article>
    </section>

    <!-- Load more / Infinite scroll sentinel -->
    <div class="loadMoreWrap" v-if="!loading && !allDone && filteredSorted.length > 0">
      <button class="btn" @click="loadMore" :disabled="loadingMore">
        {{ loadingMore ? "Se încarcă..." : "Încarcă mai multe" }}
      </button>
      <div class="hint">
        Infinite scroll este activ doar pe „Cele mai noi” fără căutare.
      </div>
    </div>

    <!-- sentinel: doar când are voie infinite scroll -->
    <div ref="sentinel" class="sentinel" v-if="canInfiniteScroll"></div>

    <Toast :model-value="toast" />
  </div>
</template>

<script setup>
import BaseButton from "../components/BaseButton.vue";
import Toast from "../components/Toast.vue";
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useCartStore } from "../stores/cartStore";

// IMPORTANT: endpoint-ul tău întoarce { items, nextCursor }
const API_BASE = import.meta.env.VITE_API_BASE;

const cart = useCartStore();

const products = ref([]);        // tot ce am încărcat până acum
const cursor = ref(null);        // nextCursor din backend
const allDone = ref(false);      // nu mai avem pagini

const loading = ref(false);
const loadingMore = ref(false);
const error = ref("");

const query = ref("");
const sortKey = ref("newest");

const sentinel = ref(null);
let io = null;

const MAX_ITEMS = 60;            // ca să nu mai ai „prea multe produse”
const PAGE_SIZE = 12;

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatPrice = (v) => {
  const n = toNumber(v);
  return `${n.toFixed(2)} RON`;
};

// infinite scroll doar pe default (newest) și fără căutare
const canInfiniteScroll = computed(() => {
  return sortKey.value === "newest" && query.value.trim() === "" && !allDone.value;
});

async function fetchPage({ reset = false } = {}) {
  if (reset) {
    products.value = [];
    cursor.value = null;
    allDone.value = false;
  }

  // limit hard ca să nu mai ai 200 produse în UI
  if (products.value.length >= MAX_ITEMS) {
    allDone.value = true;
    return;
  }

  const limit = Math.min(PAGE_SIZE, MAX_ITEMS - products.value.length);
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (cursor.value) qs.set("cursor", cursor.value);

  const res = await fetch(`${API_BASE}/api/products?${qs.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Eroare API produse");
  }

  const data = await res.json(); // { items, nextCursor }
  const incoming = Array.isArray(data.items) ? data.items : [];

  // concat + dedup
  const map = new Map(products.value.map((p) => [p.id, p]));
  for (const p of incoming) map.set(p.id, p);
  products.value = Array.from(map.values());

  cursor.value = data.nextCursor || null;
  if (!cursor.value || incoming.length === 0) allDone.value = true;
}

async function refresh() {
  loading.value = true;
  error.value = "";
  try {
    await fetchPage({ reset: true });
  } catch (e) {
    console.error(e);
    error.value = "Nu am putut încărca produsele.";
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  if (allDone.value) return;
  loadingMore.value = true;
  error.value = "";
  try {
    await fetchPage({ reset: false });
  } catch (e) {
    console.error(e);
    error.value = "Nu am putut încărca încă o pagină.";
  } finally {
    loadingMore.value = false;
  }
}

const filteredSorted = computed(() => {
  const q = query.value.toLowerCase().trim();

  // filtrare
  let arr = products.value
    .filter((p) => (p.name || "").toLowerCase().includes(q))
    .slice();

  // sortare
  if (sortKey.value === "newest") {
    // newest = createdAt desc (string ISO) + fallback id
    arr.sort((a, b) =>
      String(b.createdAt || "").localeCompare(String(a.createdAt || "")) ||
      String(b.id || "").localeCompare(String(a.id || ""))
    );
    return arr;
  }

  const parts = sortKey.value.split("-");
  const dir = parts[parts.length - 1]; // asc / desc
  const key = parts.slice(0, -1).join("-"); // name / price / cat-price-name
  const sign = dir === "asc" ? 1 : -1;

  arr.sort((a, b) => {
    if (key === "name") {
      return sign * String(a.name || "").toLowerCase().localeCompare(String(b.name || "").toLowerCase());
    }
    if (key === "price") {
      return sign * (toNumber(a.price) - toNumber(b.price));
    }
    if (key === "cat-price-name") {
      const catA = (a.category?.name || a.category?.id || "").toLowerCase();
      const catB = (b.category?.name || b.category?.id || "").toLowerCase();
      const c = catA.localeCompare(catB);
      if (c) return sign * c;

      const p = toNumber(a.price) - toNumber(b.price);
      if (p) return sign * p;

      return sign * String(a.name || "").toLowerCase().localeCompare(String(b.name || "").toLowerCase());
    }
    return 0;
  });

  return arr;
});

// dacă user schimbă căutare/sort, nu mai vrem să tot încarce automat -> rămânem pe ce e încărcat.
// dacă vrei să fie „curat”, poți să dai refresh automat:
watch([query, sortKey], async ([q, sk], [oldQ, oldSk]) => {
  // dacă revine pe newest + query gol => reactivăm infinite și reîncarcăm de la zero
  if (sk === "newest" && q.trim() === "") {
    await refresh();
  }
});

const toast = ref("");
let toastTimer = null;
const showToast = (msg) => {
  toast.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.value = "";
    toastTimer = null;
  }, 2000);
};

const addToCart = (p) => {
  cart.addToCart(p);
  showToast(`"${p.name}" a fost adăugat în coș`);
};

function setupIO() {
  if (io) io.disconnect();
  if (!sentinel.value) return;

  io = new IntersectionObserver(async (entries) => {
    const ent = entries[0];
    if (ent.isIntersecting && canInfiniteScroll.value && !loadingMore.value) {
      await loadMore();
    }
  });

  io.observe(sentinel.value);
}

watch(canInfiniteScroll, () => {
  // reconfigurează observer când se activează/dezactivează
  setTimeout(setupIO, 0);
});

onMounted(async () => {
  await refresh();
  setupIO();
});

onBeforeUnmount(() => {
  if (io) io.disconnect();
});
</script>

<style scoped>
.page {
  max-width: 980px;
  margin: 24px auto;
  padding: 0 16px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
h1 { margin: 0; font-size: 28px; }
.sub { margin: 6px 0 0; color: #555; font-size: 13px; }

.controls {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.input, .select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  outline: none;
}
.input { flex: 1; min-width: 220px; }
.select { min-width: 220px; }

.btn {
  padding: 10px 12px;
  border: 1px solid #111;
  background: #111;
  color: #fff;
  border-radius: 10px;
  cursor: pointer;
}
.btn:disabled { opacity: .6; cursor: not-allowed; }

.error {
  margin-top: 12px;
  background: #ffecec;
  color: #a40000;
  border: 1px solid #ffb3b3;
  padding: 10px 12px;
  border-radius: 10px;
}
.empty {
  margin-top: 16px;
  padding: 16px;
  border: 1px dashed #ddd;
  border-radius: 12px;
  color: #666;
}

.grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.card {
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}
.cardTop {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}
.title { margin: 0; font-size: 16px; }
.price { font-weight: 700; white-space: nowrap; }
.desc {
  margin: 10px 0 0;
  color: #555;
  font-size: 13px;
  min-height: 34px;
}
.meta { margin-top: 10px; }
.badge {
  display: inline-block;
  font-size: 12px;
  background: #f4f4f4;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #e6e6e6;
}
.actions { margin-top: 12px; }

.loadMoreWrap {
  margin: 18px 0 10px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.hint { font-size: 12px; color: #666; }

.sentinel { height: 1px; }

@media (max-width: 900px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }
</style>
