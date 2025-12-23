<template>
  <div class="app">
    <header class="navbar">
      <nav class="nav">
        <RouterLink to="/" class="link">Home</RouterLink>
        <RouterLink to="/produse" class="link">Produse</RouterLink>
        <RouterLink to="/comenzi" class="link">Comenzi</RouterLink>

        <RouterLink v-if="isAdmin" to="/admin/produse" class="link admin">
          Admin
        </RouterLink>

        <div class="spacer"></div>

        <RouterLink to="/cos" class="link cart">
          Coș
          <span v-if="cartCount > 0" class="badge">{{ cartCount }}</span>
        </RouterLink>

        <RouterLink v-if="!user" to="/login" class="link login">Login</RouterLink>

        <div v-else class="userBox">
          <span class="userEmail" :title="user.email">{{ user.email }}</span>
          <button class="btnLogout" @click="handleLogout">Logout</button>
        </div>
      </nav>
    </header>

    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "./stores/authStore";
import { useCartStore } from "./stores/cartStore";

const router = useRouter();
const auth = useAuthStore();
const cart = useCartStore();

const user = computed(() => auth.user ?? null);
const isAdmin = computed(() => !!auth.isAdmin);
const cartCount = computed(() => cart.totalItems ?? cart.items?.length ?? 0);

const handleLogout = async () => {
  await auth.logout?.();
  router.push("/login");
};
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: #fafafa;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

.navbar {
  background: #fff;
  border-bottom: 1px solid #eaeaea;
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav {
  max-width: 1100px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.spacer {
  flex: 1;
}

.link {
  text-decoration: none;
  color: #333;
  font-size: 14px;
  padding: 8px 10px;
  border-radius: 10px;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.link:hover {
  background: #f2f2f2;
}

.router-link-active {
  background: #111;
  color: #fff;
}

.cart {
  border: 1px solid #ddd;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.badge {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: #111;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.login {
  border: 1px solid #111;
  font-weight: 600;
}

.admin {
  border: 1px solid #cfcfcf;
}

.userBox {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 6px;
}

.userEmail {
  font-size: 13px;
  color: #444;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btnLogout {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: #fff;
  cursor: pointer;
}

.btnLogout:hover {
  background: #f2f2f2;
}

.content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px 16px;
}
</style>
