<script setup lang="ts">
import { Check, Clapperboard, Globe2, ShoppingCart, Smartphone, Zap } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader.vue";
import StateBlock from "@/components/StateBlock.vue";
import { formatBytes, formatCurrency, parsePlanFeatures } from "@/lib/utils";
import { api } from "@/services/api";
import type { Plan } from "@/types/api";

const loading = ref(true);
const error = ref("");
const plans = ref<Plan[]>([]);

const priceLabels = [
  { key: "month_price", label: "月付" },
  { key: "quarter_price", label: "季付" },
  { key: "half_year_price", label: "半年付" },
  { key: "year_price", label: "年付" },
  { key: "two_year_price", label: "两年付" },
  { key: "three_year_price", label: "三年付" },
  { key: "onetime_price", label: "一次性" },
] as const;

const topCards = [
  { title: "全球节点", text: "覆盖多地区的高速节点资源", icon: Globe2, glow: "rgba(99,102,241,0.14)" },
  { title: "极速体验", text: "稳定流畅的网络连接体验", icon: Zap, glow: "rgba(76,201,240,0.14)" },
  { title: "流媒体解锁", text: "更轻松访问常见影音娱乐服务", icon: Clapperboard, glow: "rgba(139,92,246,0.14)" },
  { title: "多设备支持", text: "支持多台设备同时在线使用", icon: Smartphone, glow: "rgba(34,197,94,0.14)" },
];

const featured = computed(() => plans.value.find((plan) => bestPrice(plan) > 0)?.id ?? null);

const bestPrice = (plan: Plan) =>
  [
    plan.month_price,
    plan.quarter_price,
    plan.half_year_price,
    plan.year_price,
    plan.two_year_price,
    plan.three_year_price,
    plan.onetime_price,
  ].find((item) => item !== null && item !== undefined) ?? 0;

function availablePeriods(plan: Plan) {
  return priceLabels.filter(({ key }) => plan[key] !== null && plan[key] !== undefined);
}

function featureLines(plan: Plan) {
  const parsed = parsePlanFeatures(plan.content);
  if (parsed.length) return parsed;
  return [
    { feature: `流量 ${formatBytes(plan.transfer_enable ?? 0)}`, support: true },
    { feature: `速率 ${plan.speed_limit ? `${plan.speed_limit} Mbps` : "不限速"}`, support: true },
    { feature: `设备 ${plan.device_limit ?? "不限"}`, support: true },
  ];
}

onMounted(async () => {
  try {
    plans.value = await api.getPlans();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "暂时无法加载套餐，请稍后再试。";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <PageHeader
    title="套餐"
    description="选择适合自己的套餐，价格、付款周期和主要权益都会在这里清楚展示，方便快速比较。"
  />

  <StateBlock v-if="loading" title="正在加载套餐" description="请稍候，正在为您准备可选套餐和价格信息。" />
  <StateBlock v-else-if="error" title="加载失败" :description="error" />

  <template v-else-if="plans.length">
    <div class="mb-7 grid gap-4 lg:grid-cols-4">
      <Card
        v-for="(item, index) in topCards"
        :key="item.title"
        class="glass-panel interactive-panel premium-shell overflow-hidden rounded-[30px] border-white/10 stagger-enter"
        :style="{ '--stagger-delay': `${index * 70 + 80}ms` }"
      >
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-20" :style="{ background: `radial-gradient(circle_at_top,${item.glow},transparent 72%)` }" />
          <div class="relative flex min-h-[118px] items-center gap-4 p-5">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]">
              <component :is="item.icon" class="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">{{ item.title }}</div>
              <div class="mt-2 text-sm leading-6 text-[var(--foreground)]">{{ item.text }}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 xl:grid-cols-3">
      <Card
        v-for="(plan, index) in plans"
        :key="plan.id"
        class="glass-panel interactive-panel premium-shell micro-lift relative overflow-hidden rounded-[32px] border-white/10 animated-enter-soft"
        :style="{ animationDelay: `${index * 80}ms` }"
      >
        <div class="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.24),transparent_72%)]" />
        <CardContent class="relative flex h-full flex-col p-6">
          <div class="min-h-[126px]">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-xl font-semibold">{{ plan.name }}</div>
                <div class="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  适合希望稳定使用、快速了解套餐内容并清晰选择付款周期的用户。
                </div>
              </div>
              <Badge
                v-if="featured === plan.id"
                variant="secondary"
                class="rounded-full px-3 py-1.5 shadow-[var(--shadow-soft)]"
              >
                推荐
              </Badge>
            </div>
          </div>

          <div class="mt-6 min-h-[96px] rounded-[26px] border border-white/10 bg-[var(--surface-elevated)] px-5 py-4">
            <div class="flex items-end gap-2">
              <div class="text-4xl font-semibold tracking-tight">{{ formatCurrency(bestPrice(plan)) }}</div>
              <div class="pb-1 text-sm text-[var(--muted-foreground)]">起</div>
            </div>
            <div class="mt-2 text-xs text-[var(--muted-foreground)]">支持按不同周期灵活购买</div>
          </div>

          <div class="mt-4 flex min-h-[48px] flex-wrap gap-2">
            <Badge
              v-for="period in availablePeriods(plan)"
              :key="period.key"
              variant="outline"
              class="rounded-full px-2.5 py-1 transition-all duration-200 hover:border-[color:color-mix(in_srgb,var(--primary)_26%,var(--border))] hover:bg-[var(--surface)]"
            >
              {{ period.label }}
            </Badge>
          </div>

          <div class="mt-6 flex-1 space-y-3.5">
            <div
              v-for="line in featureLines(plan)"
              :key="line.feature"
              class="flex items-center gap-2 text-sm text-[var(--muted-foreground)]"
            >
              <Check class="h-4 w-4 shrink-0 text-[var(--primary)]" />
              <span>{{ line.feature }}</span>
            </div>
          </div>

          <RouterLink :to="`/plans/${plan.id}`" class="mt-8 block">
            <Button class="hero-cta h-12 w-full rounded-[18px] text-sm shadow-[var(--shadow-soft)]">
              <ShoppingCart class="h-4 w-4" />
              立即购买
            </Button>
          </RouterLink>
        </CardContent>
      </Card>
    </div>
  </template>

  <StateBlock v-else title="暂时没有套餐" description="当前还没有可选套餐，请稍后再来看看。" />
</template>
