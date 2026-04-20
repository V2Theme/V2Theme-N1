<script setup lang="ts">
import { Activity, CreditCard, Gauge, Ticket } from "lucide-vue-next";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import StateBlock from "@/components/StateBlock.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes, formatCurrency, formatDate, toPercent } from "@/lib/utils";
import { api } from "@/services/api";
import type { SubscribeInfo, Ticket as TicketItem, UserInfo, UserStat } from "@/types/api";

const router = useRouter();
const loading = ref(true);
const error = ref("");
const user = ref<UserInfo | null>(null);
const subscribe = ref<SubscribeInfo | null>(null);
const stats = ref<UserStat>({});
const tickets = ref<TicketItem[]>([]);

const quickStats = reactive([
  { label: "账户余额", icon: CreditCard, value: "-" },
  { label: "已用流量", icon: Gauge, value: "-" },
  { label: "待处理工单", icon: Ticket, value: "-" },
]);

const totalTransfer = computed(() => subscribe.value?.transfer_enable ?? user.value?.transfer_enable ?? 0);
const usedTransfer = computed(() => (subscribe.value?.u ?? user.value?.u ?? 0) + (subscribe.value?.d ?? user.value?.d ?? 0));
const usagePercent = computed(() => toPercent(usedTransfer.value, totalTransfer.value));
const currentPlanName = computed(() => subscribe.value?.plan?.name ?? "暂未开通套餐");
const pendingTickets = computed(() => tickets.value.filter((item) => item.status === 0).length);
const planStatus = computed(() => (subscribe.value?.expired_at ? "服务有效" : "未开通"));

onMounted(async () => {
  try {
    const [userInfo, subscribeInfo, statInfo, ticketList] = await Promise.all([
      api.getUserInfo(),
      api.getSubscribe(),
      api.getStats(),
      api.getTickets(),
    ]);

    user.value = userInfo;
    subscribe.value = subscribeInfo;
    stats.value = statInfo;
    tickets.value = ticketList;

    quickStats[0].value = formatCurrency(userInfo.balance);
    quickStats[1].value = formatBytes(usedTransfer.value);
    quickStats[2].value = String(ticketList.filter((item) => item.status === 0).length);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "暂时无法加载首页信息，请稍后再试。";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <PageHeader
    title="仪表盘"
    description="把套餐状态、流量使用和待处理事项集中到一个页面，方便您快速查看并继续操作。"
  />

  <StateBlock v-if="loading" title="正在加载首页信息" description="正在同步账户、订阅和工单信息，请稍候。" />
  <StateBlock v-else-if="error" title="加载失败" :description="error" />

  <div v-else class="space-y-6">
    <div class="grid gap-4 md:grid-cols-3">
      <Card
        v-for="(item, index) in quickStats"
        :key="item.label"
        class="glass-panel interactive-panel premium-shell stat-card min-h-[152px] rounded-[30px] border-white/10 animated-enter-soft"
        :style="{ animationDelay: `${index * 70}ms` }"
      >
        <CardContent class="flex h-full items-start justify-between p-6">
          <div>
            <div class="text-sm text-[var(--muted-foreground)]">{{ item.label }}</div>
            <div class="mt-4 text-[2rem] font-semibold tracking-tight">{{ item.value }}</div>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]">
            <component :is="item.icon" class="h-5 w-5 text-[var(--primary)]" />
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.7fr_1.05fr]">
      <Card class="glass-panel interactive-panel premium-shell spotlight-panel min-h-[448px] rounded-[32px] border-white/10 animated-enter-soft" style="animation-delay: 120ms;">
        <CardHeader class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle class="text-[1.85rem] tracking-tight">当前套餐</CardTitle>
            <CardDescription class="mt-2 text-base leading-7">{{ currentPlanName }}</CardDescription>
          </div>
          <Badge :variant="subscribe?.expired_at ? 'secondary' : 'outline'" class="rounded-full px-3 py-1.5">{{ planStatus }}</Badge>
        </CardHeader>

        <CardContent class="flex h-full flex-col space-y-6">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="dashboard-subpanel rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-5">
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">到期时间</div>
              <div class="mt-3 text-base font-medium">{{ formatDate(subscribe?.expired_at) }}</div>
            </div>
            <div class="dashboard-subpanel rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-5">
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">设备限制</div>
              <div class="mt-3 text-base font-medium">{{ subscribe?.device_limit ?? user?.device_limit ?? "不限" }}</div>
            </div>
          </div>

          <div class="dashboard-subpanel rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-5">
            <div class="mb-3 flex items-center justify-between text-sm">
              <span>流量使用情况</span>
              <span>{{ usagePercent }}%</span>
            </div>
            <div class="stat-bar h-2.5">
              <span :style="{ width: `${usagePercent}%` }" />
            </div>
            <div class="mt-4 flex items-center justify-between text-sm text-[var(--muted-foreground)]">
              <span>已用 {{ formatBytes(usedTransfer) }}</span>
              <span>总量 {{ formatBytes(totalTransfer) }}</span>
            </div>
          </div>

          <div class="mt-auto flex flex-wrap gap-3 pt-2">
            <Button class="hero-cta rounded-full px-5" @click="router.push('/subscription')">查看订阅</Button>
            <Button variant="outline" class="hero-cta-secondary rounded-full px-5" @click="router.push('/plans')">选购套餐</Button>
            <Button variant="outline" class="hero-cta-secondary rounded-full px-5" @click="router.push('/tickets')">提交工单</Button>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel interactive-panel premium-shell spotlight-panel min-h-[448px] rounded-[32px] border-white/10 animated-enter-soft" style="animation-delay: 180ms;">
        <CardHeader class="pb-4">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-[20px] border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]">
              <Activity class="h-5 w-5 text-[var(--primary)]" />
            </div>
            <div>
              <CardTitle class="text-[1.65rem] tracking-tight">快速概览</CardTitle>
              <CardDescription class="mt-1 text-sm leading-6">保留最常看的信息，让首页更简洁，也更容易一眼读懂。</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="flex h-full flex-col space-y-4">
          <div class="dashboard-subpanel rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-5">
            <div class="text-sm text-[var(--muted-foreground)]">今日流量</div>
            <div class="mt-3 text-[2rem] font-semibold tracking-tight">{{ formatBytes(stats.day_used_traffic ?? 0) }}</div>
          </div>
          <div class="dashboard-subpanel rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-5">
            <div class="text-sm text-[var(--muted-foreground)]">待处理工单</div>
            <div class="mt-3 text-[2rem] font-semibold tracking-tight">{{ pendingTickets }}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
