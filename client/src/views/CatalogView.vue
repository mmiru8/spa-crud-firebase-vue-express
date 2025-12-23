<template>
  <div class="page">
    <header class="header">
      <div>
        <h1>Catalog produse</h1>
        <p class="sub">Produse pentru unghii – listare (client)</p>
      </div>

      <button class="btn" @click="load" :disabled="loading">
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
      </select>
    </section>

    <p v-if="error" class="error">
      {{ error }}
    </p>

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
<button class="btnOutline" @click="add(p)">
  Adaugă în coș
</button>

        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { getProducts } from "../services/productsService";

const products = ref([]);
const loading = ref(false);
const error = ref("");

const query = ref("");
const sortKey = ref("name-asc");

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const formatPrice = (v) => {
  const n = toNumber(v);
  return `${n.toFixed(2)} RON`;
};

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    products.value = await getProducts();
  } catch (e) {
    error.value =
      "Nu am putut încărca produsele. Verifică Firestore Rules / conexiunea Firebase.";
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const filteredSorted = computed(() => {
  const q = query.value.toLowerCase();

  let arr = products.value.filter((p) =>
    (p.name || "").toLowerCase().includes(q)
  );

  const [key, dir] = sortKey.value.split("-");
  arr.sort((a, b) => {
    if (key === "name") {
      const A = (a.name || "").toLowerCase();
      const B = (b.name || "").toLowerCase();
      return dir === "asc" ? A.localeCompare(B) : B.localeCompare(A);
    }

    if (key === "price") {
      const A = toNumber(a.price);
      const B = toNumber(b.price);
      return dir === "asc" ? A - B : B - A;
    }

    return 0;
  });

  return arr;
});

onMounted(load);
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

.btnOutline {
  padding: 10px 12px;
  border: 1px solid #ddd;
  background: transparent;
  border-radius: 10px;
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

@media (max-width: 900px) {
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
