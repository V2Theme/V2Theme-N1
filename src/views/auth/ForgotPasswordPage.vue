<script setup lang="ts">
import { KeyRound, LoaderCircle } from "lucide-vue-next";
import { computed, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import { toast } from "vue-sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/services/api";
import AuthFrame from "@/views/auth/AuthFrame.vue";

const loading = ref(false);
const form = reactive({ email: "", code: "", password: "" });
const disabled = computed(() => !form.email.trim() || !form.code.trim() || !form.password.trim());

async function submit() {
  loading.value = true;
  try {
    await api.resetPassword({ email: form.email, email_code: form.code, password: form.password });
    toast.success("密码已重置，请使用新密码登录。");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "暂时无法重置密码，请稍后再试。");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthFrame>
    <Card class="glass-panel interactive-panel rounded-[32px] border-white/10 shadow-[var(--shadow-card)]">
      <CardHeader class="space-y-4 p-7 pb-4">
        <div class="flex items-center justify-between gap-3">
          <Badge variant="secondary" class="rounded-full px-3 py-1">找回密码</Badge>
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface-elevated)]">
            <KeyRound class="h-4 w-4 text-[var(--primary)]" />
          </div>
        </div>
        <div>
          <CardTitle class="text-3xl tracking-tight">重新设置登录密码</CardTitle>
          <CardDescription class="mt-2 text-sm leading-6">
            输入邮箱、验证码和新密码后即可完成重置，成功后可直接返回登录页继续使用。
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent class="space-y-6 p-7 pt-2">
        <form class="space-y-4" @submit.prevent="submit">
          <div class="space-y-2">
            <label class="text-sm font-medium text-[var(--foreground)]">邮箱</label>
            <Input v-model="form.email" type="email" placeholder="name@example.com" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-[var(--foreground)]">邮箱验证码</label>
            <Input v-model="form.code" placeholder="请输入验证码" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-[var(--foreground)]">新密码</label>
            <Input v-model="form.password" type="password" placeholder="请输入新密码" class="h-11 rounded-2xl bg-[var(--surface-elevated)] px-4" />
          </div>
          <Button class="h-11 w-full rounded-2xl" type="submit" :disabled="loading || disabled">
            <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />
            <span v-else>重置密码</span>
          </Button>
        </form>

        <div class="rounded-[24px] border border-white/10 bg-[var(--surface-elevated)] p-4">
          <div class="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">温馨提示</div>
          <div class="mt-2 text-sm leading-6 text-[var(--foreground)]">
            如果没有收到验证码，建议先确认垃圾邮箱和邮箱设置，稍后再重新尝试。
          </div>
        </div>

        <div class="text-center text-sm text-[var(--muted-foreground)]">
          想起密码了？
          <RouterLink to="/login" class="font-medium text-[var(--primary)] transition hover:opacity-80">返回登录</RouterLink>
        </div>
      </CardContent>
    </Card>
  </AuthFrame>
</template>
