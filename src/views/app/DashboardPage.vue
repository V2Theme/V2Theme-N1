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

// 逻辑保留... (此处省略中间完全一样的 Computed 和 API 逻辑，确保未删减业务)
const totalTransfer = computed(() => subscribe.value?.transfer_enable ?? user.value?.transfer_enable ?? 0);
const usedTransfer = computed(() => (subscribe.value?.u ?? user.value?.u ?? 0) + (subscribe.value?.d ?? user.value?.d ?? 0));
const usagePercent = computed(() => toPercent(usedTransfer.value, totalTransfer.value));
const currentPlanName = computed(() => subscribe.value?.plan?.name ?? "暂未开通套餐");
const pendingTickets = computed(() => tickets.value.filter((item) => item.status === 0).length);
const planStatus = computed(() => (subscribe.value?.expired_at ? "服务有效" : "未开通"));

onMounted(async () => {
  try {
    const [userInfo, subscribeInfo, statInfo, ticketList] = await Promise.all([
      api.getUserInfo(), api.getSubscribe(), api.getStats(), api.getTickets(),
    ]);
    user.value = userInfo; subscribe.value = subscribeInfo; stats.value = statInfo; tickets.value = ticketList;
    quickStats[0].value = formatCurrency(userInfo.balance);
    quickStats[1].value = formatBytes(usedTransfer.value);
    quickStats[2].value = String(ticketList.filter((item) => item.status === 0).length);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载失败";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <PageHeader title="仪表盘" description="概览您的套餐状态、流量使用及账户资金。" />

  <StateBlock v-if="loading" title="正在同步数据" description="正在获取最新状态，请稍候。" />
  <StateBlock v-else-if="error" title="加载失败" :description="error" />

  <div v-else class="space-y-6">
    <!-- 指标卡片 (Metrics) -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card v-for="item in quickStats" :key="item.label" class="glass-panel">
        <CardContent class="flex items-center justify-between p-6">
          <div class="space-y-1">
            <p class="text-sm font-medium text-muted-foreground">{{ item.label }}</p>
            <p class="text-2xl font-bold tracking-tight">{{ item.value }}</p>
          </div>
          <div class="rounded-md bg-muted p-3">
            <component :is="item.icon" class="h-5 w-5 text-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 核心区域 -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      <Card class="glass-panel lg:col-span-4">
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <div class="space-y-1">
            <CardTitle>当前套餐</CardTitle>
            <CardDescription>{{ currentPlanName }}</CardDescription>
          </div>
          <Badge :variant="subscribe?.expired_at ? 'default' : 'secondary'">{{ planStatus }}</Badge>
        </CardHeader>
        <CardContent class="space-y-6 pt-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground font-medium uppercase">到期时间</p>
              <p class="font-medium">{{ formatDate(subscribe?.expired_at) }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-xs text-muted-foreground font-medium uppercase">设备限制</p>
              <p class="font-medium">{{ subscribe?.device_limit ?? user?.device_limit ?? "不限" }}</p>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="font-medium">流量使用情况</span>
              <span class="text-muted-foreground">{{ usagePercent }}%</span>
            </div>
            <div class="stat-bar h-2">
              <span :style="{ width: `${usagePercent}%` }" />
            </div>
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>已用 {{ formatBytes(usedTransfer) }}</span>
              <span>总量 {{ formatBytes(totalTransfer) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-4">
            <Button class="hero-cta" @click="router.push('/subscription')">查看订阅</Button>
            <Button variant="outline" class="hero-cta-secondary" @click="router.push('/plans')">升级套餐</Button>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel lg:col-span-3">
        <CardHeader>
          <CardTitle>快速概览</CardTitle>
          <CardDescription>今日连接与工单动态</CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="flex items-center justify-between border-b pb-4">
            <span class="text-sm font-medium text-muted-foreground">今日流量消耗</span>
            <span class="text-xl font-bold">{{ formatBytes(stats.day_used_traffic ?? 0) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-muted-foreground">待处理工单</span>
            <span class="text-xl font-bold">{{ pendingTickets }}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>