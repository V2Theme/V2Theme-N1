<script setup lang="ts">
import { Copy, Download, QrCode, Smartphone } from "lucide-vue-next";
import QRCode from "qrcode";
import { computed, onMounted, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { appConfig } from "@/config/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader.vue";
import StateBlock from "@/components/StateBlock.vue";
import { api } from "@/services/api";
import type { SubscribeInfo } from "@/types/api";
import { copyText, formatBytes, formatDate, parsePlanFeatures, toPercent } from "@/lib/utils";

const loading = ref(true);
const error = ref("");
const data = ref<SubscribeInfo | null>(null);
const qrOpen = ref(false);
const qrDataUrl = ref("");
const qrLoading = ref(false);

const usedTraffic = computed(() => (data.value?.u ?? 0) + (data.value?.d ?? 0));
const totalTraffic = computed(() => data.value?.transfer_enable ?? 0);
const usagePercent = computed(() => toPercent(usedTraffic.value, totalTraffic.value));
const planFeatures = computed(() => parsePlanFeatures(data.value?.plan?.content));

onMounted(async () => {
  try {
    data.value = await api.getSubscribe();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "暂时无法加载订阅信息，请稍后再试。";
  } finally {
    loading.value = false;
  }
});

watch(qrOpen, async (open) => {
  if (!open || !data.value?.subscribe_url) return;
  if (qrDataUrl.value) return;
  qrLoading.value = true;
  try {
    qrDataUrl.value = await QRCode.toDataURL(data.value.subscribe_url, {
      margin: 1,
      width: 320,
      color: { dark: "#101828", light: "#ffffff" },
    });
  } catch {
    toast.error("暂时无法生成二维码，请先复制订阅链接使用。");
    qrOpen.value = false;
  } finally {
    qrLoading.value = false;
  }
});

async function copySubscription() {
  if (!data.value?.subscribe_url) return;
  await copyText(data.value.subscribe_url);
  toast.success("订阅链接已复制。");
}

function openQrDialog() {
  if (!data.value?.subscribe_url) {
    toast.error("当前还没有可用的订阅链接。");
    return;
  }
  qrOpen.value = true;
}
</script>

<template>
  <PageHeader
    title="订阅"
    description="在这里查看套餐状态、流量使用情况和订阅链接，方便您快速导入到常用客户端。"
  />

  <StateBlock v-if="loading" title="正在加载订阅信息" description="正在同步套餐、流量和客户端下载信息，请稍候。" />
  <StateBlock v-else-if="error" title="加载失败" :description="error" />

  <div v-else class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
    <Card class="glass-panel interactive-panel premium-shell overflow-hidden rounded-[30px] border-white/10">
      <CardContent class="relative p-0">
        <div class="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(120,119,255,0.18),transparent_72%)]" />
        <div class="relative p-6">
          <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">订阅概览</div>
              <div class="mt-3 text-2xl font-semibold">当前套餐与流量</div>
              <div class="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">这里会展示当前套餐、到期时间、设备限制和订阅链接。</div>
            </div>
            <Badge :variant="data?.subscribe_url ? 'secondary' : 'outline'" class="rounded-full px-3 py-1.5">
              {{ data?.subscribe_url ? "可立即使用" : "暂未生成" }}
            </Badge>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">当前套餐</div>
              <div class="mt-2 text-base font-medium">{{ data?.plan?.name ?? "未开通" }}</div>
            </div>
            <div class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">到期时间</div>
              <div class="mt-2 text-base font-medium">{{ formatDate(data?.expired_at) }}</div>
            </div>
            <div class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">设备限制</div>
              <div class="mt-2 text-base font-medium">{{ data?.device_limit ?? "不限" }}</div>
            </div>
            <div class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">流量重置日</div>
              <div class="mt-2 text-base font-medium">{{ data?.reset_day ?? "未设置" }}</div>
            </div>
          </div>

          <div class="mt-5 rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
            <div class="mb-3 flex items-center justify-between text-sm">
              <span>流量使用情况</span>
              <span>{{ usagePercent }}%</span>
            </div>
            <div class="stat-bar h-2.5">
              <span :style="{ width: `${usagePercent}%` }" />
            </div>
            <div class="mt-3 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>已用 {{ formatBytes(usedTraffic) }}</span>
              <span>总量 {{ formatBytes(totalTraffic) }}</span>
            </div>
          </div>

          <div class="mt-5 space-y-3">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">订阅链接</div>
            <Input :model-value="data?.subscribe_url ?? '暂时没有可用的订阅链接'" readonly class="h-12 rounded-2xl bg-[var(--surface-elevated)] px-4" />
          </div>

          <div v-if="planFeatures.length" class="mt-5 space-y-3">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">套餐权益</div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div
                v-for="feature in planFeatures"
                :key="feature.feature"
                class="rounded-[22px] border border-white/10 bg-[var(--surface-elevated)] px-4 py-3 text-sm"
              >
                <div class="flex items-center justify-between gap-3">
                  <span>{{ feature.feature }}</span>
                  <Badge :variant="feature.support ? 'secondary' : 'outline'" class="rounded-full px-2.5 py-1">
                    {{ feature.support ? "支持" : "不支持" }}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-5 flex flex-wrap gap-3">
            <Button class="rounded-full px-5" @click="copySubscription">
              <Copy class="h-4 w-4" />
              复制订阅链接
            </Button>
            <Button variant="outline" class="rounded-full px-5" @click="openQrDialog">
              <QrCode class="h-4 w-4" />
              查看二维码
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="glass-panel interactive-panel premium-shell overflow-hidden rounded-[30px] border-white/10">
      <CardContent class="relative p-0">
        <div class="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(76,201,240,0.16),transparent_72%)]" />
        <div class="relative p-6">
          <div class="mb-5">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">客户端下载</div>
            <div class="mt-3 text-2xl font-semibold">选择常用设备</div>
            <div class="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">按您的设备选择客户端，复制订阅链接后即可快速导入使用。</div>
          </div>

          <div class="space-y-4 text-sm text-[var(--muted-foreground)]">
            <div class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
              <div class="flex items-center gap-2 font-medium text-[var(--foreground)]">
                <Smartphone class="h-4 w-4 text-[var(--primary)]" />
                推荐客户端
              </div>
              <div class="mt-2 leading-6">
                iPhone / iPad 可优先考虑 Shadowrocket 或 Stash，Android 推荐 Clash Meta 或 V2rayNG，电脑端推荐 Clash Verge 或 Mihomo Party。
              </div>
            </div>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <a
              v-for="client in appConfig.clientDownloads"
              :key="client.label"
              :href="client.url"
              target="_blank"
              rel="noreferrer"
              class="group rounded-[22px] border border-white/10 bg-[var(--surface-elevated)] px-4 py-3 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--primary)_18%,var(--border))] hover:shadow-[var(--shadow-soft)]"
            >
              <div class="flex items-center justify-between gap-3">
                <span>{{ client.label }}</span>
                <Download class="h-4 w-4 transition group-hover:translate-y-0.5" />
              </div>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  <Dialog :open="qrOpen" :modal="false" @update:open="qrOpen = $event">
    <DialogContent class="rounded-[28px] sm:max-w-md">
      <DialogHeader>
        <DialogTitle>订阅二维码</DialogTitle>
        <DialogDescription>打开客户端扫码，或继续复制订阅链接手动导入。</DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div class="flex min-h-80 items-center justify-center rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
          <div v-if="qrLoading" class="text-sm text-[var(--muted-foreground)]">正在生成二维码...</div>
          <img v-else-if="qrDataUrl" :src="qrDataUrl" alt="订阅二维码" class="h-72 w-72 rounded-2xl bg-white p-3" />
          <div v-else class="text-sm text-[var(--muted-foreground)]">暂无可展示的二维码</div>
        </div>

        <Input :model-value="data?.subscribe_url ?? ''" readonly class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />

        <Button class="h-11 w-full rounded-2xl" @click="copySubscription">
          <Copy class="h-4 w-4" />
          复制订阅链接
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
