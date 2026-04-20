<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { toast } from "vue-sonner";
import PageHeader from "@/components/PageHeader.vue";
import StateBlock from "@/components/StateBlock.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate, formatOrderPeriod } from "@/lib/utils";
import { api } from "@/services/api";
import type { Order } from "@/types/api";

const router = useRouter();
const loading = ref(true);
const orders = ref<Order[]>([]);
const currentTradeNo = ref("");
const confirming = ref(false);
const open = ref(false);

function hasRecentPaymentHint(tradeNo: string) {
  const raw = window.sessionStorage.getItem(`payment-success-hint:${tradeNo}`);
  if (!raw) return false;

  try {
    const payload = JSON.parse(raw) as { returnedAt?: number; tradeStatus?: string };
    const returnedAt = Number(payload.returnedAt ?? 0);
    const isFresh = returnedAt > 0 && Date.now() - returnedAt < 30 * 60 * 1000;
    const isSuccess = /success|paid|completed|trade_success/i.test(String(payload.tradeStatus ?? ""));
    return isFresh && isSuccess;
  } catch {
    return false;
  }
}

function getDisplayStatus(order: Order) {
  if (order.status === 0 && hasRecentPaymentHint(order.trade_no)) return 1;
  return order.status;
}

const latestOrders = computed(() =>
  [...orders.value]
    .sort((a, b) => Number(b.created_at ?? 0) - Number(a.created_at ?? 0))
    .slice(0, 10),
);
const pendingCount = computed(() => orders.value.filter((item) => getDisplayStatus(item) === 0).length);
const doneCount = computed(() => orders.value.filter((item) => getDisplayStatus(item) === 3).length);
const totalAmount = computed(() => orders.value.reduce((sum, item) => sum + (item.total_amount ?? 0), 0));

function getStatusMeta(status: number) {
  if (status === 0) return { label: "待付款", variant: "outline" as const };
  if (status === 1) return { label: "处理中", variant: "secondary" as const };
  if (status === 2) return { label: "已取消", variant: "destructive" as const };
  return { label: "已完成", variant: "secondary" as const };
}

async function loadOrders() {
  loading.value = true;
  orders.value = await api.getOrders().catch(() => []);
  loading.value = false;
}

onMounted(loadOrders);

function openCancel(tradeNo: string) {
  currentTradeNo.value = tradeNo;
  open.value = true;
}

async function cancelOrder() {
  if (!currentTradeNo.value) return;
  confirming.value = true;
  try {
    await api.cancelOrder(currentTradeNo.value);
    toast.success("订单已取消。");
    open.value = false;
    await loadOrders();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "取消失败，请稍后再试。");
  } finally {
    confirming.value = false;
  }
}
</script>

<template>
  <PageHeader
    title="订单"
    description="这里展示最近 10 条订单记录，方便您快速查看状态、金额和支付进度。"
  />

  <StateBlock v-if="loading" title="正在加载订单" description="正在同步您的订单记录，请稍候。" />

  <div v-else class="space-y-6">
    <div class="grid gap-4 md:grid-cols-3">
      <Card class="glass-panel interactive-panel overflow-hidden rounded-[28px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_72%)]" />
          <div class="relative p-5">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">订单总数</div>
            <div class="mt-2 text-2xl font-semibold">{{ orders.length }}</div>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel interactive-panel overflow-hidden rounded-[28px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(76,201,240,0.14),transparent_72%)]" />
          <div class="relative p-5">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">待付款</div>
            <div class="mt-2 text-2xl font-semibold">{{ pendingCount }}</div>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel interactive-panel overflow-hidden rounded-[28px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.14),transparent_72%)]" />
          <div class="relative p-5">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">累计消费</div>
            <div class="mt-2 text-2xl font-semibold">{{ formatCurrency(totalAmount) }}</div>
          </div>
        </CardContent>
      </Card>
    </div>

    <StateBlock v-if="!latestOrders.length" title="还没有订单" description="您还没有购买记录，可以先去套餐页选择适合自己的方案。">
      <Button class="rounded-full px-5" @click="router.push('/plans')">去看看套餐</Button>
    </StateBlock>

    <Card v-else class="glass-panel interactive-panel overflow-hidden rounded-[30px] border-white/10">
      <CardContent class="relative p-0">
        <div class="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(120,119,255,0.16),transparent_72%)]" />
        <div class="relative p-6">
          <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">订单明细</div>
              <div class="mt-3 text-2xl font-semibold">最近订单记录</div>
              <div class="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">当前仅展示最新 10 条记录，方便您快速查看和继续处理。</div>
            </div>
            <Badge variant="outline" class="rounded-full px-3 py-1.5">已完成 {{ doneCount }}</Badge>
          </div>

          <div class="space-y-3 md:hidden">
            <div
              v-for="item in latestOrders"
              :key="`${item.trade_no}-mobile`"
              class="action-band rounded-[24px] p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold">{{ item.trade_no }}</div>
                  <div class="mt-1 text-xs text-[var(--muted-foreground)]">{{ formatDate(item.created_at) }}</div>
                </div>
                <Badge :variant="getStatusMeta(getDisplayStatus(item)).variant" class="rounded-full px-3 py-1.5">
                  {{ getStatusMeta(getDisplayStatus(item)).label }}
                </Badge>
              </div>
              <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div class="rounded-2xl bg-[var(--background)]/55 p-3">
                  <div class="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">周期</div>
                  <div class="mt-2 font-medium">{{ formatOrderPeriod(item.period) }}</div>
                </div>
                <div class="rounded-2xl bg-[var(--background)]/55 p-3">
                  <div class="text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">金额</div>
                  <div class="mt-2 font-medium">{{ formatCurrency(item.total_amount) }}</div>
                </div>
              </div>
              <div class="mt-4 grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" class="h-10 rounded-2xl px-4" @click="router.push(`/payment/${item.trade_no}`)">
                  查看详情
                </Button>
                <Button
                  v-if="getDisplayStatus(item) === 0"
                  variant="destructive"
                  size="sm"
                  class="h-10 rounded-2xl px-4"
                  @click="openCancel(item.trade_no)"
                >
                  取消订单
                </Button>
              </div>
            </div>
          </div>

          <div class="hidden overflow-x-auto rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>周期</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead class="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="item in latestOrders" :key="item.trade_no">
                  <TableCell class="font-medium">{{ item.trade_no }}</TableCell>
                  <TableCell>{{ formatOrderPeriod(item.period) }}</TableCell>
                  <TableCell>{{ formatCurrency(item.total_amount) }}</TableCell>
                  <TableCell>{{ formatDate(item.created_at) }}</TableCell>
                  <TableCell>
                    <Badge :variant="getStatusMeta(getDisplayStatus(item)).variant" class="rounded-full px-3 py-1.5">
                      {{ getStatusMeta(getDisplayStatus(item)).label }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex justify-end gap-2">
                      <Button variant="outline" size="sm" class="rounded-full px-4" @click="router.push(`/payment/${item.trade_no}`)">
                        查看详情
                      </Button>
                      <Button
                        v-if="getDisplayStatus(item) === 0"
                        variant="destructive"
                        size="sm"
                        class="rounded-full px-4"
                        @click="openCancel(item.trade_no)"
                      >
                        取消订单
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  <Dialog :open="open" @update:open="open = $event">
    <DialogContent class="rounded-[28px]">
      <DialogHeader>
        <DialogTitle>确认取消订单</DialogTitle>
        <DialogDescription>确认取消订单 {{ currentTradeNo }} 吗？取消后这笔订单将不会继续支付。</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="open = false">先保留订单</Button>
        <Button variant="destructive" :disabled="confirming" @click="cancelOrder">确认取消</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
