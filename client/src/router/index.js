import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomeView.vue";
import ProductsView from "../views/ProductsView.vue";
import OrdersView from "../views/OrdersView.vue";
import LoginView from "../views/LoginView.vue";

const routes = [
  { path: "/", name: "home", component: HomeView },
  { path: "/produse", name: "products", component: ProductsView },
  { path: "/comenzi", name: "orders", component: OrdersView },
  { path: "/login", name: "login", component: LoginView },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
