<template>
  <div class="page">
    <header class="header">
      <div>
        <h1>Produse (Admin)</h1>
        <p class="sub">Adăugare / ștergere produse</p>
      </div>

      <button class="btn" @click="load" :disabled="loading">
        {{ loading ? "Se încarcă..." : "Reîmprospătează" }}
      </button>
    </header>

    <section class="card">
      <h2>Adaugă produs</h2>

      <form @submit.prevent="submit">
        <label class="label">Nume</label>
        <input v-model.trim="form.name" class="input" placeholder="Ex: Gel UV Builder" />

        <label class="label">Preț (RON)</label>
        <input v-model.number="form.price" class="input" type="number" step="0.01" min="0" />

        <label class="label">Descriere (opțional)</label>
        <textarea v-model.trim="form.description" class="input" rows="3"
          placeholder="Ex: Gel autonivelant, potrivit pentru construcție..."></textarea>

        <div class="row">
          <button class="btn" type="submit" :disabled="saving">
            {{ saving ? "Se salvează..." : "Adaugă" }}
          </button>
          <button class="btnOutline" type="button" @click="reset" :disabled="saving">
            Resetează
          </button>
        </div>
      </form>
    </section>

    <p v-if="error" class="error">{{ error }}</p>

    <section class="list">
      <h2>Lista produse</h2>

      <p v-if="!loading && products.length === 0" class="empty">Nu există produse.</p>

      <ul v-else class="ul">
        <li v-for="p in products" :key="p.id" class="li">
          <div>
            <strong>{{ p.name }}</strong> — {{ formatPrice(p.price) }}
            <div class="muted">{{ p.description || "Fără descriere" }}</div>
          </div>

          <button class="danger" @click="remove(p.id)" :disabled="deletingId === p.id">
            {{ deletingId === p.id ? "Se șterge..." : "Șterge" }}
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { getProducts, addProduct, deleteProduct } from "../services/productsService";

const products = ref([]);
const loading = ref(false);
const saving = ref(false);
const deletingId = ref(null);
const error = ref("");

const form = ref({
  name: "",
  price: 0,
  description: "",
});

const formatPrice = (v) => `${Number(v || 0).toFixed(2)} RON`;

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    products.value = await getProducts();
  } catch (e) {
    error.value = "Nu am putut încărca produsele.";
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  form.value = { name: "", price: 0, description: "" };
};

const submit = async () => {
  if (!form.value.name) {
    alert("Completează numele produsului.");
    return;
  }

  saving.value = true;
  try {
    await addProduct({
      name: form.value.name,
      price: Number(form.value.price || 0),
      description: form.value.description || "",
      createdAt: new Date().toISOString(),
    });
    reset();
    await load();
  } catch (e) {
    console.error(e);
    alert("Nu am putut adăuga produsul.");
  } finally {
    saving.value = false;
  }
};

const remove = async (id) => {
  const ok = confirm("Sigur vrei să ștergi produsul?");
  if (!ok) return;

  deletingId.value = id;
  try {
    await deleteProduct(id);
    await load();
  } finally {
    deletingId.value = null;
  }
};

onMounted(load);
</script>

<style scoped>
.page { max-width: 980px; margin: 24px auto; padding: 0 16px; font-family: system-ui; }
.header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.sub { margin: 6px 0 0; color: #555; font-size: 13px; }

.card { margin-top: 14px; border: 1px solid #eee; border-radius: 14px; padding: 14px; background: #fff; }
.label { display:block; margin-top: 10px; font-size: 12px; color:#444; }
.input { width: 100%; margin-top: 6px; padding: 10px 12px; border: 1px solid #ddd; border-radius: 10px; }
.row { margin-top: 12px; display:flex; gap:10px; flex-wrap:wrap; }

.btn { padding: 10px 12px; border: 1px solid #111; background: #111; color: #fff; border-radius: 10px; cursor:pointer; }
.btn:disabled { opacity:.6; cursor:not-allowed; }
.btnOutline { padding: 10px 12px; border: 1px solid #ddd; background: transparent; border-radius: 10px; }

.error { margin-top: 12px; background: #ffecec; color: #a40000; border: 1px solid #ffb3b3; padding: 10px 12px; border-radius: 10px; }

.list { margin-top: 16px; }
.ul { list-style: none; padding: 0; margin: 0; }
.li { display:flex; justify-content: space-between; gap: 12px; align-items: center;
  padding: 12px; border: 1px solid #eee; border-radius: 12px; background:#fff; margin-top:10px; }
.muted { color:#666; font-size: 12px; margin-top: 4px; }
.danger { padding: 8px 10px; border-radius: 10px; border:1px solid #ffb3b3; background:#fff; cursor:pointer; }
.empty { color:#666; }
</style>
