<template>
  <div class="page" ref="pageEl">
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
      <input v-model.trim="query" class="input" type="text" placeholder="Caută după nume..." />

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

        <p class="desc">{{ p.description || "Fără descriere" }}</p>

        <div class="meta" v-if="p.category?.name">
          <span class="badge">{{ p.category.name }}</span>
        </div>

        <div class="actions">
          <BaseButton variant="primary" @click="addToCart(p)">Adaugă în coș</BaseButton>
        </div>
      </article>
    </section>

    <div class="loadMoreWrap" v-if="!loading && !allDone && filteredSorted.length > 0">
      <button class="btn" @click="loadMore" :disabled="loadingMore">
        {{ loadingMore ? "Se încarcă..." : "Încarcă mai multe" }}
      </button>
      <div class="hint">Infinite scroll este activ doar pe „Cele mai noi” fără căutare.</div>
    </div>

    <Toast :model-value="toast" />
  </div>
</template>

<script setup>
import BaseButton from "../components/BaseButton.vue";
import Toast from "../components/Toast.vue";
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useCartStore } from "../stores/cartStore";

const API_BASE = import.meta.env.VITE_API_BASE;

const cart = useCartStore();

const products = ref([]);
const cursor = ref(null);
const allDone = ref(false);

const loading = ref(false);
const loadingMore = ref(false);
const error = ref("");

const query = ref("");
const sortKey = ref("newest");

const PAGE_SIZE = 20;

const pageEl = ref(null);
let scroller = null;
let rafId = 0;

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatPrice = (v) => {
  const n = toNumber(v);
  return `${n.toFixed(2)} RON`;
};

const canInfiniteScroll = computed(() => {
  return sortKey.value === "newest" && query.value.trim() === "" && !allDone.value;
});

function findScroller(startEl) {
  let el = startEl;
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY;
    const canScroll = (overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight;
    if (canScroll) return el;
    el = el.parentElement;
  }
  return window;
}

function bottomGap(target) {
  if (target === window) {
    const doc = document.documentElement;
    const scrollTop = window.pageYOffset || doc.scrollTop || 0;
    return doc.scrollHeight - (scrollTop + window.innerHeight);
  }
  return target.scrollHeight - (target.scrollTop + target.clientHeight);
}

function onScrollEvent() {
  if (rafId) return;
  rafId = requestAnimationFrame(async () => {
    rafId = 0;
    await onScroll();
  });
}

async function onScroll() {
  if (!canInfiniteScroll.value) return;
  if (loading.value || loadingMore.value || allDone.value) return;
  if (bottomGap(scroller) < 800) await loadMore();
}

async function fetchPage({ reset = false } = {}) {
  if (reset) {
    products.value = [];
    cursor.value = null;
    allDone.value = false;
  }

  if (allDone.value) return;

  const qs = new URLSearchParams();
  qs.set("limit", String(PAGE_SIZE));
  if (cursor.value !== null && cursor.value !== undefined) qs.set("cursor", String(cursor.value));

  const res = await fetch(`${API_BASE}/api/products?${qs.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Eroare API produse");
  }

  const data = await res.json();
  const incoming = Array.isArray(data.items) ? data.items : [];

  const map = new Map(products.value.map((p) => [p.id, p]));
  for (const p of incoming) map.set(p.id, p);
  products.value = Array.from(map.values());

  const hasNextCursor = Object.prototype.hasOwnProperty.call(data, "nextCursor");

  if (!hasNextCursor || data.nextCursor === null || data.nextCursor === undefined) {
    allDone.value = true;
    cursor.value = null;
    return;
  }

  cursor.value = data.nextCursor;
  if (incoming.length === 0) allDone.value = true;
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
  if (allDone.value || loadingMore.value || loading.value) return;
  loadingMore.value = true;
  error.value = "";
  try {
    await fetchPage({ reset: false });
  } catch (e) {
    console.error(e);
    error.value = "Nu am putut încărca încă o pagină.";
  } finally {
    loadingMore.value = false;
    await onScroll();
  }
}

const filteredSorted = computed(() => {
  const q = query.value.toLowerCase().trim();

  let arr = products.value.filter((p) => (p.name || "").toLowerCase().includes(q)).slice();

  if (sortKey.value === "newest") {
    arr.sort(
      (a, b) =>
        String(b.createdAt || "").localeCompare(String(a.createdAt || "")) ||
        String(b.id || "").localeCompare(String(a.id || ""))
    );
    return arr;
  }

  const parts = sortKey.value.split("-");
  const dir = parts[parts.length - 1];
  const key = parts.slice(0, -1).join("-");
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

watch([query, sortKey], async ([q, sk]) => {
  if (sk === "newest" && q.trim() === "") {
    await refresh();
    await onScroll();
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

onMounted(async () => {
  await refresh();

  scroller = findScroller(pageEl.value);
  const opts = { passive: true };

  if (scroller === window) {
    window.addEventListener("scroll", onScrollEvent, opts);
  } else {
    scroller.addEventListener("scroll", onScrollEvent, opts);
  }

  await onScroll();
});

onBeforeUnmount(() => {
  if (!scroller) return;

  if (scroller === window) {
    window.removeEventListener("scroll", onScrollEvent);
  } else {
    scroller.removeEventListener("scroll", onScrollEvent);
  }

  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  scroller = null;
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
h1 {
  margin: 0;
  font-size: 28px;
}
.sub {
  margin: 6px 0 0;
  color: #555;
  font-size: 13px;
}

.controls {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.input,
.select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  outline: none;
}
.input {
  flex: 1;
  min-width: 220px;
}
.select {
  min-width: 220px;
}

.btn {
  padding: 10px 12px;
  border: 1px solid #111;
  background: #111;
  color: #fff;
  border-radius: 10px;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

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
.title {
  margin: 0;
  font-size: 16px;
}
.price {
  font-weight: 700;
  white-space: nowrap;
}
.desc {
  margin: 10px 0 0;
  color: #555;
  font-size: 13px;
  min-height: 34px;
}
.meta {
  margin-top: 10px;
}
.badge {
  display: inline-block;
  font-size: 12px;
  background: #f4f4f4;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid #e6e6e6;
}
.actions {
  margin-top: 12px;
}

.loadMoreWrap {
  margin: 18px 0 10px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.hint {
  font-size: 12px;
  color: #666;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 560px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
