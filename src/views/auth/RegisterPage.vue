<script setup lang="ts">
import { LoaderCircle, MailCheck, Sparkles } from "lucide-vue-next";
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import { useAuthStore } from "@/stores/auth";
import AuthFrame from "@/views/auth/AuthFrame.vue";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const loading = ref(false);
const sending = ref(false);
const countdown = ref(0);
const form = reactive({ email: "", code: "", password: "", inviteCode: "" });
const disabled = computed(() => !form.email.trim() || !form.password.trim());

onMounted(() => {
  const inviteCode = route.query.code ?? route.query.invite_code ?? route.query.inviteCode;
  if (typeof inviteCode === "string" && inviteCode.trim()) {
    form.inviteCode = inviteCode.trim();
  }
});

async function sendCode() {
  sending.value = true;
  try {
    await api.sendEmailCode({ email: form.email });
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value -= 1;
      if (countdown.value <= 0) clearInterval(timer);
    }, 1000);
    toast.success("验证码已发送。");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "发送失败，请稍后重试。");
  } finally {
    sending.value = false;
  }
}

async function onSubmit() {
  loading.value = true;
  try {
    await api.register({
      email: form.email,
      password: form.password,
      invite_code: form.inviteCode || undefined,
      email_code: form.code || undefined,
    });
    await auth.login(form.email, form.password);
    toast.success("注册成功。");
    router.push("/dashboard");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "注册失败，请稍后再试。");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthFrame>
    <Card class="glass-panel interactive-panel premium-shell rounded-[32px] border-white/10 shadow-[var(--shadow-card)]">
      <CardHeader class="space-y-4 p-7 pb-4">
        <div class="flex items-center justify-between gap-3">
          <Badge variant="secondary" class="rounded-full px-3 py-1">创建账户</Badge>
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface-elevated)]">
            <Sparkles class="h-4 w-4 text-[var(--primary)]" />
          </div>
        </div>
        <div>
          <CardTitle class="text-3xl tracking-tight">注册新账户</CardTitle>
          <CardDescription class="mt-2 text-sm leading-6">
            完成注册后将自动进入用户中心，您可以立即查看套餐、复制订阅链接并开始使用服务。
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent class="space-y-6 p-7 pt-2">
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-2">
            <label class="text-sm font-medium text-[var(--foreground)]">邮箱</label>
            <Input v-model="form.email" type="email" placeholder="name@example.com" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-[var(--foreground)]">邮箱验证码</label>
              <Badge variant="outline" class="rounded-full px-2.5 py-1">按站点配置启用</Badge>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row">
              <Input v-model="form.code" placeholder="输入邮箱验证码" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
              <Button
                type="button"
                variant="outline"
                class="h-11 rounded-2xl px-4 sm:w-auto"
                :disabled="sending || countdown > 0 || !form.email.trim()"
                @click="sendCode"
              >
                <MailCheck class="h-4 w-4" />
                {{ countdown > 0 ? `${countdown}s` : "发送验证码" }}
              </Button>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <label class="text-sm font-medium text-[var(--foreground)]">密码</label>
              <Input v-model="form.password" type="password" placeholder="建议至少 8 位" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium text-[var(--foreground)]">邀请码</label>
              <Input v-model="form.inviteCode" placeholder="选填，打开邀请链接后会自动带入" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
            </div>
          </div>

          <Button class="hero-cta h-11 w-full rounded-2xl" type="submit" :disabled="disabled || loading">
            <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />
            <span v-else>注册并进入用户中心</span>
          </Button>
        </form>

        <div class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
          <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">快速开始</div>
          <div class="mt-2 text-sm leading-6 text-[var(--foreground)]">
            完成注册后会自动登录并进入用户中心，您可以立刻查看套餐状态、订阅入口和常用功能。
          </div>
        </div>

        <div class="text-center text-sm text-[var(--muted-foreground)]">
          已有账户？
          <RouterLink to="/login" class="font-medium text-[var(--primary)] transition hover:opacity-80">去登录</RouterLink>
        </div>
      </CardContent>
    </Card>
  </AuthFrame>
</template>
