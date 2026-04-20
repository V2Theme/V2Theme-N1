<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader.vue";
import StateBlock from "@/components/StateBlock.vue";
import { formatDate } from "@/lib/utils";
import { api } from "@/services/api";
import type { Notice } from "@/types/api";

const loading = ref(true);
const error = ref("");
const notices = ref<Notice[]>([]);
const activeId = ref<number | null>(null);

const activeNotice = computed(() => notices.value.find((item) => item.id === activeId.value) ?? null);
const latestNotice = computed(() => notices.value[0] ?? null);

onMounted(async () => {
  try {
    notices.value = await api.getNotices();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "暂时无法加载公告，请稍后再试。";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <PageHeader
    title="公告"
    description="在这里查看站点通知、服务提醒和最近更新，重要消息会第一时间展示。"
  />

  <StateBlock v-if="loading" title="正在加载公告" description="正在同步站内消息，请稍候。" />
  <StateBlock v-else-if="error" title="加载失败" :description="error" />
  <StateBlock v-else-if="!notices.length" title="暂无公告" description="当前还没有新的站内消息，后续更新会显示在这里。" />

  <div v-else class="space-y-6">
    <Card v-if="latestNotice" class="glass-panel interactive-panel premium-shell spotlight-panel rounded-[30px] border-white/10">
      <CardContent class="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div>
          <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">最新公告</div>
          <div class="mt-3 text-2xl font-semibold">{{ latestNotice.title }}</div>
          <div class="mt-3 line-clamp-4 whitespace-pre-wrap text-sm leading-7 text-[var(--muted-foreground)]">
            {{ latestNotice.content }}
          </div>
        </div>
        <div class="dashboard-subpanel rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-5">
          <div class="text-sm text-[var(--muted-foreground)]">发布时间</div>
          <div class="mt-2 text-lg font-semibold">{{ formatDate(latestNotice.created_at) }}</div>
          <Button class="mt-5 rounded-full px-5" @click="activeId = latestNotice.id">查看详情</Button>
        </div>
      </CardContent>
    </Card>

    <div class="grid gap-4">
      <Card
        v-for="(notice, index) in notices"
        :key="notice.id"
        class="glass-panel interactive-panel premium-shell spotlight-panel rounded-[28px] border-white/10 animated-enter-soft"
        :style="{ animationDelay: `${index * 60}ms` }"
      >
        <CardHeader>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle class="text-lg">{{ notice.title }}</CardTitle>
              <CardDescription class="mt-2">{{ formatDate(notice.created_at) }}</CardDescription>
            </div>
            <Button variant="outline" size="sm" class="rounded-full px-4" @click="activeId = notice.id">查看详情</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div class="line-clamp-3 whitespace-pre-wrap text-sm leading-7 text-[var(--muted-foreground)]">{{ notice.content }}</div>
        </CardContent>
      </Card>
    </div>
  </div>

  <Dialog :open="!!activeNotice" @update:open="(value) => { if (!value) activeId = null }">
    <DialogContent class="max-w-3xl rounded-[28px]">
      <DialogHeader>
        <DialogTitle>{{ activeNotice?.title }}</DialogTitle>
        <DialogDescription>{{ formatDate(activeNotice?.created_at) }}</DialogDescription>
      </DialogHeader>
      <div class="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-[20px] border border-white/10 bg-[var(--surface-elevated)] p-4 text-sm leading-7 text-[var(--muted-foreground)]">
        {{ activeNotice?.content }}
      </div>
      <DialogFooter>
        <Button variant="outline" @click="activeId = null">关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
