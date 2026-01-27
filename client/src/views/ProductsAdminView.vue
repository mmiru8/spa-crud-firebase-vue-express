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
<h2>{{ editingId ? "Editează produs" : "Adaugă produs" }}</h2>

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
  {{ saving ? "Se salvează..." : (editingId ? "Salvează" : "Adaugă") }}
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

<button type="button" class="btnOutline" @click="calculeazaMedia">
  Calculează
</button>

<p v-if="mediaPreturilor !== null" class="avgBox">
  Media aritmetică: <strong>{{ mediaPreturilor.toFixed(2) }} RON</strong>
</p>


      <p v-if="!loading && products.length === 0" class="empty">Nu există produse.</p>

      <ul v-else class="ul">
        <li v-for="p in products" :key="p.id" class="li">
          <div>
            <strong>{{ p.name }}</strong> — {{ formatPrice(p.price) }}
            <div class="muted">{{ p.description || "Fără descriere" }}</div>
          </div>

          <div class="rowBtns">
<button
  type="button"
  class="btnOutline"
  @click="startEdit(p)"
  :disabled="saving || deletingId === p.id"
>
  Editează
</button>
<button
  type="button"
  class="danger"
  @click="remove(p.id)"
  :disabled="deletingId === p.id"
>
  {{ deletingId === p.id ? "Se șterge..." : "Șterge" }}
</button>



</div>

        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import {
  getProductsAdminAll,
  addProduct,
  deleteProduct,
  updateProduct,
} from "../services/productsService";

const products = ref([]);
const loading = ref(false);
const saving = ref(false);
const deletingId = ref(null);
const error = ref("");

const editingId = ref(null);
const form = ref({
  name: "",
  price: 0,
  description: "",
});

const formatPrice = (v) => `${Number(v || 0).toFixed(2)} RON`;

const mediaPreturilor = ref(null);
const calculeazaMedia = () => {
  if (products.value.length === 0) {
    mediaPreturilor.value = null;
    return;
  }
  const suma = products.value.reduce((acc, p) => acc + Number(p.price || 0), 0);
  mediaPreturilor.value = suma / products.value.length;
};

const load = async () => {
  loading.value = true;
  error.value = "";
  try {
    products.value = await getProductsAdminAll();
    calculeazaMedia();
  } catch (e) {
    error.value = "Nu am putut încărca produsele.";
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  editingId.value = null;
  form.value = { name: "", price: 0, description: "" };
};

const startEdit = (p) => {
  editingId.value = p.id;
  form.value = {
    name: p.name || "",
    price: Number(p.price || 0),
    description: p.description || "",
  };
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const submit = async () => {
  if (!form.value.name) {
    alert("Completează numele produsului.");
    return;
  }

  saving.value = true;
  try {
    const payload = {
      name: form.value.name,
      price: Number(form.value.price || 0),
      description: form.value.description || "",
    };

    if (editingId.value) await updateProduct(editingId.value, payload);
    else await addProduct(payload);

    reset();
    await load();
  } catch (e) {
    console.error(e);
    alert(editingId.value ? "Nu am putut actualiza produsul." : "Nu am putut adăuga produsul.");
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
.avgBox{
  margin: 10px 0;
  padding: 10px 12px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fafafa;
}

/* ========== Layout general ========== */
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

.sub {
  margin: 6px 0 0;
  color: #555;
  font-size: 13px;
}

/* ========== Card formular ========== */
.card {
  margin-top: 14px;
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}

.label {
  display: block;
  margin-top: 10px;
  font-size: 12px;
  color: #444;
}

.input {
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
}

.input:focus {
  outline: none;
  border-color: #111;
  box-shadow: 0 0 0 2px rgba(0,0,0,0.08);
}

.row {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* ========== Butoane ========== */
.btn,
.btnOutline,
.danger {
  cursor: pointer;
  border-radius: 10px;
  transition:
    transform 0.08s ease,
    box-shadow 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}

/* Primary */
.btn {
  padding: 10px 12px;
  border: 1px solid #111;
  background: #111;
  color: #fff;
}

.btn:hover {
  background: #000;
  box-shadow: 0 6px 16px rgba(0,0,0,0.15);
}

.btn:active {
  transform: translateY(1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

/* Outline */
.btnOutline {
  padding: 10px 12px;
  border: 1px solid #ddd;
  background: transparent;
}

.btnOutline:hover {
  background: #f6f6f6;
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
}

.btnOutline:active {
  transform: translateY(1px);
}

/* Danger */
.danger {
  padding: 8px 10px;
  border: 1px solid #ffb3b3;
  background: #fff;
  color: #a40000;
}

.danger:hover {
  background: #fff1f1;
  box-shadow: 0 6px 16px rgba(255,0,0,0.08);
}

.danger:active {
  transform: translateY(1px);
}

/* Focus accesibilitate */
.btn:focus-visible,
.btnOutline:focus-visible,
.danger:focus-visible {
  outline: 2px solid rgba(0,0,0,0.35);
  outline-offset: 2px;
}

/* ========== Erori ========== */
.error {
  margin-top: 12px;
  background: #ffecec;
  color: #a40000;
  border: 1px solid #ffb3b3;
  padding: 10px 12px;
  border-radius: 10px;
}

/* ========== Listă produse ========== */
.list {
  margin-top: 16px;
}

.ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 12px;
  background: #fff;
  margin-top: 10px;
}

.muted {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

.rowBtns {
  display: flex;
  gap: 10px;
  align-items: center;
}

.empty {
  color: #666;
}
</style>

