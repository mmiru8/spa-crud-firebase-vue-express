<template>
  <div class="page">
    <header class="header">
      <div>
        <h1>Catalog produse</h1>
        <p class="sub">Produse pentru unghii – listare (client)</p>
      </div>

      <button class="btn" @click="refresh" :disabled="loading || loadingMore">
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

    <!-- punctul “invizibil” care declanșează încărcarea următoarei pagini -->
    <div ref="sentinel" class="sentinel" v-if="hasMore"></div>

    <p v-if="loadingMore" class="mutedLine">Se încarcă mai multe produse...</p>
    <p v-if="!hasMore && products.length" class="mutedLine">Ai ajuns la final.</p>

    <Toast :model-value="toast" />
  </div>
</template>

<script setup>
import BaseButton from "../components/BaseButton.vue";
import Toast from "../components/Toast.vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { getProducts } from "../services/productsService";
import { useCartStore } from "../stores/cartStore";

const cart = useCartStore();

// ===== state listă produse =====
const products = ref([]);
const loading = ref(false);
const loadingMore = ref(false);
const error = ref("");

// ===== search + sort =====
const query = ref("");
const sortKey = ref("name-asc");

// ===== pagination =====
const cursor = ref("");     // nextCursor primit din API
const hasMore = ref(true);  // mai există pagini?
const pageSize = 12;

// ===== infinite scroll =====
const sentinel = ref(null);
let observer = null;

// ===== toast =====
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

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatPrice = (v) => `${toNumber(v).toFixed(2)} RON`;

const addToCart = (p) => {
  cart.addToCart(p);
  showToast(`✅ "${p.name}" a fost adăugat în coș`);
};

// ===== load pagină (reset = true → începe de la 0) =====
const load = async (reset = false) => {
  if (reset) {
    products.value = [];
    cursor.value = "";
    hasMore.value = true;
  }

  if (!hasMore.value) return;

  error.value = "";

  // prima pagină -> loading, pagini următoare -> loadingMore
  if (products.value.length === 0) loading.value = true;
  else loadingMore.value = true;

  try {
    // API returnează: { items: [...], nextCursor: "createdAt|docId" }
    const resp = await getProducts({ limit: pageSize, cursor: cursor.value });

    const items = resp?.items || [];
    const next = resp?.nextCursor || null;

    products.value.push(...items);

    cursor.value = next || "";
    hasMore.value = Boolean(next) && items.length > 0;
  } catch (e) {
    console.error(e);
    error.value = "Nu am putut încărca produsele. Verifică serverul / token / CORS.";
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// buton “Reîmprospătează”
const refresh = async () => {
  await load(true);
};

// ===== sortare + filtrare (pe ce ai încărcat) =====
const filteredSorted = computed(() => {
  const q = query.value.toLowerCase();

  const arr = products.value
    .filter((p) => (p.name || "").toLowerCase().includes(q))
    .slice();

  const parts = sortKey.value.split("-");
  const dir = parts[parts.length - 1]; // asc / desc
  const key = parts.slice(0, -1).join("-"); // name / price / cat-price-name

  arr.sort((a, b) => {
    const sign = dir === "asc" ? 1 : -1;

    if (key === "name") {
      const A = (a.name || "").toLowerCase();
      const B = (b.name || "").toLowerCase();
      return sign * A.localeCompare(B);
    }

    if (key === "price") {
      const A = toNumber(a.price);
      const B = toNumber(b.price);
      return sign * (A - B);
    }

    if (key === "cat-price-name") {
      const catA = (a.category?.name || a.category?.id || "").toLowerCase();
      const catB = (b.category?.name || b.category?.id || "").toLowerCase();
      const c = catA.localeCompare(catB);
      if (c) return sign * c;

      const pA = toNumber(a.price);
      const pB = toNumber(b.price);
      const p = pA - pB;
      if (p) return sign * p;

      const nA = (a.name || "").toLowerCase();
      const nB = (b.name || "").toLowerCase();
      return sign * nA.localeCompare(nB);
    }

    return 0;
  });

  return arr;
});

// ===== mount =====
onMounted(async () => {
  await load(true);

  observer = new IntersectionObserver(
    async ([entry]) => {
      if (entry.isIntersecting && !loadingMore.value && hasMore.value) {
        await load(false);
      }
    },
    { threshold: 0.1 }
  );

  if (sentinel.value) observer.observe(sentinel.value);
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
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
.select { min-width: 170px; }

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

.sentinel { height: 1px; }
.mutedLine { margin-top: 12px; color: #666; font-size: 13px; }

@media (max-width: 900px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }
</style>
