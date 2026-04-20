<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { toast } from "vue-sonner";
import PageHeader from "@/components/PageHeader.vue";
import StateBlock from "@/components/StateBlock.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { api } from "@/services/api";
import type { Ticket, TicketMessage } from "@/types/api";

const loading = ref(true);
const detailLoading = ref(false);
const error = ref("");
const tickets = ref<Ticket[]>([]);
const messages = ref<TicketMessage[]>([]);
const selectedTicket = ref<Ticket | null>(null);
const createOpen = ref(false);
const closeOpen = ref(false);
const sendingReply = ref(false);
const creating = ref(false);
const replyText = ref("");
const createError = ref("");
const replyError = ref("");
const form = ref({ subject: "", message: "", level: 1 });

const sortedTickets = computed(() => [...tickets.value].sort((a, b) => b.updated_at - a.updated_at));
const activeCount = computed(() => tickets.value.filter((item) => item.status === 0).length);
const closedCount = computed(() => tickets.value.filter((item) => item.status === 1).length);
const canReply = computed(() => selectedTicket.value?.status === 0);

function statusMeta(status: number) {
  if (status === 0) return { label: "已开启", variant: "secondary" as const };
  if (status === 1) return { label: "已关闭", variant: "outline" as const };
  return { label: `状态 ${status}`, variant: "outline" as const };
}

function levelMeta(level: number) {
  if (level === 0) return "低";
  if (level === 1) return "中";
  if (level === 2) return "高";
  return String(level);
}

async function refresh() {
  loading.value = true;
  try {
    tickets.value = await api.getTickets();
    error.value = "";
    if (!selectedTicket.value && tickets.value.length) {
      await selectTicket(sortedTickets.value[0]!);
    } else if (selectedTicket.value) {
      const next = tickets.value.find((item) => item.id === selectedTicket.value?.id);
      if (next) selectedTicket.value = next;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载失败。";
  } finally {
    loading.value = false;
  }
}

async function selectTicket(ticket: Ticket) {
  selectedTicket.value = ticket;
  detailLoading.value = true;
  replyError.value = "";
  try {
    const detail = await api.getTicketDetail(ticket.id);
    messages.value = detail.messages ?? [];
    selectedTicket.value = detail.ticket ?? ticket;
  } catch (err) {
    const message = err instanceof Error ? err.message : "工单详情加载失败。";
    toast.error(message);
  } finally {
    detailLoading.value = false;
  }
}

async function submit() {
  creating.value = true;
  createError.value = "";
  try {
    await api.createTicket(form.value);
    toast.success("工单已创建。");
    createOpen.value = false;
    form.value = { subject: "", message: "", level: 1 };
    await refresh();
  } catch (err) {
    const message = err instanceof Error ? err.message : "工单创建失败，请稍后重试。";
    createError.value = message;
    toast.error(message);
  } finally {
    creating.value = false;
  }
}

async function sendReply() {
  if (!selectedTicket.value || !replyText.value.trim() || selectedTicket.value.status !== 0) return;
  sendingReply.value = true;
  replyError.value = "";
  try {
    await api.replyTicket(selectedTicket.value.id, replyText.value.trim());
    replyText.value = "";
    toast.success("回复已发送。");
    await selectTicket(selectedTicket.value);
    await refresh();
  } catch (err) {
    const message = err instanceof Error ? err.message : "回复失败，请稍后再试。";
    replyError.value = message;
    toast.error(message);
  } finally {
    sendingReply.value = false;
  }
}

async function closeTicket() {
  if (!selectedTicket.value) return;
  try {
    await api.closeTicket(selectedTicket.value.id);
    closeOpen.value = false;
    toast.success("工单已关闭。");
    await refresh();
    const next = tickets.value.find((item) => item.id === selectedTicket.value?.id);
    if (next) await selectTicket(next);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "关闭失败，请稍后再试。");
  }
}

onMounted(refresh);
</script>

<template>
  <PageHeader
    title="工单"
    description="在这里查看工单进度、会话记录，并继续与支持团队沟通。"
  />

  <div class="mb-6 grid gap-4 lg:grid-cols-3">
    <Card class="glass-panel interactive-panel stat-card overflow-hidden rounded-[28px] border-white/10 lg:col-span-2">
      <CardContent class="relative p-0">
        <div class="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_72%)]" />
        <div class="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">工单总数</div>
            <div class="mt-2 text-2xl font-semibold">{{ tickets.length }}</div>
          </div>
          <Button class="rounded-full px-5" @click="createOpen = true">新建工单</Button>
        </div>
      </CardContent>
    </Card>

    <Card class="glass-panel interactive-panel stat-card overflow-hidden rounded-[28px] border-white/10">
      <CardContent class="relative p-0">
        <div class="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(76,201,240,0.14),transparent_72%)]" />
        <div class="relative flex items-center justify-between p-5">
          <div>
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">处理中</div>
            <div class="mt-2 text-2xl font-semibold">{{ activeCount }}</div>
          </div>
          <Badge variant="outline" class="rounded-full px-3 py-1.5">已关闭 {{ closedCount }}</Badge>
        </div>
      </CardContent>
    </Card>
  </div>

  <StateBlock v-if="loading" title="正在加载工单" description="正在同步最近的工单列表和会话内容。" />
  <StateBlock v-else-if="error" title="工单加载失败" :description="error" />

  <div v-else class="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
    <Card class="glass-panel interactive-panel premium-shell spotlight-panel overflow-hidden rounded-[30px] border-white/10">
      <CardContent class="relative p-0">
        <div class="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(120,119,255,0.16),transparent_72%)]" />
        <div class="relative p-6">
          <div class="mb-5">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">工单列表</div>
            <div class="mt-3 text-2xl font-semibold">最近会话</div>
            <div class="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">按最近更新时间排序，方便您快速继续处理对话。</div>
          </div>

          <StateBlock v-if="!sortedTickets.length" title="暂无工单" description="现在还没有工单记录，可以创建第一条工单。">
            <Button class="rounded-full px-5" @click="createOpen = true">创建工单</Button>
          </StateBlock>

          <div v-else class="space-y-3">
            <button
              v-for="ticket in sortedTickets"
              :key="ticket.id"
              class="w-full rounded-[24px] border p-4 text-left transition-all duration-200"
              :class="
                selectedTicket?.id === ticket.id
                  ? 'dashboard-subpanel border-[color:color-mix(in_srgb,var(--primary)_34%,var(--border))] bg-[var(--surface)] shadow-[var(--shadow-soft)]'
                  : 'dashboard-subpanel border-white/10 bg-[var(--surface-elevated)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]'
              "
              @click="selectTicket(ticket)"
            >
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <div class="truncate font-medium">{{ ticket.subject }}</div>
                  <div class="mt-2 text-xs text-muted-foreground">{{ formatDate(ticket.updated_at) }}</div>
                </div>
                <div class="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  <Badge :variant="statusMeta(ticket.status).variant" class="rounded-full px-2.5 py-1">
                    {{ statusMeta(ticket.status).label }}
                  </Badge>
                  <Badge variant="outline" class="rounded-full px-2.5 py-1">优先级 {{ levelMeta(ticket.level) }}</Badge>
                </div>
              </div>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="glass-panel interactive-panel premium-shell spotlight-panel overflow-hidden rounded-[30px] border-white/10">
      <CardContent class="relative p-0">
        <div class="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(76,201,240,0.16),transparent_72%)]" />
        <div class="relative p-6">
          <div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">会话详情</div>
              <div class="mt-3 text-2xl font-semibold">{{ selectedTicket?.subject ?? "选择一条工单查看详情" }}</div>
              <div v-if="selectedTicket" class="mt-2 text-sm text-[var(--muted-foreground)]">创建于 {{ formatDate(selectedTicket.created_at) }}</div>
            </div>
            <Button
              v-if="selectedTicket && selectedTicket.status === 0"
              variant="destructive"
              size="sm"
              class="rounded-full px-4"
              @click="closeOpen = true"
            >
              关闭工单
            </Button>
          </div>

          <StateBlock v-if="!selectedTicket" title="尚未选择工单" description="从左侧选择一条工单后，就可以查看历史会话并继续回复。" />
          <StateBlock v-else-if="detailLoading" title="正在加载会话" description="正在获取工单消息记录。" />

          <template v-else>
            <div class="space-y-3">
              <div
                v-for="message in messages"
                :key="message.id"
                class="rounded-[24px] border p-4"
                :class="message.is_admin ? 'dashboard-subpanel border-white/10 bg-[var(--surface-elevated)]' : 'dashboard-subpanel border-[color:color-mix(in_srgb,var(--primary)_24%,var(--border))] bg-[var(--surface)]'"
              >
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div class="text-sm font-medium">{{ message.is_admin ? "客服" : "用户" }}</div>
                  <div class="text-xs text-muted-foreground">{{ formatDate(message.created_at) }}</div>
                </div>
                <Separator class="my-3" />
                <div class="whitespace-pre-wrap text-sm leading-6">{{ message.message }}</div>
              </div>
              <StateBlock v-if="!messages.length" title="暂无消息记录" description="这个工单还没有更多会话内容。" />
            </div>

            <div v-if="canReply" class="dashboard-subpanel mt-4 space-y-3 rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
              <div class="text-sm font-medium">继续回复</div>
              <Textarea
                v-model="replyText"
                placeholder="补充问题细节、错误信息或截图说明。"
                class="min-h-28 rounded-[20px]"
                @input="replyError = ''"
              />
              <p v-if="replyError" class="text-sm text-rose-500">{{ replyError }}</p>
              <div class="flex justify-end">
                <Button class="rounded-full px-5" :disabled="sendingReply || !replyText.trim()" @click="sendReply">发送回复</Button>
              </div>
            </div>

            <StateBlock
              v-else
              class="mt-4"
              title="工单已关闭"
              description="该工单当前不可继续回复，如有新问题请重新创建工单。"
            />
          </template>
        </div>
      </CardContent>
    </Card>
  </div>

  <Dialog :open="createOpen" @update:open="createOpen = $event">
    <DialogContent class="rounded-[28px] sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>新建工单</DialogTitle>
        <DialogDescription>请尽量写清问题场景、客户端和复现步骤，方便更快处理。</DialogDescription>
      </DialogHeader>
      <div class="space-y-4">
        <Input v-model="form.subject" placeholder="工单主题" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
        <Input v-model="form.level" type="number" placeholder="优先级 0-2" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
        <Textarea v-model="form.message" placeholder="请描述问题、设备环境与复现步骤" class="min-h-32 rounded-[20px]" />
        <p v-if="createError" class="text-sm text-rose-500">{{ createError }}</p>
      </div>
      <DialogFooter class="gap-2 sm:justify-end">
        <Button variant="outline" @click="createOpen = false">取消</Button>
        <Button :disabled="creating || !form.subject || !form.message" @click="submit">提交</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog :open="closeOpen" @update:open="closeOpen = $event">
    <DialogContent class="rounded-[28px]">
      <DialogHeader>
        <DialogTitle>关闭工单</DialogTitle>
        <DialogDescription>关闭后该工单将不再接收新的回复，确认继续吗？</DialogDescription>
      </DialogHeader>
      <DialogFooter class="gap-2 sm:justify-end">
        <Button variant="outline" @click="closeOpen = false">返回</Button>
        <Button variant="destructive" @click="closeTicket">确认关闭</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
