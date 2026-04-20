<script setup lang="ts">
import { CircleOff, LayoutGrid, List, RefreshCw, Search, ServerCog, ShieldCheck, Tags } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import flagDe from "@/assets/flags/4x3/de.svg";
import flagGb from "@/assets/flags/4x3/gb.svg";
import flagHk from "@/assets/flags/4x3/hk.svg";
import flagJp from "@/assets/flags/4x3/jp.svg";
import flagKr from "@/assets/flags/4x3/kr.svg";
import flagSg from "@/assets/flags/4x3/sg.svg";
import flagTw from "@/assets/flags/4x3/tw.svg";
import flagUs from "@/assets/flags/4x3/us.svg";
import PageHeader from "@/components/PageHeader.vue";
import StateBlock from "@/components/StateBlock.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import type { ServerNode } from "@/types/api";

type NodeFilter = "all" | "online" | "offline" | "tagged";
type NodeViewMode = "card" | "list";

type RegionMeta = {
  code: string;
  label: string;
  icon?: string;
  keywords: string[];
};

const loading = ref(true);
const error = ref("");
const nodes = ref<ServerNode[]>([]);
const keyword = ref("");
const filter = ref<NodeFilter>("all");
const viewMode = ref<NodeViewMode>("card");

const filterOptions: Array<{ key: NodeFilter; label: string }> = [
  { key: "all", label: "全部节点" },
  { key: "online", label: "仅看可用" },
  { key: "offline", label: "仅看异常" },
  { key: "tagged", label: "仅看有标签" },
];

const regionEntries: RegionMeta[] = [
  { code: "HK", label: "香港", icon: flagHk, keywords: ["香港", "hong kong", "harbour", "central exchange", "hk"] },
  { code: "TW", label: "台湾", icon: flagTw, keywords: ["台湾", "taiwan", "taipei", "taichung", "tw"] },
  { code: "JP", label: "日本", icon: flagJp, keywords: ["日本", "japan", "tokyo", "osaka", "fukuoka", "nagoya", "umeda", "jp"] },
  { code: "SG", label: "新加坡", icon: flagSg, keywords: ["新加坡", "singapore", "jurong", "marina bay", "orchard", "sg"] },
  { code: "US", label: "美国", icon: flagUs, keywords: ["美国", "united states", "usa", "los angeles", "new york", "broadway", "pacific", "san jose", "us"] },
  { code: "KR", label: "韩国", icon: flagKr, keywords: ["韩国", "korea", "seoul", "kr"] },
  { code: "GB", label: "英国", icon: flagGb, keywords: ["英国", "united kingdom", "london", "thames", "manchester", "uk", "gb"] },
  { code: "DE", label: "德国", icon: flagDe, keywords: ["德国", "germany", "frankfurt", "berlin", "munich", "de"] },
  { code: "FR", label: "法国", keywords: ["法国", "france", "paris", "fr"] },
  { code: "CA", label: "加拿大", keywords: ["加拿大", "canada", "toronto", "vancouver", "ca"] },
  { code: "AU", label: "澳大利亚", keywords: ["澳大利亚", "australia", "sydney", "melbourne", "au"] },
  { code: "NL", label: "荷兰", keywords: ["荷兰", "netherlands", "amsterdam", "nl"] },
];

const onlineCount = computed(() => nodes.value.filter((item) => item.is_online === 1).length);
const offlineCount = computed(() => nodes.value.filter((item) => item.is_online !== 1).length);
const taggedCount = computed(() => nodes.value.filter((item) => visibleTags(item).length > 0).length);

const filteredNodes = computed(() => {
  const search = keyword.value.trim().toLowerCase();

  return nodes.value.filter((item) => {
    const haystack = [item.name, item.type, item.protocol, ...(item.tags ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !search || haystack.includes(search);
    const matchesFilter =
      filter.value === "all"
        ? true
        : filter.value === "online"
          ? item.is_online === 1
          : filter.value === "offline"
            ? item.is_online !== 1
            : visibleTags(item).length > 0;

    return matchesSearch && matchesFilter;
  });
});

onMounted(async () => {
  await loadNodes();
});

async function loadNodes() {
  loading.value = true;
  error.value = "";
  try {
    nodes.value = await api.getNodes();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "暂时无法加载节点列表，请稍后再试。";
  } finally {
    loading.value = false;
  }
}

function regionMeta(name: string) {
  const text = name.toLowerCase();
  return regionEntries.find((entry) => entry.keywords.some((item) => text.includes(item.toLowerCase()))) ?? null;
}

function nodeInitial(name: string) {
  const clean = name.trim();
  if (!clean) return "SV";
  return clean.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase() || clean.slice(0, 2).toUpperCase();
}

function protocolLabel(node: ServerNode) {
  const value = String(node.protocol ?? "").trim();
  return value ? value.toUpperCase() : "标准节点";
}

function formatRate(rate?: number | string) {
  if (rate == null || rate === "") return "1.00 x";
  const parsed = Number(rate);
  if (Number.isNaN(parsed)) return `${String(rate)} x`;
  return `${parsed.toFixed(2)} x`;
}

function visibleTags(node: ServerNode) {
  const nodeName = String(node.name ?? "").trim().toLowerCase();
  const nodeType = String(node.type ?? "").trim().toLowerCase();
  const protocol = String(node.protocol ?? "").trim().toLowerCase();

  return (node.tags ?? [])
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .filter((tag) => {
      const lower = tag.toLowerCase();

      if (lower === "v2node") return false;
      if (lower === nodeType || lower === protocol) return false;
      if (nodeName.includes(lower)) return false;
      if (regionEntries.some((entry) => lower === entry.label.toLowerCase() || entry.keywords.includes(lower))) return false;

      return true;
    })
    .slice(0, 3);
}

function onlineLabel(isOnline?: number) {
  return isOnline === 1 ? "在线" : "离线";
}

function onlineTone(isOnline?: number) {
  return isOnline === 1 ? "secondary" : "outline";
}

function onlineBadgeClass(isOnline?: number) {
  return isOnline === 1
    ? "border-emerald-200/90 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-300"
    : "border-slate-200/90 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
}

function tagClass(tag: string) {
  const value = tag.toLowerCase();
  if (value.includes("netflix")) return "border-rose-200/90 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/12 dark:text-rose-300";
  if (value.includes("youtube")) return "border-red-200/90 bg-red-50 text-red-600 dark:border-red-500/30 dark:bg-red-500/12 dark:text-red-300";
  if (value.includes("chatgpt")) return "border-emerald-200/90 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/12 dark:text-emerald-300";
  if (value.includes("claude")) return "border-amber-200/90 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/12 dark:text-amber-300";
  if (value.includes("gemini")) return "border-violet-200/90 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/12 dark:text-violet-300";
  if (value.includes("disney")) return "border-blue-200/90 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/12 dark:text-blue-300";
  return "border-slate-200/90 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300";
}
</script>

<template>
  <PageHeader title="节点列表" description="支持搜索、筛选与视图切换，节点信息保持更简洁的展示方式。" />

  <div class="mb-6 grid gap-4 lg:grid-cols-4">
    <Card class="glass-panel premium-shell overflow-hidden rounded-[28px] border-white/10">
      <CardContent class="flex items-center gap-3 p-5">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]">
          <ServerCog class="h-5 w-5 text-[var(--primary)]" />
        </div>
        <div>
          <div class="text-sm text-[var(--muted-foreground)]">节点总数</div>
          <div class="mt-2 text-2xl font-semibold">{{ nodes.length }}</div>
        </div>
      </CardContent>
    </Card>

    <Card class="glass-panel premium-shell overflow-hidden rounded-[28px] border-white/10">
      <CardContent class="flex items-center gap-3 p-5">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]">
          <ShieldCheck class="h-5 w-5 text-[var(--primary)]" />
        </div>
        <div>
          <div class="text-sm text-[var(--muted-foreground)]">在线节点</div>
          <div class="mt-2 text-2xl font-semibold">{{ onlineCount }}</div>
        </div>
      </CardContent>
    </Card>

    <Card class="glass-panel premium-shell overflow-hidden rounded-[28px] border-white/10">
      <CardContent class="flex items-center gap-3 p-5">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]">
          <CircleOff class="h-5 w-5 text-[var(--primary)]" />
        </div>
        <div>
          <div class="text-sm text-[var(--muted-foreground)]">异常节点</div>
          <div class="mt-2 text-2xl font-semibold">{{ offlineCount }}</div>
        </div>
      </CardContent>
    </Card>

    <Card class="glass-panel premium-shell overflow-hidden rounded-[28px] border-white/10">
      <CardContent class="flex items-center gap-3 p-5">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]">
          <Tags class="h-5 w-5 text-[var(--primary)]" />
        </div>
        <div>
          <div class="text-sm text-[var(--muted-foreground)]">有标签节点</div>
          <div class="mt-2 text-2xl font-semibold">{{ taggedCount }}</div>
        </div>
      </CardContent>
    </Card>
  </div>

  <Card class="glass-panel premium-shell overflow-hidden rounded-[30px] border-white/10">
    <CardContent class="space-y-4 p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="max-w-xl">
          <div class="text-lg font-semibold">节点列表</div>
          <div class="mt-1 text-sm text-[var(--muted-foreground)]">支持按节点名称搜索，也可以切换卡片与列表视图。</div>
        </div>

        <div class="grid w-full gap-2 sm:w-auto sm:grid-cols-[auto_auto]">
          <div class="inline-grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-[var(--surface-elevated)] p-1">
            <Button :variant="viewMode === 'card' ? 'default' : 'ghost'" size="sm" class="rounded-xl px-3" @click="viewMode = 'card'">
              <LayoutGrid class="h-4 w-4" />
              卡片式
            </Button>
            <Button :variant="viewMode === 'list' ? 'default' : 'ghost'" size="sm" class="rounded-xl px-3" @click="viewMode = 'list'">
              <List class="h-4 w-4" />
              列表式
            </Button>
          </div>
          <Button variant="outline" class="rounded-full px-4" @click="loadNodes">
            <RefreshCw class="h-4 w-4" />
            立即刷新
          </Button>
        </div>
      </div>

      <div class="relative">
        <Search class="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[var(--muted-foreground)]" />
        <Input v-model="keyword" class="h-11 rounded-2xl bg-[var(--surface-elevated)] pl-9" placeholder="搜索节点名称、协议类型或标签" />
      </div>

      <div class="flex flex-wrap gap-2">
        <Button
          v-for="item in filterOptions"
          :key="item.key"
          :variant="filter === item.key ? 'default' : 'outline'"
          class="rounded-2xl px-4"
          @click="filter = item.key"
        >
          {{ item.label }}
        </Button>
      </div>

      <StateBlock v-if="loading" title="正在加载节点" description="正在同步节点列表与在线状态。" />
      <StateBlock v-else-if="error" title="加载失败" :description="error" />
      <StateBlock v-else-if="!filteredNodes.length" title="暂无节点" description="当前筛选条件下没有匹配的节点。" />

      <div v-else-if="viewMode === 'card'" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <Card
          v-for="node in filteredNodes"
          :key="node.id"
          class="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
        >
          <CardContent class="p-4">
            <div class="absolute right-4 top-4">
              <Badge :variant="onlineTone(node.is_online)" :class="onlineBadgeClass(node.is_online)" class="rounded-full px-2.5 py-1 text-[11px]">
                {{ onlineLabel(node.is_online) }}
              </Badge>
            </div>

            <div class="flex items-start gap-3 pr-14">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-white/90 text-lg font-semibold shadow-[0_10px_30px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/8 dark:shadow-none">
                <img
                  v-if="regionMeta(node.name)?.icon"
                  :src="regionMeta(node.name)?.icon"
                  :alt="regionMeta(node.name)?.label"
                  :title="regionMeta(node.name)?.label"
                  class="h-full w-full object-cover"
                  loading="lazy"
                />
                <span v-else>{{ nodeInitial(node.name) }}</span>
              </div>

              <div class="min-w-0">
                <div class="line-clamp-2 text-[18px] font-semibold leading-6 text-[var(--foreground)]">
                  {{ node.name }}
                </div>
                <div class="mt-1 text-xs tracking-[0.12em] text-[var(--muted-foreground)]">
                  {{ protocolLabel(node) }}
                </div>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <div class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm dark:bg-background/60 dark:text-foreground">
                <span class="text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Rate</span>
                <span class="text-sm font-semibold">{{ formatRate(node.rate) }}</span>
              </div>
            </div>

            <div class="mt-3 flex min-h-7 flex-wrap gap-1.5">
              <Badge
                v-for="tag in visibleTags(node)"
                :key="`${node.id}-${tag}`"
                variant="outline"
                :class="tagClass(tag)"
                class="rounded-full px-2.5 py-1 text-[11px]"
              >
                {{ tag }}
              </Badge>
              <span v-if="!visibleTags(node).length" class="text-xs text-[var(--muted-foreground)]">暂无附加标签</span>
            </div>

            <div class="mt-4 text-[12px] leading-5 text-[var(--muted-foreground)]">
              {{ node.is_online === 1 ? "节点当前可用，可正常分配到订阅中。" : "节点当前离线，建议稍后重试或切换其他节点。" }}
            </div>
          </CardContent>
        </Card>
      </div>

      <div v-else class="space-y-3">
        <Card
          v-for="node in filteredNodes"
          :key="`list-${node.id}`"
          class="overflow-hidden rounded-[22px] border border-white/10 bg-[var(--surface-elevated)]"
        >
          <CardContent class="p-4">
            <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div class="space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <div class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-white/90 text-base font-semibold shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/8 dark:shadow-none">
                    <img
                      v-if="regionMeta(node.name)?.icon"
                      :src="regionMeta(node.name)?.icon"
                      :alt="regionMeta(node.name)?.label"
                      :title="regionMeta(node.name)?.label"
                      class="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <span v-else>{{ nodeInitial(node.name) }}</span>
                  </div>
                  <div class="text-lg font-semibold text-[var(--foreground)]">{{ node.name }}</div>
                  <Badge :variant="onlineTone(node.is_online)" :class="onlineBadgeClass(node.is_online)" class="rounded-full px-2.5 py-1 text-[11px]">
                    {{ onlineLabel(node.is_online) }}
                  </Badge>
                  <Badge variant="outline" class="rounded-full px-2.5 py-1 text-[11px]">
                    RATE {{ formatRate(node.rate) }}
                  </Badge>
                </div>

                <div class="text-sm text-[var(--muted-foreground)]">
                  {{ protocolLabel(node) }}
                </div>

                <div class="flex min-h-7 flex-wrap gap-1.5">
                  <Badge
                    v-for="tag in visibleTags(node)"
                    :key="`${node.id}-list-${tag}`"
                    variant="outline"
                    :class="tagClass(tag)"
                    class="rounded-full px-2.5 py-1 text-[11px]"
                  >
                    {{ tag }}
                  </Badge>
                  <span v-if="!visibleTags(node).length" class="text-xs text-[var(--muted-foreground)]">暂无附加标签</span>
                </div>
              </div>

              <div class="text-sm text-[var(--muted-foreground)] xl:max-w-56 xl:text-right">
                {{ node.is_online === 1 ? "节点当前可用，可正常分配到订阅中。" : "节点当前离线，建议稍后重试或切换其他节点。" }}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CardContent>
  </Card>
</template>
