<template>
  <div class="page">
    <!-- HERO -->
    <section class="hero">
      <div class="heroContent">
        <p class="kicker">Nail Shop</p>
        <h1 class="h1">Geluri UV, top coat & accesorii pentru unghii</h1>
        <p class="sub">
          Produse selectate pentru rezistență, luciu și aplicare ușoară. Livrare rapidă și stoc actualizat.
        </p>

        <div class="heroActions">
          <RouterLink class="btn primary" to="/produse">Vezi produsele</RouterLink>
          <RouterLink class="btn" to="/cos">Mergi la coș</RouterLink>
        </div>

        <div class="trust">
          <div class="trustItem">
            <div class="trustTitle">Plată sigură</div>
            <div class="trustDesc">Card / ramburs</div>
          </div>
          <div class="trustItem">
            <div class="trustTitle">Retur simplu</div>
            <div class="trustDesc">14 zile</div>
          </div>
          <div class="trustItem">
            <div class="trustTitle">Suport</div>
            <div class="trustDesc">Luni–Vineri</div>
          </div>
        </div>
      </div>

      <div class="heroCard">
        <div class="heroCardTop">
          <div>
            <div class="label">Status stoc</div>
            <div class="value" :class="{ ok: apiOk, bad: !apiOk }">
              {{ apiOk ? "Actualizat" : "Indisponibil" }}
            </div>
          </div>
          <button class="btn mini" @click="refresh" :disabled="loading">
            {{ loading ? "..." : "Refresh" }}
          </button>
        </div>

        <div class="heroCardRow">
          <div class="metric">
            <div class="label">Produse</div>
            <div class="value">{{ products.length }}</div>
          </div>
          <div class="metric">
            <div class="label">Ultima actualizare</div>
            <div class="value small">{{ lastUpdatedLabel }}</div>
          </div>
        </div>

        <div class="divider"></div>

        <div class="miniList">
          <div class="miniTitle">Best sellers (preview)</div>
          <div v-if="loading" class="muted">Se încarcă...</div>
          <div v-else-if="error" class="errorBox">{{ error }}</div>
          <div v-else>
<div class="miniItem" v-for="p in bestSellers" :key="p.productId || p.id">
              <div class="miniName">{{ p.name }}</div>
              <div class="miniPrice">{{ formatPrice(p.price) }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CATEGORIES -->
    <section class="section">
      <div class="sectionHead">
        <h2>Categorii populare</h2>
        <p class="muted">Găsești rapid ce ai nevoie pentru manichiură.</p>
      </div>

      <div class="cats">
        <RouterLink class="cat" to="/produse">
          <div class="catTitle">Geluri UV</div>
          <div class="catDesc">Construcție & rezistență</div>
        </RouterLink>

        <RouterLink class="cat" to="/produse">
          <div class="catTitle">Top coat</div>
          <div class="catDesc">Luciu & protecție</div>
        </RouterLink>

        <RouterLink class="cat" to="/produse">
          <div class="catTitle">Ulei cuticule</div>
          <div class="catDesc">Hidratare & îngrijire</div>
        </RouterLink>

        <RouterLink class="cat" to="/produse">
          <div class="catTitle">Accesorii</div>
          <div class="catDesc">Pile, buffere, pensule</div>
        </RouterLink>
      </div>
    </section>

    <!-- PRODUCTS GRID -->
    <section class="section">
      <div class="sectionHead row">
        <div>
          <h2>Produse recomandate</h2>
          <!--<p class="muted">Live din Firestore prin API (Express).</p>-->
        </div>

        <div class="controls">
          <input class="input" v-model="query" placeholder="Caută după nume..." />
          <select class="input" v-model="sortBy">
            <option value="name">Sortare: Nume</option>
            <option value="price">Sortare: Preț</option>
          </select>
        </div>
      </div>

      <div v-if="error" class="alert">
        <strong>Nu pot încărca produsele.</strong>
        <div class="muted">Asigură-te că serverul rulează pe 4000 și CORS e ok.</div>
      </div>

      <div v-else class="grid">
<article class="card" v-for="p in filtered" :key="p.productId || p.id">
          <div class="cardTop">
            <div class="name">{{ p.name }}</div>
            <div class="price">{{ formatPrice(p.price) }}</div>
          </div>

          <div class="tags">
            <span class="tag">{{ p.category?.name ?? "Fără categorie" }}</span>
            <span class="tag soft">stoc: {{ p.inventory?.total ?? "-" }}</span>
          </div>

          <p class="desc">{{ p.description || "—" }}</p>

          <div class="cardActions">
            <button class="btn mini" @click="goProducts">Detalii</button>
            <RouterLink class="btn mini primary" to="/cos">Adaugă în coș</RouterLink>
          </div>
        </article>
      </div>
    </section>

    <footer class="footer">
      <span class="muted">© {{ new Date().getFullYear() }} Nail Shop</span>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// (simplu) direct către backend
const apiBase = import.meta.env.VITE_API_BASE;

const products = ref([]);
const loading = ref(false);
const error = ref("");
const apiOk = ref(false);
const lastUpdated = ref(null);

const query = ref("");
const sortBy = ref("name");

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) return "—";
  return new Date(lastUpdated.value).toLocaleString();
});

function formatPrice(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("ro-RO", { style: "currency", currency: "RON" });
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  let list = [...products.value];

  if (q) list = list.filter((p) => String(p.name ?? "").toLowerCase().includes(q));

  list.sort((a, b) => {
    if (sortBy.value === "price") return Number(a.price ?? 0) - Number(b.price ?? 0);
    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });

  return list;
});

const bestSellers = computed(() => filtered.value.slice(0, 4));

async function checkHealth() {
  try {
    const res = await fetch(`${apiBase}/health`);
    apiOk.value = res.ok;
  } catch {
    apiOk.value = false;
  }
}

async function loadProducts() {
  loading.value = true;
  error.value = "";
  try {
    const res = await fetch(`${apiBase}/api/products`);
    console.log("Products status:", res.status);

    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    products.value = data.items || [];
    lastUpdated.value = Date.now();
  } catch (e) {
    error.value = "Eroare la încărcarea produselor din API.";
  } finally {
    loading.value = false;
  }
}

function refresh() {
  checkHealth();
  loadProducts();
}

function goProducts() {
  router.push("/produse");
}

onMounted(async () => {
  await checkHealth();
  await loadProducts();
});
</script>

<style scoped>
.page { max-width: 1100px; margin: 0 auto; padding: 24px; color: #0f172a; }
.muted { color: rgba(15, 23, 42, 0.7); }

.hero {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.10), rgba(99, 102, 241, 0.10));
  border: 1px solid rgba(15, 23, 42, 0.10);
}

.kicker { font-weight: 700; letter-spacing: .08em; text-transform: uppercase; font-size: 12px; opacity: .75; }
.h1 { margin: 8px 0 8px; font-size: 34px; line-height: 1.1; }
.sub { margin: 0 0 14px; max-width: 60ch; }

.heroActions { display: flex; gap: 10px; flex-wrap: wrap; margin: 10px 0 14px; }
.btn {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 10px 14px; border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #fff; color: #0f172a; text-decoration: none; cursor: pointer;
}
.btn.primary { background: rgba(99, 102, 241, 0.18); border-color: rgba(99, 102, 241, 0.30); }
.btn.mini { padding: 8px 10px; font-size: 12px; border-radius: 10px; }

.trust { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 10px; }
.trustItem { background: #fff; border: 1px solid rgba(15, 23, 42, 0.10); border-radius: 14px; padding: 12px; }
.trustTitle { font-weight: 800; font-size: 13px; }
.trustDesc { font-size: 12px; opacity: .75; margin-top: 4px; }

.heroCard { background: #fff; border: 1px solid rgba(15, 23, 42, 0.10); border-radius: 16px; padding: 14px; }
.heroCardTop { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.label { font-size: 12px; opacity: .7; }
.value { font-size: 18px; font-weight: 900; margin-top: 4px; }
.value.small { font-size: 12px; font-weight: 700; opacity: .8; }
.value.ok { color: #059669; }
.value.bad { color: #e11d48; }

.heroCardRow { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 10px; }
.metric { background: rgba(15, 23, 42, 0.03); border: 1px solid rgba(15, 23, 42, 0.06); border-radius: 14px; padding: 10px; }
.divider { height: 1px; background: rgba(15, 23, 42, 0.08); margin: 12px 0; }

.miniList { margin-top: 6px; }
.miniTitle { font-weight: 800; margin-bottom: 8px; }
.miniItem { display: flex; justify-content: space-between; gap: 10px; padding: 8px 0; border-top: 1px solid rgba(15, 23, 42, 0.06); }
.miniName { font-weight: 700; }
.miniPrice { font-weight: 900; }

.section { margin-top: 18px; }
.sectionHead { display: grid; gap: 6px; margin-bottom: 12px; }
.sectionHead.row { display: flex; align-items: end; justify-content: space-between; gap: 12px; flex-wrap: wrap; }

.cats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.cat { text-decoration: none; color: inherit; background: #fff; border: 1px solid rgba(15, 23, 42, 0.10); border-radius: 16px; padding: 14px; }
.catTitle { font-weight: 900; }
.catDesc { font-size: 12px; opacity: .75; margin-top: 6px; }

.controls { display: flex; gap: 10px; flex-wrap: wrap; }
.input {
  padding: 10px 12px; border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #fff; color: #0f172a; outline: none;
}

.alert { padding: 12px; border-radius: 14px; border: 1px solid rgba(225, 29, 72, 0.35); background: rgba(225, 29, 72, 0.08); }

.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.card {
  background: #fff; border: 1px solid rgba(15, 23, 42, 0.10);
  border-radius: 16px; padding: 14px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}
.cardTop { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
.name { font-weight: 900; }
.price { font-weight: 900; opacity: .9; }

.tags { display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0; }
.tag { font-size: 12px; padding: 6px 10px; border-radius: 999px; background: rgba(99, 102, 241, 0.10); border: 1px solid rgba(99, 102, 241, 0.18); }
.tag.soft { background: rgba(15, 23, 42, 0.04); border-color: rgba(15, 23, 42, 0.08); }

.desc { font-size: 13px; line-height: 1.45; color: rgba(15, 23, 42, 0.75); min-height: 38px; }
.cardActions { display: flex; gap: 10px; margin-top: 10px; }

.footer { margin-top: 22px; display: flex; justify-content: center; padding: 10px; }

@media (max-width: 980px) {
  .hero { grid-template-columns: 1fr; }
  .cats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 560px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
