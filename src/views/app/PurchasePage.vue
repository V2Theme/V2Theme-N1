<script setup lang="ts">
import { LoaderCircle, RotateCcw, TicketPercent } from "lucide-vue-next";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader.vue";
import StateBlock from "@/components/StateBlock.vue";
import { formatCurrency, parsePlanFeatures } from "@/lib/utils";
import { api } from "@/services/api";
import type { Plan } from "@/types/api";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const submitting = ref(false);
const plan = ref<Plan | null>(null);
const couponState = ref<{ type: number; value: number; name?: string } | null>(null);
const couponError = ref("");
const orderError = ref("");
const form = reactive({ period: "month_price", coupon: "" });

const periodLabels: Record<string, string> = {
  month_price: "月付",
  quarter_price: "季付",
  half_year_price: "半年付",
  year_price: "年付",
  two_year_price: "两年付",
  three_year_price: "三年付",
  onetime_price: "一次性",
  reset_price: "重置流量",
};

const periods = computed(() =>
  Object.entries(periodLabels).filter(([key]) => {
    const value = plan.value?.[key as keyof Plan];
    return value !== null && value !== undefined;
  }),
);

const selectedPeriodLabel = computed(() => periodLabels[form.period] ?? "当前周期");
const isResetTraffic = computed(() => form.period === "reset_price");
const price = computed(() => Number(plan.value?.[form.period as keyof Plan] ?? 0));
const finalPrice = computed(() => {
  if (!couponState.value) return price.value;
  if (couponState.value.type === 1) return Math.max(0, price.value - couponState.value.value);
  return Math.max(0, price.value - Math.floor(price.value * (couponState.value.value / 100)));
});
const planFeatures = computed(() => parsePlanFeatures(plan.value?.content));

function normalizeCouponError(message: string) {
  if (/不存在|not\s*found|invalid/i.test(message)) return "优惠码不存在，请确认后再试。";
  if (/过期|expired/i.test(message)) return "优惠码已过期，请更换后再试。";
  if (/使用次数|已使用|used/i.test(message)) return "该优惠码当前不可用，请更换其他优惠码。";
  if (/不适用|not\s*available|cannot/i.test(message)) return "该优惠码不适用于当前套餐或周期。";
  return message || "优惠码暂时不可用，请稍后重试。";
}

onMounted(async () => {
  plan.value = await api.getPlan(String(route.params.id)).catch(() => null);
  if (periods.value.length && !periods.value.some(([key]) => key === form.period)) {
    form.period = periods.value[0]![0];
  }
  loading.value = false;
});

async function verifyCoupon() {
  if (!form.coupon || !plan.value) return;
  couponError.value = "";
  couponState.value = null;

  try {
    couponState.value = await api.checkCoupon(form.coupon, plan.value.id);
    toast.success("优惠码校验成功。");
  } catch (error) {
    const message = normalizeCouponError(error instanceof Error ? error.message : "");
    couponError.value = message;
    toast.error(message);
  }
}

async function submitOrder() {
  if (!plan.value) return;
  submitting.value = true;
  orderError.value = "";

  try {
    const response = await api.createOrder({
      plan_id: plan.value.id,
      period: form.period,
      coupon_code: form.coupon || undefined,
    });
    const tradeNo =
      typeof response === "string"
        ? response.trim()
        : String(
            response.trade_no ??
              (response as { data?: string; tradeNo?: string }).data ??
              (response as { data?: string; tradeNo?: string }).tradeNo ??
              "",
          ).trim();

    if (!tradeNo) {
      throw new Error("订单已创建，但暂时没有拿到订单号，请前往订单页继续查看。");
    }

    toast.success(isResetTraffic.value ? "流量重置订单已创建。" : "订单已创建。");
    await router.push({
      path: "/payment",
      query: { trade_no: tradeNo },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建订单失败，请稍后再试。";
    orderError.value = message;
    toast.error(message);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <PageHeader
    title="确认购买"
    description="确认周期、权益与订单金额，提交后会直接进入支付页面。"
  />

  <StateBlock
    v-if="loading"
    title="正在读取套餐信息"
    description="请稍候，正在为您准备本次下单需要的内容。"
  />

  <StateBlock
    v-else-if="!plan"
    title="套餐暂时不可用"
    description="这份套餐当前无法读取，请返回套餐页后重试。"
  />

  <div v-else class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
    <Card class="glass-panel interactive-panel premium-shell spotlight-panel overflow-hidden rounded-[30px] border-white/10">
      <CardContent class="relative p-0">
        <div class="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(120,119,255,0.18),transparent_72%)]" />
        <div class="relative p-6">
          <div class="mb-5">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">套餐信息</div>
            <div class="mt-3 text-2xl font-semibold">{{ plan.name }}</div>
            <div class="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
              选择适合自己的购买周期。如套餐支持重置流量，也会在这里一起展示。
            </div>
          </div>

          <div v-if="planFeatures.length" class="grid gap-3">
            <div
              v-for="item in planFeatures"
              :key="item.feature"
              class="dashboard-subpanel rounded-[22px] border border-white/10 bg-[var(--surface-elevated)] px-4 py-3 text-sm"
            >
              {{ item.feature }}
            </div>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              v-for="[key, label] in periods"
              :key="key"
              class="rounded-[24px] border px-4 py-4 text-left transition-all duration-200"
              :class="
                form.period === key
                  ? 'dashboard-subpanel border-[color:color-mix(in_srgb,var(--primary)_34%,var(--border))] bg-[var(--surface)] shadow-[var(--shadow-soft)]'
                  : 'dashboard-subpanel border-white/10 bg-[var(--surface-elevated)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]'
              "
              @click="form.period = key"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="text-sm text-[var(--muted-foreground)]">{{ label }}</div>
                <RotateCcw v-if="key === 'reset_price'" class="h-4 w-4 text-[var(--primary)]" />
              </div>
              <div class="mt-2 text-xl font-semibold">{{ formatCurrency(Number(plan[key as keyof Plan] ?? 0)) }}</div>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="glass-panel interactive-panel premium-shell spotlight-panel overflow-hidden rounded-[30px] border-white/10">
      <CardContent class="relative p-0">
        <div class="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(76,201,240,0.16),transparent_72%)]" />
        <div class="relative p-6">
          <div class="mb-5">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">订单摘要</div>
            <div class="mt-3 text-2xl font-semibold">{{ isResetTraffic ? "确认重置流量" : "确认应付金额" }}</div>
            <div class="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
              {{ isResetTraffic ? "此操作只会重置已使用流量，不会延长套餐到期时间。" : "支持优惠码校验，创建订单后会直接进入支付页面。" }}
            </div>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <Input
              v-model="form.coupon"
              placeholder="输入优惠码"
              class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4"
              @input="couponError = ''"
            />
            <Button variant="outline" class="h-11 rounded-2xl px-4 sm:w-auto" @click="verifyCoupon">
              <TicketPercent class="h-4 w-4" />
              校验
            </Button>
          </div>
          <p v-if="couponError" class="mt-3 text-sm text-rose-500">{{ couponError }}</p>

          <div class="dashboard-subpanel mt-5 rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-[var(--muted-foreground)]">当前选择</span>
                <span>{{ selectedPeriodLabel }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--muted-foreground)]">原价</span>
                <span>{{ formatCurrency(price) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--muted-foreground)]">优惠</span>
                <span>- {{ formatCurrency(price - finalPrice) }}</span>
              </div>
              <div class="flex justify-between border-t border-white/10 pt-3 text-base font-semibold">
                <span>应付</span>
                <span>{{ formatCurrency(finalPrice) }}</span>
              </div>
            </div>
          </div>

          <p v-if="orderError" class="mt-4 text-sm text-rose-500">{{ orderError }}</p>

          <Button class="mt-5 h-11 w-full rounded-2xl" :disabled="submitting" @click="submitOrder">
            <LoaderCircle v-if="submitting" class="h-4 w-4 animate-spin" />
            <span v-else>{{ isResetTraffic ? "提交重置订单" : "提交订单" }}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
