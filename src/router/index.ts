import { createRouter, createWebHashHistory, type RouteLocationGeneric } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const routes = [
  { path: "/", component: () => import("@/views/LandingPage.vue") },
  { path: "/login", component: () => import("@/views/auth/LoginPage.vue") },
  { path: "/register", component: () => import("@/views/auth/RegisterPage.vue") },
  { path: "/forgot-password", component: () => import("@/views/auth/ForgotPasswordPage.vue") },
  {
    path: "/payment",
    redirect: (to: { query: Record<string, unknown> }) => {
      const tradeNo = String(to.query.trade_no ?? to.query.tradeNo ?? "");
      return tradeNo ? `/payment/${tradeNo}` : "/orders";
    },
  },
  {
    path: "/payment/:tradeNo",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [{ path: "", component: () => import("@/views/app/PaymentPage.vue") }],
  },
  {
    path: "/app",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [
      { path: "", redirect: "/dashboard" },
      { path: "dashboard", redirect: "/dashboard" },
      { path: "subscription", redirect: "/subscription" },
      { path: "plans", redirect: "/plans" },
      { path: "plans/:id", redirect: (to: RouteLocationGeneric) => `/plans/${String(to.params.id)}` },
      { path: "orders", redirect: "/orders" },
      { path: "payment/:tradeNo", redirect: (to: RouteLocationGeneric) => `/payment/${String(to.params.tradeNo)}` },
      { path: "tickets", redirect: "/tickets" },
      { path: "invite", redirect: "/invite" },
      { path: "wallet", redirect: "/wallet" },
      { path: "nodes", redirect: "/nodes" },
      { path: "notices", redirect: "/notices" },
      { path: "docs", redirect: "/docs" },
      { path: "settings", redirect: "/settings" },
    ],
  },
  {
    path: "/dashboard",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [{ path: "", component: () => import("@/views/app/DashboardPage.vue") }],
  },
  {
    path: "/subscription",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [{ path: "", component: () => import("@/views/app/SubscriptionPage.vue") }],
  },
  {
    path: "/plans",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [{ path: "", component: () => import("@/views/app/PlansPage.vue") }],
  },
  {
    path: "/plans/:id",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [{ path: "", component: () => import("@/views/app/PurchasePage.vue") }],
  },
  {
    path: "/orders",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [{ path: "", component: () => import("@/views/app/OrdersPage.vue") }],
  },
  {
    path: "/tickets",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [{ path: "", component: () => import("@/views/app/TicketsPage.vue") }],
  },
  {
    path: "/invite",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [{ path: "", component: () => import("@/views/app/InvitePage.vue") }],
  },
  {
    path: "/wallet",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [{ path: "", component: () => import("@/views/app/WalletPage.vue") }],
  },
  {
    path: "/nodes",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [{ path: "", component: () => import("@/views/app/NodesPage.vue") }],
  },
  {
    path: "/notices",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [{ path: "", component: () => import("@/views/app/NoticesPage.vue") }],
  },
  {
    path: "/docs",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [{ path: "", component: () => import("@/views/app/DocsPage.vue") }],
  },
  {
    path: "/settings",
    component: () => import("@/views/app/AppLayout.vue"),
    meta: { requiresAuth: true },
    children: [{ path: "", component: () => import("@/views/app/SettingsPage.vue") }],
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.hydrate();

  if (to.meta.requiresAuth && !auth.authData) return "/login";
  if (auth.authData && ["/login", "/register", "/forgot-password"].includes(to.path)) return "/dashboard";
  return true;
});
