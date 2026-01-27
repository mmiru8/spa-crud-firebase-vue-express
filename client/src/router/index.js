
import { createRouter, createWebHistory } from "vue-router";
import NotFoundView from "../views/NotFoundView.vue";
import HomeView from "../views/HomeView.vue";
import ProductsCatalogView from "../views/ProductsCatalogView.vue";
import ProductsAdminView from "../views/ProductsAdminView.vue";
import OrdersView from "../views/OrdersView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import CartView from "../views/CartView.vue";
import NewsView from "../views/NewsView.vue";
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
    path: "/noutati",
    name: "noutati",
    component: NewsView,
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
    meta: { requiresAuth: true, requiresAdmin: true },
  },

  { path: "/:pathMatch(.*)*", component: NotFoundView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (!auth.ready) {
    await auth.init();
  }


  if (to.meta.requiresAdmin) {
    if (auth.isLoggedIn && auth.isAdmin) return true;
    return { path: "/login" };
  }


  if (to.meta.requiresAuth) {
    if (auth.isLoggedIn) return true;
    return { path: "/login" };
  }

  if (auth.isLoggedIn && (to.path === "/login" || to.path === "/register")) {
    return auth.isAdmin ? "/admin/produse" : "/produse";
  }

  return true;
});

export default router;
