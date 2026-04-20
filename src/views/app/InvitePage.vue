<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import PageHeader from "@/components/PageHeader.vue";
import StateBlock from "@/components/StateBlock.vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import type { InviteDetail, InviteSummary } from "@/types/api";
import { copyText, formatCurrency, formatDate, parseYuanToFen } from "@/lib/utils";

const loading = ref(true);
const summary = ref<InviteSummary>({});
const details = ref<InviteDetail[]>([]);
const transferAmount = ref("");
const transferError = ref("");
const pending = ref(false);

const currentCode = computed(() => summary.value.codes?.[0]?.code ?? "");
const stats = computed(() => {
  const stat = summary.value.stat?.[0];
  return {
    inviteCount: summary.value.codes?.length ?? 0,
    registerCount: stat?.register_count ?? 0,
    commission: stat?.commission ?? 0,
  };
});
const inviteLink = computed(() => {
  if (!currentCode.value) return "";
  return `${window.location.origin}${window.location.pathname}#/register?code=${currentCode.value}`;
});

async function refresh() {
  loading.value = true;
  try {
    const [summaryData, detailData] = await Promise.all([api.getInviteSummary(), api.getInviteDetails()]);
    summary.value = summaryData;
    details.value = detailData;
  } finally {
    loading.value = false;
  }
}

async function generateCode() {
  try {
    await api.saveInviteCode();
    toast.success("邀请码已生成。");
    await refresh();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "邀请码生成失败，请稍后重试。");
  }
}

async function copyInviteLink() {
  if (!inviteLink.value) return;
  try {
    await copyText(inviteLink.value);
    toast.success("邀请链接已复制。");
  } catch {
    toast.error("复制失败，请手动复制。");
  }
}

async function transfer() {
  transferError.value = "";
  const amount = parseYuanToFen(transferAmount.value);
  if (!amount) {
    transferError.value = "请输入正确的转入金额。";
    return;
  }
  pending.value = true;
  try {
    await api.transferCommission(amount);
    transferAmount.value = "";
    toast.success("佣金已转入账户余额。");
    await refresh();
  } catch (err) {
    const message = err instanceof Error ? err.message : "佣金转入失败，请稍后重试。";
    transferError.value = message;
    toast.error(message);
  } finally {
    pending.value = false;
  }
}

onMounted(refresh);
</script>

<template>
  <PageHeader
    title="邀请返利"
    description="生成邀请链接、查看返利记录，并把可用佣金转入账户余额。"
  />

  <StateBlock v-if="loading" title="正在加载邀请信息" description="正在同步邀请码、返利和佣金数据。" />

  <div v-else class="space-y-6">
    <div class="grid gap-4 md:grid-cols-3">
      <Card class="glass-panel interactive-panel rounded-[28px] border-white/10">
        <CardContent class="p-5">
          <div class="text-sm text-[var(--muted-foreground)]">邀请码数量</div>
          <div class="mt-3 text-2xl font-semibold">{{ stats.inviteCount }}</div>
        </CardContent>
      </Card>
      <Card class="glass-panel interactive-panel rounded-[28px] border-white/10">
        <CardContent class="p-5">
          <div class="text-sm text-[var(--muted-foreground)]">邀请注册人数</div>
          <div class="mt-3 text-2xl font-semibold">{{ stats.registerCount }}</div>
        </CardContent>
      </Card>
      <Card class="glass-panel interactive-panel rounded-[28px] border-white/10">
        <CardContent class="p-5">
          <div class="text-sm text-[var(--muted-foreground)]">累计返利</div>
          <div class="mt-3 text-2xl font-semibold">{{ formatCurrency(stats.commission) }}</div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card class="glass-panel interactive-panel premium-shell rounded-[30px] border-white/10">
        <CardHeader>
          <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">邀请入口</div>
          <CardTitle class="text-[1.55rem]">分享注册链接</CardTitle>
          <CardDescription>生成邀请码后，直接复制邀请链接分享给需要的人即可。</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <div class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-5">
            <div class="text-sm text-[var(--muted-foreground)]">当前邀请码</div>
            <div class="mt-3 text-xl font-semibold">{{ currentCode || "尚未生成" }}</div>
            <div v-if="summary.codes?.[0]?.created_at" class="mt-2 text-sm text-[var(--muted-foreground)]">
              创建时间：{{ formatDate(summary.codes?.[0]?.created_at) }}
            </div>
            <div v-if="inviteLink" class="mt-4 break-all rounded-2xl border border-white/10 bg-white/40 px-4 py-3 text-sm text-[var(--muted-foreground)]">
              {{ inviteLink }}
            </div>
          </div>

          <div class="flex flex-wrap gap-3">
            <Button class="rounded-full px-5" @click="generateCode">生成邀请码</Button>
            <Button variant="outline" class="rounded-full px-5" :disabled="!inviteLink" @click="copyInviteLink">复制邀请链接</Button>
          </div>

          <div class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-5">
            <div class="text-sm font-medium">佣金转入余额</div>
            <div class="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">输入需要转入余额的金额，单位为元。</div>
            <div class="mt-4 flex flex-col gap-3 sm:flex-row">
              <Input v-model="transferAmount" placeholder="请输入转入金额" class="h-11 rounded-2xl bg-white/60 px-4" @input="transferError = ''" />
              <Button class="rounded-full px-5 sm:min-w-36" :disabled="pending" @click="transfer">佣金转入余额</Button>
            </div>
            <p v-if="transferError" class="mt-3 text-sm text-rose-500">{{ transferError }}</p>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel interactive-panel premium-shell rounded-[30px] border-white/10">
        <CardHeader>
          <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">返利明细</div>
          <CardTitle class="text-[1.55rem]">最近返利记录</CardTitle>
          <CardDescription>完成注册或购买后，对应返利会显示在这里。</CardDescription>
        </CardHeader>
        <CardContent>
          <StateBlock v-if="!details.length" title="暂无返利明细" description="当前还没有通过邀请带来的返利记录。" />
          <div v-else class="space-y-3">
            <div v-for="item in details" :key="item.id" class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div class="font-medium">{{ item.email }}</div>
                  <div class="mt-1 text-sm text-[var(--muted-foreground)]">{{ formatDate(item.created_at) }}</div>
                </div>
                <div class="text-right">
                  <div class="text-base font-semibold">{{ formatCurrency(item.get_amount) }}</div>
                  <div class="mt-1 text-xs text-[var(--muted-foreground)]">{{ item.status === 1 ? "已结算" : "待结算" }}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
