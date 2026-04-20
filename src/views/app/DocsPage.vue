<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { marked } from "marked";
import PageHeader from "@/components/PageHeader.vue";
import StateBlock from "@/components/StateBlock.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { api } from "@/services/api";
import type { KnowledgeArticleDetail, KnowledgeArticleSummary, KnowledgeCategoryMap } from "@/types/api";

const loading = ref(true);
const docs = ref<KnowledgeCategoryMap>({});
const activeArticle = ref<KnowledgeArticleDetail | null>(null);
const detailLoading = ref(false);

marked.setOptions({ breaks: true, gfm: true });

const categories = computed(() => Object.entries(docs.value));
const totalDocs = computed(() => categories.value.reduce((sum, [, list]) => sum + list.length, 0));
const articleHtml = computed(() => {
  const source = activeArticle.value?.body || activeArticle.value?.content;
  if (!source) return "<p>这篇文档暂时还没有正文内容。</p>";
  return marked.parse(source) as string;
});

async function openArticle(article: KnowledgeArticleSummary) {
  detailLoading.value = true;
  activeArticle.value = { ...article, body: "" };
  try {
    activeArticle.value = await api.getKnowledgeDetail(article.id);
  } finally {
    detailLoading.value = false;
  }
}

onMounted(async () => {
  try {
    docs.value = await api.getKnowledgeList();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <PageHeader
    title="帮助中心"
    description="常见问题、客户端下载和使用说明都会整理在这里，方便您随时查看。"
  />

  <StateBlock v-if="loading" title="正在加载文档" description="正在同步帮助内容和分类信息。" />

  <div v-else class="space-y-6">
    <div class="grid gap-4 md:grid-cols-2">
      <Card class="glass-panel interactive-panel rounded-[28px] border-white/10">
        <CardContent class="p-5">
          <div class="text-sm text-[var(--muted-foreground)]">分类数量</div>
          <div class="mt-3 text-2xl font-semibold">{{ categories.length }}</div>
        </CardContent>
      </Card>
      <Card class="glass-panel interactive-panel rounded-[28px] border-white/10">
        <CardContent class="p-5">
          <div class="text-sm text-[var(--muted-foreground)]">文档篇数</div>
          <div class="mt-3 text-2xl font-semibold">{{ totalDocs }}</div>
        </CardContent>
      </Card>
    </div>

    <StateBlock v-if="!categories.length" title="暂时没有文档" description="后台尚未发布帮助文档，后续更新会显示在这里。" />

    <div v-else class="space-y-6">
      <Card v-for="[category, list] in categories" :key="category" class="glass-panel interactive-panel premium-shell rounded-[30px] border-white/10">
        <CardHeader>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle class="text-[1.45rem]">{{ category }}</CardTitle>
              <CardDescription class="mt-2">共 {{ list.length }} 篇内容</CardDescription>
            </div>
            <Badge variant="outline" class="rounded-full px-3 py-1.5">帮助分类</Badge>
          </div>
        </CardHeader>
        <CardContent class="grid gap-3">
          <button
            v-for="article in list"
            :key="article.id"
            class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
            @click="openArticle(article)"
          >
            <div class="font-medium">{{ article.title }}</div>
            <div class="mt-2 text-sm text-[var(--muted-foreground)]">{{ formatDate(article.updated_at) }}</div>
          </button>
        </CardContent>
      </Card>
    </div>
  </div>

  <Dialog :open="!!activeArticle" :modal="false" @update:open="(value) => !value && (activeArticle = null)">
    <DialogContent class="mobile-sheet max-h-[88vh] overflow-hidden rounded-[28px] sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>{{ activeArticle?.title }}</DialogTitle>
      </DialogHeader>
      <StateBlock v-if="detailLoading" title="正在加载详情" description="正在获取完整文档内容。" />
      <div v-else class="markdown-content max-h-[68vh] overflow-y-auto pr-2" v-html="articleHtml" />
      <div class="flex justify-end pt-4">
        <Button variant="outline" @click="activeArticle = null">关闭</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
