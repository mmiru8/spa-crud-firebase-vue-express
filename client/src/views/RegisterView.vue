<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="title">Creează cont</h1>
      <p class="subtitle">Înregistrare cu email și parolă</p>

      <form @submit.prevent="handleRegister" class="form">
        <div class="field">
          <label>Email</label>
          <input v-model.trim="email" type="email" placeholder="email@exemplu.com" required />
        </div>

        <div class="field">
          <label>Parolă</label>
          <input v-model="password" type="password" placeholder="Minim 6 caractere" required />
        </div>

        <div class="field">
          <label>Confirmă parola</label>
          <input v-model="confirm" type="password" placeholder="Repetă parola" required />
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button class="btn" :disabled="loading">
          {{ loading ? "Se creează..." : "Creează cont" }}
        </button>

        <p class="hint">
          Ai deja cont?
          <RouterLink to="/login" class="link">Login</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const router = useRouter();
const auth = useAuthStore();

const email = ref("");
const password = ref("");
const confirm = ref("");
const loading = ref(false);
const error = ref("");

const handleRegister = async () => {
  error.value = "";

  if (password.value.length < 6) {
    error.value = "Parola trebuie să aibă minim 6 caractere.";
    return;
  }

  if (password.value !== confirm.value) {
    error.value = "Parolele nu coincid.";
    return;
  }

  loading.value = true;
  try {
    await auth.register(email.value, password.value);
    router.push(auth.isAdmin ? "/admin/produse" : "/produse");
  } catch (e) {
    // mesaje simple, fără să depindem de coduri
    error.value = "Nu s-a putut crea contul. Verifică email-ul sau încearcă altul.";
    console.error(e);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f6f7f9;
}

.login-card {
  width: 420px;
  background: #fff;
  padding: 28px;
  border-radius: 18px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.subtitle {
  margin: 6px 0 24px;
  font-size: 14px;
  color: #666;
  text-align: center;
}

.form {
  display: grid;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 13px;
  color: #444;
}

input {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #ddd;
  font-size: 14px;
  outline: none;
  transition: border 0.2s, box-shadow 0.2s;
}

input:focus {
  border-color: #111;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.08);
}

.btn {
  margin-top: 6px;
  padding: 12px;
  border-radius: 12px;
  border: none;
  background: #111;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.btn:hover {
  background: #000;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.error {
  font-size: 13px;
  color: #c0392b;
  background: #fdecea;
  padding: 10px 12px;
  border-radius: 10px;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: #666;
  text-align: center;
}

.link {
  color: #111;
  font-weight: 600;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>
