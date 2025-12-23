import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import ProductsCatalogView from "../views/ProductsCatalogView.vue";
import ProductsAdminView from "../views/ProductsAdminView.vue";
import OrdersView from "../views/OrdersView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import CartView from "../views/CartView.vue";

import { useAuthStore } from "../stores/authStore";

const routes = [
  { path: "/", component: HomeView },

  // public
  { path: "/login", component: LoginView },
  { path: "/register", component: RegisterView },

  // user (autentificat)
  {
    path: "/produse",
    component: ProductsCatalogView,
    meta: { requiresAuth: true },
  },
  {
    path: "/cos",
    component: CartView,
    meta: { requiresAuth: true },
  },
  {
    path: "/comenzi",
    component: OrdersView,
    meta: { requiresAuth: true },
  },

  // admin
  {
    path: "/admin/produse",
    component: ProductsAdminView,
    meta: { requiresAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // așteaptă Firebase la refresh
  if (!auth.ready) {
    await auth.init();
  }

  // admin
  if (to.meta.requiresAdmin) {
    if (auth.isLoggedIn && auth.isAdmin) return true;
    return { path: "/login" };
  }

  // user autentificat
  if (to.meta.requiresAuth) {
    if (auth.isLoggedIn) return true;
    return { path: "/login" };
  }

  // dacă e logat și merge pe login/register → redirect
  if (
    auth.isLoggedIn &&
    (to.path === "/login" || to.path === "/register")
  ) {
    return auth.isAdmin ? "/admin/produse" : "/produse";
  }

  return true;
});

export default router;
