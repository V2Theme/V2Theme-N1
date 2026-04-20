<script setup lang="ts">
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-vue-next";
import { computed, reactive, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { toast } from "vue-sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth";
import AuthFrame from "@/views/auth/AuthFrame.vue";

const auth = useAuthStore();
const router = useRouter();
const loading = ref(false);
const form = reactive({ email: "", password: "" });
const canSubmit = computed(() => form.email.trim() && form.password.trim());

async function onSubmit() {
  loading.value = true;
  try {
    await auth.login(form.email, form.password);
    toast.success("登录成功。");
    router.push("/dashboard");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "登录失败，请稍后再试。");
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
          <Badge variant="secondary" class="rounded-full px-3 py-1">欢迎回来</Badge>
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface-elevated)]">
            <ShieldCheck class="h-4 w-4 text-[var(--primary)]" />
          </div>
        </div>
        <div>
          <CardTitle class="text-3xl tracking-tight">登录您的账户</CardTitle>
          <CardDescription class="mt-2 text-sm leading-6">
            登录后即可继续查看订阅、订单、钱包余额与服务状态，常用入口都会统一集中在用户中心中。
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
              <label class="text-sm font-medium text-[var(--foreground)]">密码</label>
              <RouterLink to="/forgot-password" class="text-xs text-[var(--primary)] transition hover:opacity-80">
                找回密码
              </RouterLink>
            </div>
            <Input v-model="form.password" type="password" placeholder="请输入密码" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
          </div>

          <Button class="hero-cta h-11 w-full rounded-2xl" type="submit" :disabled="loading || !canSubmit">
            <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />
            <span v-else class="flex items-center gap-2">
              立即登录
              <ArrowRight class="h-4 w-4" />
            </span>
          </Button>
        </form>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-[22px] border border-white/10 bg-[var(--surface-elevated)] p-4">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">快速进入</div>
            <div class="mt-2 text-sm leading-6 text-[var(--foreground)]">
              登录后将直接进入用户中心，继续查看套餐、订单和订阅信息。
            </div>
          </div>
          <div class="rounded-[22px] border border-white/10 bg-[var(--surface-elevated)] p-4">
            <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">一致体验</div>
            <div class="mt-2 text-sm leading-6 text-[var(--foreground)]">
              从登录到日常管理，界面反馈清晰统一，桌面端与移动端都保持顺畅。
            </div>
          </div>
        </div>

        <div class="text-center text-sm text-[var(--muted-foreground)]">
          还没有账户？
          <RouterLink to="/register" class="font-medium text-[var(--primary)] transition hover:opacity-80">立即注册</RouterLink>
        </div>
      </CardContent>
    </Card>
  </AuthFrame>
</template>
