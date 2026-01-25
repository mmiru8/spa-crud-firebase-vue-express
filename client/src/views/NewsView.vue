<template>
  <div class="page" ref="pageEl">
    <header class="header">
      <div>
        <h1>Noutăți</h1>
        <p class="sub">Ultimele produse adăugate</p>
      </div>

      <button class="btn" @click="refresh" :disabled="loading || loadingMore">
        {{ loading ? "Se încarcă..." : "Reîmprospătează" }}
      </button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <section v-if="!loading && items.length === 0" class="empty">
      Nu există produse.
    </section>

    <section class="grid" v-else>
      <article v-for="p in items" :key="p.id" class="card">
        <div class="cardTop">
          <h3 class="title">{{ p.name }}</h3>
          <div class="price">{{ formatPrice(p.price) }}</div>
        </div>

        <p class="desc">{{ p.description || "Fără descriere" }}</p>

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

    <div v-if="loadingMore" class="loadingMore">Se încarcă...</div>
    <div v-if="allDone && items.length > 0" class="end">Ai ajuns la final.</div>

    <Toast :model-value="toast" />
  </div>
</template>

<script setup>
import BaseButton from "../components/BaseButton.vue";
import Toast from "../components/Toast.vue";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useCartStore } from "../stores/cartStore";

const API_BASE = import.meta.env.VITE_API_BASE;

const cart = useCartStore();

const items = ref([]);
const cursor = ref(null);
const allDone = ref(false);

const loading = ref(false);
const loadingMore = ref(false);
const error = ref("");

const PAGE_SIZE = 12;

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatPrice = (v) => `${toNumber(v).toFixed(2)} RON`;

async function fetchPage({ reset = false } = {}) {
  if (reset) {
    items.value = [];
    cursor.value = null;
    allDone.value = false;
  }
  if (allDone.value) return;

  const qs = new URLSearchParams();
  qs.set("limit", String(PAGE_SIZE));
  if (cursor.value) qs.set("cursor", String(cursor.value));

  const res = await fetch(`${API_BASE}/api/products?${qs.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Eroare API produse");
  }

  const data = await res.json();
  const incoming = Array.isArray(data.items) ? data.items : [];

  const map = new Map(items.value.map((p) => [p.id, p]));
  for (const p of incoming) map.set(p.id, p);
  items.value = Array.from(map.values());

  cursor.value = data.nextCursor ?? null;
  if (!cursor.value) allDone.value = true;
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
    await tickMoreIfShort();
  }
}

async function loadMore() {
  if (loading.value || loadingMore.value || allDone.value) return;

  loadingMore.value = true;
  error.value = "";
  try {
    await fetchPage({ reset: false });
  } catch (e) {
    console.error(e);
    error.value = "Nu am putut încărca încă o pagină.";
  } finally {
    loadingMore.value = false;
    await tickMoreIfShort();
  }
}

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

const pageEl = ref(null);
let scroller = null;
let raf = 0;

function findScroller(startEl) {
  let el = startEl;
  while (el && el !== document.body) {
    const s = getComputedStyle(el);
    const oy = s.overflowY;
    const scrollable = (oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight;
    if (scrollable) return el;
    el = el.parentElement;
  }
  return window;
}

function bottomGap(target) {
  if (target === window) {
    const doc = document.documentElement;
    const top = window.pageYOffset || doc.scrollTop || 0;
    return doc.scrollHeight - (top + window.innerHeight);
  }
  return target.scrollHeight - (target.scrollTop + target.clientHeight);
}

async function maybeLoadOnScroll() {
  if (allDone.value || loading.value || loadingMore.value) return;
  if (!scroller) return;
  if (bottomGap(scroller) < 900) await loadMore();
}

function onScroll() {
  if (raf) return;
  raf = requestAnimationFrame(async () => {
    raf = 0;
    await maybeLoadOnScroll();
  });
}

async function tickMoreIfShort() {
  requestAnimationFrame(async () => {
    await maybeLoadOnScroll();
  });
}

onMounted(async () => {
  await refresh();
  scroller = findScroller(pageEl.value);

  const opts = { passive: true };
  if (scroller === window) window.addEventListener("scroll", onScroll, opts);
  else scroller.addEventListener("scroll", onScroll, opts);

  await tickMoreIfShort();
});

onBeforeUnmount(() => {
  if (scroller === window) window.removeEventListener("scroll", onScroll);
  else if (scroller) scroller.removeEventListener("scroll", onScroll);

  if (raf) cancelAnimationFrame(raf);
  raf = 0;
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
h1 { margin: 0; font-size: 28px; }
.sub { margin: 6px 0 0; color: #555; font-size: 13px; }
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
.desc { margin: 10px 0 0; color: #555; font-size: 13px; min-height: 34px; }
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
.loadingMore, .end {
  margin: 16px 0;
  color: #666;
  font-size: 13px;
}
@media (max-width: 900px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }
</style>
