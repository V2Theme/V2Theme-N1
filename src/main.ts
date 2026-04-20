import { VueQueryPlugin } from "@tanstack/vue-query";
import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "@/App.vue";
import { initTheme } from "@/composables/theme";
import { router } from "@/router";
import "@/styles/index.css";

function normalizeLegacyPaymentHash() {
  const { href, hash, search } = window.location;
  const isPaymentReturn = hash.includes("payment") || /[?&]trade_status=/i.test(href);
  if (!isPaymentReturn) return;

  const hashValue = hash.replace(/^#/, "");
  const hashUrl = new URL(hashValue.startsWith("/") ? hashValue : `/${hashValue}`, window.location.origin);
  const searchUrl = new URL(`${window.location.pathname}${search}`, window.location.origin);

  const tradeNo = (
    hashUrl.searchParams.get("trade_no") ??
    hashUrl.searchParams.get("tradeNo") ??
    searchUrl.searchParams.get("out_trade_no") ??
    searchUrl.searchParams.get("trade_no") ??
    searchUrl.searchParams.get("tradeNo")
  )?.trim() ?? "";

  if (!tradeNo) return;

  const tradeStatus = (
    searchUrl.searchParams.get("trade_status") ??
    searchUrl.searchParams.get("status") ??
    hashUrl.searchParams.get("trade_status") ??
    hashUrl.searchParams.get("status") ??
    ""
  ).trim();

  if (tradeNo) {
    window.sessionStorage.setItem(
      "payment-return-context",
      JSON.stringify({
        tradeNo,
        tradeStatus,
        returnedAt: Date.now(),
      }),
    );
    window.sessionStorage.setItem(
      `payment-success-hint:${tradeNo}`,
      JSON.stringify({
        tradeNo,
        tradeStatus,
        returnedAt: Date.now(),
      }),
    );
  }

  const canonicalHash = `#/payment/${encodeURIComponent(tradeNo)}?trade_no=${encodeURIComponent(tradeNo)}`;
  const targetUrl = `${window.location.origin}${window.location.pathname}${canonicalHash}`;
  if (window.location.href === targetUrl) return;

  window.history.replaceState({}, "", `${window.location.pathname}${canonicalHash}`);
}

normalizeLegacyPaymentHash();
initTheme();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(VueQueryPlugin);
app.mount("#app");
