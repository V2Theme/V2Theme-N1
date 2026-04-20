<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import PageHeader from "@/components/PageHeader.vue";
import StateBlock from "@/components/StateBlock.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { copyText, formatCurrency, formatDate, formatOrderPeriod } from "@/lib/utils";
import { api } from "@/services/api";
import type { CheckoutResult, Order, PaymentMethod } from "@/types/api";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const processing = ref(false);
const checking = ref(false);
const cancelOpen = ref(false);
const order = ref<Order | null>(null);
const methods = ref<PaymentMethod[]>([]);
const selectedMethod = ref<number | null>(null);
const paymentResult = ref("");
const checkoutMeta = ref<CheckoutResult | null>(null);
const pollTimer = ref<number | null>(null);
const justPaid = ref(false);
const gatewayReturned = ref(false);
const gatewayStatus = ref("");
const gatewayPolling = ref(false);

const tradeNo = computed(() => {
  const pageQuery = new URLSearchParams(window.location.search);
  const candidates = [
    route.params.tradeNo,
    route.query.trade_no,
    route.query.tradeNo,
    route.query.out_trade_no,
    pageQuery.get("out_trade_no"),
    pageQuery.get("trade_no"),
    pageQuery.get("tradeNo"),
  ];

  const value = candidates.find((item) => typeof item === "string" && item.trim());
  return typeof value === "string" ? value.trim() : "";
});

const selected = computed(() => methods.value.find((item) => item.id === selectedMethod.value) ?? null);
const paymentUrl = computed(() => resolvePaymentUrl(paymentResult.value));
const paymentHtml = computed(() => paymentResult.value.includes("<form") || paymentResult.value.includes("<html"));
const htmlPreview = computed(() => (paymentHtml.value ? paymentResult.value : ""));
const zeroAmountOrder = computed(() => (order.value?.total_amount ?? 0) <= 0);
const paymentResultTitle = computed(() => (zeroAmountOrder.value ? "余额支付" : "支付结果"));
const paymentResultDescription = computed(() =>
  zeroAmountOrder.value
    ? "这笔订单已通过账户余额直接完成，无需再跳转到第三方支付页面。"
    : "如果支付平台返回了跳转链接或表单内容，这里会直接展示给您。",
);
const paymentResultText = computed(() => {
  if (zeroAmountOrder.value && paymentResult.value.trim() === "true") {
    return "已使用账户余额完成支付";
  }
  return paymentResult.value;
});
const gatewayReportedSuccess = computed(() => /success|paid|completed|trade_success/i.test(gatewayStatus.value));
const feeAmount = computed(() => {
  if (!order.value || !selected.value) return 0;
  const fixed = selected.value.handling_fee_fixed ?? 0;
  const percent = selected.value.handling_fee_percent ?? 0;
  return fixed + Math.floor((order.value.total_amount * percent) / 100);
});
const payable = computed(() => (order.value?.total_amount ?? 0) + feeAmount.value);
const isFinished = computed(() => (order.value?.status ?? 0) === 3);
const isCanceled = computed(() => (order.value?.status ?? 0) === 2);
const displayPaidState = computed(() => isFinished.value || justPaid.value || gatewayReportedSuccess.value);
const canPay = computed(() => {
  return !!order.value && order.value.status === 0 && !gatewayReportedSuccess.value && selectedMethod.value !== null && methods.value.length > 0;
});

const statusTone = computed(() => {
  if (isCanceled.value) return "destructive";
  if (displayPaidState.value) return "secondary";
  if ((order.value?.status ?? 0) === 1) return "secondary";
  return "outline";
});

function resolvePaymentUrl(payload: string) {
  if (!payload) return "";
  if (payload.startsWith("http://") || payload.startsWith("https://")) return payload;

  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    const candidate =
      parsed.url ??
      parsed.pay_url ??
      parsed.checkout_url ??
      parsed.qr_code ??
      parsed.qrcode ??
      parsed.redirect ??
      parsed.redirect_url ??
      parsed.data;

    return typeof candidate === "string" ? candidate : "";
  } catch {
    return "";
  }
}

function openPaymentTarget(payload: string) {
  const url = resolvePaymentUrl(payload);
  if (url) {
    window.location.assign(url);
    return true;
  }

  if (payload.includes("<form") || payload.includes("<html")) {
    const target = window.open("", "_self");
    if (target) {
      target.document.open();
      target.document.write(payload);
      target.document.close();
      return true;
    }
  }

  return false;
}

function statusLabel(status?: number) {
  if (displayPaidState.value) {
    return isFinished.value ? "已支付" : "支付成功";
  }

  if (status === 0) return "待付款";
  if (status === 1) return "处理中";
  if (status === 2) return "已取消";
  return "已完成";
}

function checkoutTypeLabel(type?: number | string) {
  if (type === 1 || type === "1") return "跳转支付";
  if (type === 2 || type === "2") return "表单支付";
  return "支付结果";
}

function stopPolling() {
  if (pollTimer.value !== null) {
    window.clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
}

async function mergeLatestOrderStatus(targetTradeNo: string) {
  const [detail, checkedStatus] = await Promise.all([
    api.getOrderDetail(targetTradeNo).catch(() => null),
    api.checkOrderStatus(targetTradeNo).catch(() => null),
  ]);

  if (!detail && typeof checkedStatus !== "number") return null;

  if (detail) {
    return {
      ...detail,
      status: typeof checkedStatus === "number" ? checkedStatus : detail.status,
    } satisfies Order;
  }

  if (!order.value) return null;

  return {
    ...order.value,
    status: checkedStatus as number,
  } satisfies Order;
}

function markGatewaySuccess(message?: string) {
  gatewayReturned.value = true;
  gatewayStatus.value = message?.trim() || "TRADE_SUCCESS";
  if (order.value && order.value.status === 0) {
    order.value = {
      ...order.value,
      status: 1,
    };
  }
}

async function syncAfterGatewayReturn() {
  if (!order.value || gatewayPolling.value) return;
  gatewayPolling.value = true;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      const latest = await mergeLatestOrderStatus(order.value.trade_no);
      if (latest) {
        order.value = latest;
      }

      if (order.value.status === 3) {
        justPaid.value = true;
        gatewayReturned.value = false;
        toast.success("支付结果已同步，订单已经更新为已支付。");
        stopPolling();
        break;
      }

      if (order.value.status === 2) {
        gatewayReturned.value = false;
        stopPolling();
        break;
      }
    } catch {
      // ignore and continue retrying
    }

    if (attempt < 11) {
      await new Promise((resolve) => window.setTimeout(resolve, 2500));
    }
  }

  gatewayPolling.value = false;
}

function startPolling() {
  if (pollTimer.value !== null || !order.value || order.value.status !== 0) return;

  pollTimer.value = window.setInterval(async () => {
    if (!order.value || checking.value) return;

    try {
      const latest = await mergeLatestOrderStatus(order.value.trade_no);
      if (latest) {
        order.value = latest;
      }

      if (order.value.status === 3) {
        justPaid.value = true;
        gatewayReturned.value = false;
        toast.success("支付成功，订单状态已更新。");
        stopPolling();
        return;
      }

      if (order.value.status === 2) {
        gatewayReturned.value = false;
        stopPolling();
      }
    } catch {
      stopPolling();
    }
  }, 3000);
}

async function loadPage() {
  loading.value = true;

  const [detail, paymentMethods] = await Promise.all([
    tradeNo.value ? api.getOrderDetail(tradeNo.value).catch(() => null) : Promise.resolve(null),
    api.getPaymentMethods().catch(() => []),
  ]);

  order.value = detail;
  methods.value = paymentMethods;
  selectedMethod.value = paymentMethods[0]?.id ?? null;

  if (order.value) {
    const merged = await mergeLatestOrderStatus(order.value.trade_no).catch(() => null);
    if (merged) {
      order.value = merged;
    }
  }

  loading.value = false;
  stopPolling();

  if (order.value?.status === 0) {
    startPolling();
  } else if (order.value?.status === 3) {
    justPaid.value = true;
  }
}

async function checkout() {
  if (!order.value || selectedMethod.value === null) return;
  processing.value = true;

  try {
    const result = await api.checkoutOrder(order.value.trade_no, selectedMethod.value);
    checkoutMeta.value = result;
    paymentResult.value = result.data ?? JSON.stringify(result);
    toast.success("已提交支付请求，正在为您跳转。");
    startPolling();
    openPaymentTarget(paymentResult.value);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "暂时无法发起支付，请稍后再试。");
  } finally {
    processing.value = false;
  }
}

async function copyPaymentPayload() {
  if (!paymentResult.value) return;
  await copyText(paymentResult.value);
  toast.success("支付信息已复制。");
}

async function refreshStatus() {
  if (!order.value) return;
  checking.value = true;

  try {
    const latest = await mergeLatestOrderStatus(order.value.trade_no);
    if (latest) {
      order.value = latest;
    }

    if (order.value.status === 3) {
      justPaid.value = true;
      gatewayReturned.value = false;
      toast.success("订单已更新为已支付。");
      stopPolling();
    } else if (order.value.status === 2) {
      gatewayReturned.value = false;
      toast.success("订单状态已更新。");
      stopPolling();
    } else if (gatewayReportedSuccess.value) {
      toast.info("支付平台已返回成功，订单仍在同步中，请稍后再试。");
    } else {
      toast.success("订单状态已刷新。");
    }
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "刷新失败，请稍后再试。");
  } finally {
    checking.value = false;
  }
}

async function cancelOrder() {
  if (!order.value) return;

  try {
    await api.cancelOrder(order.value.trade_no);
    toast.success("订单已取消。");
    cancelOpen.value = false;
    stopPolling();
    await loadPage();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "取消失败，请稍后再试。");
  }
}

function handlePageVisible() {
  if (document.visibilityState === "visible" && order.value && order.value.status === 0) {
    void refreshStatus();
  }
}

function handleWindowFocus() {
  if (order.value && order.value.status === 0) {
    void refreshStatus();
  }
}

onMounted(async () => {
  await loadPage();

  const rawReturnContext = window.sessionStorage.getItem("payment-return-context");
  if (rawReturnContext) {
    try {
      const returnContext = JSON.parse(rawReturnContext) as {
        tradeNo?: string;
        tradeStatus?: string;
        returnedAt?: number;
      };

      const returnedTradeNo = String(returnContext.tradeNo ?? "");
      const returnedAt = Number(returnContext.returnedAt ?? 0);
      const isFreshReturn = returnedAt > 0 && Date.now() - returnedAt < 3 * 60 * 1000;

      if (returnedTradeNo && returnedTradeNo === tradeNo.value && isFreshReturn) {
        markGatewaySuccess(String(returnContext.tradeStatus ?? "TRADE_SUCCESS"));
        toast.success("已收到支付平台返回，正在同步最新状态。");
        await syncAfterGatewayReturn();
      }
    } catch {
      // ignore invalid cache payload
    } finally {
      window.sessionStorage.removeItem("payment-return-context");
    }
  }

  document.addEventListener("visibilitychange", handlePageVisible);
  window.addEventListener("focus", handleWindowFocus);
});

onBeforeUnmount(() => {
  stopPolling();
  document.removeEventListener("visibilitychange", handlePageVisible);
  window.removeEventListener("focus", handleWindowFocus);
});
</script>

<template>
  <PageHeader
    title="支付"
    description="确认订单信息、选择支付方式并完成支付，整个过程都会给您明确反馈。"
  />

  <StateBlock v-if="loading" title="正在加载支付信息" description="正在读取订单详情和可用支付方式。" />

  <StateBlock v-else-if="!order" title="没有找到这笔订单" description="这笔订单可能已经失效，您可以返回订单页重新查看。">
    <Button @click="router.push('/orders')">返回订单页</Button>
  </StateBlock>

  <div v-else class="space-y-6">
    <Card
      v-if="gatewayReturned && !isFinished && !isCanceled"
      class="glass-panel interactive-panel premium-shell overflow-hidden rounded-[32px] border-white/10 animated-enter-soft"
    >
      <CardContent class="relative p-0">
        <div class="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(76,201,240,0.18),transparent_72%)]" />
        <div class="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">支付结果确认中</div>
            <div class="mt-2 text-2xl font-semibold">已收到支付成功返回，正在同步订单状态</div>
            <div class="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              支付平台已经返回成功结果，如果后端通知稍有延迟，页面会继续自动刷新。您也可以手动刷新一次。
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
            <Button variant="outline" class="rounded-full px-5" @click="router.push('/orders')">返回订单页</Button>
            <Button class="rounded-full px-5" :disabled="gatewayPolling || checking" @click="refreshStatus">
              {{ gatewayPolling || checking ? "正在同步..." : "立即刷新状态" }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card
      v-if="displayPaidState && !gatewayReturned && !isCanceled"
      class="glass-panel interactive-panel premium-shell overflow-hidden rounded-[32px] border-white/10 animated-enter-soft"
    >
      <CardContent class="relative p-0">
        <div class="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.16),transparent_72%)]" />
        <div class="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">支付已完成</div>
            <div class="mt-2 text-2xl font-semibold">
              {{ isFinished ? "订单状态已同步完成" : "已收到支付成功结果" }}
            </div>
            <div class="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              {{
                isFinished
                  ? "订单已经更新为已支付，您可以继续查看订单详情或前往订阅页确认服务状态。"
                  : "支付平台已经返回成功结果，若订单列表还未变更，请稍后刷新一次。"
              }}
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
            <Button variant="outline" class="rounded-full px-5" @click="router.push('/orders')">返回订单页</Button>
            <Button class="rounded-full px-5" @click="router.push('/subscription')">查看订阅</Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card
      v-if="isCanceled"
      class="glass-panel interactive-panel premium-shell overflow-hidden rounded-[32px] border-white/10 animated-enter-soft"
    >
      <CardContent class="relative p-0">
        <div class="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.16),transparent_72%)]" />
        <div class="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">订单已关闭</div>
            <div class="mt-2 text-2xl font-semibold">这笔订单已取消</div>
            <div class="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              如果您还想继续购买，可以回到套餐页重新创建订单。
            </div>
          </div>
          <Button class="rounded-full px-5" @click="router.push('/plans')">重新购买</Button>
        </div>
      </CardContent>
    </Card>

    <div class="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <Card class="glass-panel interactive-panel premium-shell overflow-hidden rounded-[32px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(120,119,255,0.18),transparent_72%)]" />
          <div class="relative p-6">
            <div class="mb-5">
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">订单信息</div>
              <div class="mt-3 text-2xl font-semibold">查看当前订单</div>
              <div class="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                这里会展示订单状态、金额、套餐信息和支付结果，方便您一步看清。
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
                <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">订单号</div>
                <div class="mt-2 break-all text-sm font-medium">{{ order.trade_no }}</div>
              </div>
              <div class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
                <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">订单状态</div>
                <div class="mt-2">
                  <Badge :variant="statusTone" class="rounded-full px-3 py-1.5">{{ statusLabel(order.status) }}</Badge>
                </div>
              </div>
              <div class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
                <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">下单时间</div>
                <div class="mt-2 text-sm font-medium">{{ formatDate(order.created_at) }}</div>
              </div>
              <div class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
                <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">套餐 / 周期</div>
                <div class="mt-2 text-sm font-medium">
                  {{ order.plan?.name ?? "余额充值或其他订单" }} / {{ formatOrderPeriod(order.period) }}
                </div>
              </div>
            </div>

            <div class="mt-5 rounded-[26px] border border-white/10 bg-[var(--surface-elevated)] p-5">
              <div class="space-y-3 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-[var(--muted-foreground)]">订单金额</span>
                  <span>{{ formatCurrency(order.total_amount) }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-[var(--muted-foreground)]">手续费</span>
                  <span>{{ formatCurrency(feeAmount) }}</span>
                </div>
                <Separator />
                <div class="flex items-center justify-between text-base font-semibold">
                  <span>应付金额</span>
                  <span>{{ formatCurrency(payable) }}</span>
                </div>
              </div>
            </div>

            <div
              v-if="paymentResult"
              class="mt-5 rounded-[26px] border border-dashed border-[color:color-mix(in_srgb,var(--primary)_22%,var(--border))] bg-[var(--surface-elevated)] p-5"
            >
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div class="font-medium">{{ paymentResultTitle }}</div>
                  <div class="mt-1 text-sm text-[var(--muted-foreground)]">
                    {{ paymentResultDescription }}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Badge v-if="zeroAmountOrder" variant="secondary" class="rounded-full px-3 py-1">余额支付</Badge>
                  <Badge v-if="checkoutMeta?.type !== undefined" variant="secondary" class="rounded-full px-3 py-1">
                    {{ checkoutTypeLabel(checkoutMeta?.type) }}
                  </Badge>
                  <Badge v-if="paymentHtml" variant="secondary" class="rounded-full px-3 py-1">网页表单</Badge>
                </div>
              </div>

              <div class="mt-4 break-all rounded-[20px] border border-white/10 bg-[var(--background)]/50 p-4 text-sm leading-6 text-[var(--muted-foreground)]">
                {{ paymentResultText }}
              </div>

              <div class="mt-4 flex flex-wrap gap-3">
                <Button v-if="paymentUrl" class="rounded-full px-4" as-child>
                  <a :href="paymentUrl" target="_blank" rel="noreferrer">前往支付</a>
                </Button>
                <Button variant="outline" class="rounded-full px-4" @click="copyPaymentPayload">复制支付信息</Button>
              </div>

              <div v-if="paymentUrl" class="mt-4 space-y-2">
                <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">支付链接</div>
                <Input :model-value="paymentUrl" readonly class="h-11 rounded-2xl bg-[var(--background)]/50 px-4" />
              </div>

              <div v-if="htmlPreview" class="mt-4 space-y-2">
                <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">页面预览</div>
                <iframe
                  class="h-80 w-full rounded-[20px] border border-white/10 bg-white"
                  :srcdoc="htmlPreview"
                  sandbox="allow-forms allow-scripts allow-same-origin"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel interactive-panel premium-shell overflow-hidden rounded-[32px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(76,201,240,0.16),transparent_72%)]" />
          <div class="relative p-6">
            <div class="mb-5">
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">支付方式</div>
              <div class="mt-3 text-2xl font-semibold">选择支付通道</div>
              <div class="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                选择您想使用的付款方式，系统会自动计算应付金额并同步订单状态。
              </div>
            </div>

            <StateBlock
              v-if="!methods.length && !displayPaidState"
              title="暂时无法支付"
              description="订单已经创建成功，但当前没有可用的支付方式，请稍后再试。"
            />

            <div v-else-if="!displayPaidState" class="space-y-3">
              <div
                v-for="method in methods"
                :key="method.id"
                class="cursor-pointer rounded-[24px] border p-4 transition-all duration-200"
                :class="
                  selectedMethod === method.id
                    ? 'border-[color:color-mix(in_srgb,var(--primary)_34%,var(--border))] bg-[var(--surface)] shadow-[var(--shadow-soft)]'
                    : 'border-white/10 bg-[var(--surface-elevated)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]'
                "
                @click="selectedMethod = method.id"
              >
                <div class="flex items-start justify-between gap-4">
                  <div class="flex min-w-0 items-start gap-3">
                    <img
                      v-if="method.icon"
                      :src="method.icon"
                      :alt="method.name"
                      class="h-10 w-10 rounded-xl border border-white/10 bg-white object-contain p-1"
                    >
                    <div>
                      <div class="font-medium">{{ method.name }}</div>
                      <div class="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">支付通道：{{ method.payment ?? "未标注" }}</div>
                      <div class="text-xs leading-5 text-[var(--muted-foreground)]">
                        手续费：{{ formatCurrency(method.handling_fee_fixed ?? 0) }} + {{ method.handling_fee_percent ?? 0 }}%
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" class="rounded-full px-2.5 py-1">方式 {{ method.id }}</Badge>
                </div>
              </div>
            </div>

            <div v-else class="rounded-[26px] border border-white/10 bg-[var(--surface-elevated)] p-5">
              <div class="text-sm font-medium">支付结果已返回</div>
              <div class="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {{
                  isFinished
                    ? "这笔订单已经同步为已支付，您可以直接返回订单页或前往订阅页查看。"
                    : "支付平台已经返回成功结果，系统仍在等待后端同步订单状态。"
                }}
              </div>
            </div>

            <div class="action-band mt-5 rounded-[26px] p-4">
              <div class="flex items-center justify-between text-sm">
                <span class="text-[var(--muted-foreground)]">当前应付</span>
                <span class="text-lg font-semibold">{{ formatCurrency(payable) }}</span>
              </div>
              <div class="mt-1 text-xs text-[var(--muted-foreground)]">
                {{
                  displayPaidState
                    ? "支付平台已返回结果，页面会继续自动同步。"
                    : "确认无误后点击立即支付，系统会自动跳转到支付页面。"
                }}
              </div>
            </div>

            <div v-if="!displayPaidState && !isCanceled" class="mt-5 hidden gap-3 sm:grid sm:grid-cols-2">
              <Button class="hero-cta h-12 rounded-[18px] shadow-[var(--shadow-soft)]" :disabled="processing || !canPay" @click="checkout">
                {{ processing ? "正在发起支付..." : "立即支付" }}
              </Button>
              <Button variant="outline" class="h-12 rounded-[18px]" :disabled="checking || gatewayPolling" @click="refreshStatus">
                {{ checking || gatewayPolling ? "正在刷新..." : "刷新状态" }}
              </Button>
            </div>

            <div v-else-if="!isCanceled" class="mt-5 flex flex-wrap gap-3">
              <Button variant="outline" class="h-12 rounded-[18px] px-5" :disabled="checking || gatewayPolling" @click="refreshStatus">
                {{ checking || gatewayPolling ? "正在同步..." : "刷新状态" }}
              </Button>
              <Button class="h-12 rounded-[18px] px-5" @click="router.push('/orders')">返回订单页</Button>
            </div>

            <Button
              v-if="order.status === 0 && !gatewayReportedSuccess"
              variant="destructive"
              class="mt-3 h-12 w-full rounded-[18px]"
              @click="cancelOpen = true"
            >
              取消订单
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-if="!displayPaidState && !isCanceled" class="mobile-action-bar p-4 sm:hidden">
      <div class="mb-3 flex items-center justify-between text-sm">
        <span class="text-[var(--muted-foreground)]">当前应付</span>
        <span class="text-lg font-semibold">{{ formatCurrency(payable) }}</span>
      </div>
      <div class="grid gap-3">
        <Button class="hero-cta h-12 rounded-[18px] shadow-[var(--shadow-soft)]" :disabled="processing || !canPay" @click="checkout">
          {{ processing ? "正在发起支付..." : "立即支付" }}
        </Button>
        <div class="grid grid-cols-2 gap-3">
          <Button variant="outline" class="h-11 rounded-2xl" :disabled="checking || gatewayPolling" @click="refreshStatus">
            {{ checking || gatewayPolling ? "正在刷新..." : "刷新状态" }}
          </Button>
          <Button v-if="order.status === 0" variant="destructive" class="h-11 rounded-2xl" @click="cancelOpen = true">
            取消订单
          </Button>
        </div>
      </div>
    </div>
  </div>

  <Dialog :open="cancelOpen" @update:open="cancelOpen = $event">
    <DialogContent class="rounded-[28px]">
      <DialogHeader>
        <DialogTitle>确认取消订单</DialogTitle>
        <DialogDescription>取消后如果还想继续购买，需要重新创建订单。确认继续吗？</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="cancelOpen = false">先保留订单</Button>
        <Button variant="destructive" @click="cancelOrder">确认取消</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
