<script setup lang="ts">
import { Bot, MonitorSmartphone, Shield, UserCircle2 } from "lucide-vue-next";
import { computed, onMounted, reactive, ref } from "vue";
import { toast } from "vue-sonner";
import PageHeader from "@/components/PageHeader.vue";
import StateBlock from "@/components/StateBlock.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/services/api";
import type { ActiveSession, CommConfig, SubscribeInfo, TelegramBotInfo, UserInfo } from "@/types/api";

const loading = ref(true);
const error = ref("");
const user = ref<UserInfo | null>(null);
const subscribe = ref<SubscribeInfo | null>(null);
const commConfig = ref<CommConfig | null>(null);
const sessions = ref<ActiveSession[]>([]);
const telegram = ref<TelegramBotInfo | null>(null);

const remind = reactive({ expire: false, traffic: false });
const password = reactive({ oldPassword: "", newPassword: "" });
const pending = reactive({
  remind: false,
  password: false,
  security: false,
});

const showTelegram = computed(() => commConfig.value?.telegram_discuss_link || telegram.value?.username || telegram.value?.link);
const telegramBotUrl = computed(() => {
  if (telegram.value?.link) return telegram.value.link;
  if (telegram.value?.username) return `https://t.me/${telegram.value.username}`;
  return "#";
});
const avatarFallback = computed(() => user.value?.email?.slice(0, 1).toUpperCase() ?? "U");
const recentSessions = computed(() => sessions.value.slice(0, 2));

onMounted(async () => {
  try {
    const [userInfo, subInfo, configInfo, activeSessions, botInfo] = await Promise.all([
      api.getUserInfo().catch(() => null),
      api.getSubscribe().catch(() => null),
      api.getCommConfig().catch(() => null),
      api.getActiveSessions().catch(() => []),
      api.getTelegramBotInfo().catch(() => null),
    ]);

    user.value = userInfo;
    subscribe.value = subInfo;
    commConfig.value = configInfo;
    sessions.value = activeSessions;
    telegram.value = botInfo;
    remind.expire = userInfo?.remind_expire === 1;
    remind.traffic = userInfo?.remind_traffic === 1;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "暂时无法加载设置，请稍后再试。";
  } finally {
    loading.value = false;
  }
});

async function saveRemind() {
  pending.remind = true;
  try {
    await api.updateUser({ remind_expire: remind.expire ? 1 : 0, remind_traffic: remind.traffic ? 1 : 0 });
    toast.success("提醒设置已更新。");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "暂时无法保存提醒设置。");
  } finally {
    pending.remind = false;
  }
}

async function submitPassword() {
  pending.password = true;
  try {
    await api.changePassword({ old_password: password.oldPassword, new_password: password.newPassword });
    toast.success("密码已更新。");
    password.oldPassword = "";
    password.newPassword = "";
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "暂时无法修改密码。");
  } finally {
    pending.password = false;
  }
}

async function resetSecurity() {
  pending.security = true;
  try {
    await api.resetSecurity();
    toast.success("订阅信息已刷新。");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "暂时无法刷新订阅信息。");
  } finally {
    pending.security = false;
  }
}

function sessionDeviceLabel(ua = "") {
  if (!ua) return "未知设备";
  if (/iphone|ipad|ios/i.test(ua)) return "iPhone / iPad";
  if (/android/i.test(ua)) return "Android";
  if (/mac/i.test(ua)) return "macOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/linux/i.test(ua)) return "Linux";
  return ua.slice(0, 42);
}
</script>

<template>
  <PageHeader
    title="个人设置"
    description="在这里管理提醒、密码、订阅刷新和常用联系入口。"
  />

  <StateBlock v-if="loading" title="正在加载设置" description="正在同步账户资料、订阅状态和常用设置。" />
  <StateBlock v-else-if="error" title="加载失败" :description="error" />

  <div v-else class="space-y-6">
    <div class="grid gap-4 md:grid-cols-4">
      <Card class="glass-panel interactive-panel stat-card overflow-hidden rounded-[28px] border-white/10 md:col-span-2">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_72%)]" />
          <div class="relative flex items-center gap-4 p-5">
            <div class="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface-elevated)] text-lg font-semibold shadow-[var(--shadow-soft)]">
              <img v-if="user?.avatar_url" :src="user.avatar_url" :alt="user.email" class="h-full w-full object-cover">
              <span v-else>{{ avatarFallback }}</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <div class="truncate text-lg font-semibold">{{ user?.email ?? "未登录" }}</div>
                <Badge variant="outline" class="rounded-full px-2.5 py-1">{{ subscribe?.plan?.name ?? "未开通套餐" }}</Badge>
              </div>
              <div class="mt-1 text-sm text-[var(--muted-foreground)]">注册时间：{{ formatDate(user?.created_at) }}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel interactive-panel stat-card overflow-hidden rounded-[28px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(76,201,240,0.14),transparent_72%)]" />
          <div class="relative p-5">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">账户余额</div>
            <div class="mt-2 text-2xl font-semibold">{{ formatCurrency(user?.balance ?? 0, commConfig?.currency ?? "CNY") }}</div>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel interactive-panel stat-card overflow-hidden rounded-[28px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.14),transparent_72%)]" />
          <div class="relative p-5">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">到期时间</div>
            <div class="mt-2 text-base font-medium">{{ formatDate(subscribe?.expired_at) }}</div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 xl:grid-cols-2">
      <Card class="glass-panel interactive-panel premium-shell spotlight-panel overflow-hidden rounded-[30px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(120,119,255,0.16),transparent_72%)]" />
          <div class="relative p-6">
            <div class="mb-5 flex items-center gap-3">
              <Shield class="h-5 w-5 text-primary" />
              <div>
                <div class="text-2xl font-semibold">提醒与账户安全</div>
                <div class="mt-1 text-sm text-[var(--muted-foreground)]">把常用提醒和安全操作集中在一起，方便随时调整。</div>
              </div>
            </div>

            <div class="space-y-4">
              <button class="dashboard-subpanel flex w-full items-center justify-between rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] px-4 py-4 text-left transition hover:shadow-[var(--shadow-soft)]" @click="remind.expire = !remind.expire">
                <div>
                  <div class="font-medium">到期提醒</div>
                  <div class="mt-1 text-sm text-[var(--muted-foreground)]">在套餐快到期时提前提醒您，避免影响继续使用。</div>
                </div>
                <Badge :variant="remind.expire ? 'secondary' : 'outline'" class="rounded-full px-3 py-1.5">{{ remind.expire ? "已开启" : "已关闭" }}</Badge>
              </button>

              <button class="dashboard-subpanel flex w-full items-center justify-between rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] px-4 py-4 text-left transition hover:shadow-[var(--shadow-soft)]" @click="remind.traffic = !remind.traffic">
                <div>
                  <div class="font-medium">流量提醒</div>
                  <div class="mt-1 text-sm text-[var(--muted-foreground)]">在流量快用完时提前提醒您，方便及时处理。</div>
                </div>
                <Badge :variant="remind.traffic ? 'secondary' : 'outline'" class="rounded-full px-3 py-1.5">{{ remind.traffic ? "已开启" : "已关闭" }}</Badge>
              </button>

              <div class="grid gap-3 sm:grid-cols-2">
                <Input v-model="password.oldPassword" type="password" placeholder="当前密码" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
                <Input v-model="password.newPassword" type="password" placeholder="新密码" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
              </div>

              <div class="flex flex-wrap gap-3">
                <Button variant="outline" class="rounded-full px-4" :disabled="pending.remind" @click="saveRemind">保存提醒设置</Button>
                <Button class="rounded-full px-4" :disabled="pending.password || !password.oldPassword || !password.newPassword" @click="submitPassword">更新密码</Button>
                <Button variant="destructive" class="rounded-full px-4" :disabled="pending.security" @click="resetSecurity">刷新订阅信息</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel interactive-panel premium-shell spotlight-panel overflow-hidden rounded-[30px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(76,201,240,0.16),transparent_72%)]" />
          <div class="relative p-6">
            <div class="mb-5 flex items-center gap-3">
              <Bot class="h-5 w-5 text-primary" />
              <div>
                <div class="text-2xl font-semibold">联系入口</div>
                <div class="mt-1 text-sm text-[var(--muted-foreground)]">如果您常用 Telegram，可以在这里快速进入讨论群或机器人。</div>
              </div>
            </div>

            <div class="space-y-4 text-sm">
              <div class="flex items-center gap-3">
                <Bot class="h-4 w-4 text-primary" />
                <span>Telegram</span>
                <Badge v-if="commConfig?.telegram_discuss_link" variant="outline" class="rounded-full px-2.5 py-1">可用</Badge>
              </div>

              <div class="flex flex-wrap gap-3">
                <Button v-if="commConfig?.telegram_discuss_link" variant="outline" class="rounded-full px-4" as-child>
                  <a :href="commConfig.telegram_discuss_link" target="_blank" rel="noreferrer">打开讨论群</a>
                </Button>
                <Button v-if="showTelegram" variant="outline" class="rounded-full px-4" as-child>
                  <a :href="telegramBotUrl" target="_blank" rel="noreferrer">打开机器人</a>
                </Button>
              </div>

              <div class="text-xs leading-6 text-muted-foreground">如果当前没有 Telegram 信息，这里会自动保持为空，不影响其他设置。</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card class="glass-panel interactive-panel premium-shell spotlight-panel overflow-hidden rounded-[30px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(120,119,255,0.12),transparent_72%)]" />
          <div class="relative p-6">
            <div class="mb-5 flex items-center gap-3">
              <MonitorSmartphone class="h-5 w-5 text-primary" />
              <div>
                <div class="text-2xl font-semibold">最近登录设备</div>
                <div class="mt-1 text-sm text-[var(--muted-foreground)]">这里只展示最近 2 个设备，方便您快速确认登录情况。</div>
              </div>
            </div>

            <StateBlock v-if="!recentSessions.length" title="暂无设备记录" description="最近还没有可展示的登录设备信息。" />

            <div
              v-for="(session, index) in recentSessions"
              :key="`${session.auth_data ?? 'session'}-${index}`"
              class="dashboard-subpanel rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4 transition hover:shadow-[var(--shadow-soft)]"
            >
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div class="font-medium">{{ sessionDeviceLabel(session.ua) }}</div>
                  <div class="mt-1 text-xs leading-6 text-muted-foreground">{{ session.ua || "未返回设备信息" }}</div>
                </div>
                <div class="text-sm text-muted-foreground">
                  <div>{{ session.ip || "未知 IP" }}</div>
                  <div>{{ formatDate(session.login_at) }}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="glass-panel interactive-panel premium-shell spotlight-panel overflow-hidden rounded-[30px] border-white/10">
        <CardContent class="relative p-0">
          <div class="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_72%)]" />
          <div class="relative p-6">
            <div class="mb-5 flex items-center gap-3">
              <UserCircle2 class="h-5 w-5 text-primary" />
              <div>
                <div class="text-2xl font-semibold">账户摘要</div>
                <div class="mt-1 text-sm text-[var(--muted-foreground)]">这里可以快速查看套餐、提现和订阅状态等关键信息。</div>
              </div>
            </div>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between gap-4"><span class="text-muted-foreground">当前套餐</span><span class="text-right">{{ subscribe?.plan?.name ?? "未开通" }}</span></div>
              <div class="flex justify-between gap-4"><span class="text-muted-foreground">设备限制</span><span class="text-right">{{ subscribe?.device_limit ?? user?.device_limit ?? "不限" }}</span></div>
              <div class="flex justify-between gap-4"><span class="text-muted-foreground">订阅状态</span><span class="text-right">{{ subscribe?.subscribe_url ? "已准备好" : "暂未准备好" }}</span></div>
              <div class="flex justify-between gap-4"><span class="text-muted-foreground">货币单位</span><span class="text-right">{{ commConfig?.currency_symbol ?? "¥" }} / {{ commConfig?.currency ?? "CNY" }}</span></div>
              <div class="flex justify-between gap-4"><span class="text-muted-foreground">提现状态</span><span class="text-right">{{ commConfig?.withdraw_close === 1 ? "暂未开放" : "可用" }}</span></div>
              <div class="flex justify-between gap-4"><span class="text-muted-foreground">提现方式</span><span class="text-right">{{ commConfig?.withdraw_methods?.join(" / ") || "暂未开放" }}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
