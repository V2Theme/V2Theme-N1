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
    toast.success("密码重置成功，请使用新密码登录。");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "重置失败，请验证您的信息。");
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthFrame>
    <Card class="border-0 bg-transparent shadow-none sm:border sm:bg-background sm:shadow-sm rounded-2xl">
      <CardHeader class="space-y-3 pb-6 sm:p-8 sm:pb-6">
        <div class="flex items-center justify-between">
          <Badge variant="secondary" class="rounded-md px-2.5 py-0.5 text-xs font-medium">安全恢复</Badge>
          <div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <KeyRound class="h-4 w-4 text-foreground" />
          </div>
        </div>
        <div>
          <CardTitle class="text-2xl font-bold tracking-tight">重置密码</CardTitle>
          <CardDescription class="mt-1.5 text-sm">
            请验证您的邮箱以设置新的安全密码。
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent class="space-y-6 sm:p-8 sm:pt-0">
        <form class="space-y-4" @submit.prevent="submit">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">账户邮箱</label>
            <Input v-model="form.email" type="email" placeholder="name@example.com" class="h-10" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">邮件验证码</label>
            <Input v-model="form.code" placeholder="输入 6 位验证码" class="h-10" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">新密码</label>
            <Input v-model="form.password" type="password" placeholder="设置新的高强度密码" class="h-10" />
          </div>
          <Button class="w-full h-10 mt-2" type="submit" :disabled="loading || disabled">
            <LoaderCircle v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            <span v-else>确认重置</span>
          </Button>
        </form>

        <div class="rounded-lg border bg-muted/50 p-4">
          <div class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">收不到邮件？</div>
          <div class="mt-1 text-sm font-medium">
            请检查垃圾邮件文件夹，或等待一分钟后重新发送请求。
          </div>
        </div>

        <div class="text-center text-sm text-muted-foreground">
          记起密码了？
          <RouterLink to="/login" class="font-semibold text-primary hover:underline underline-offset-4">返回登录</RouterLink>
        </div>
      </CardContent>
    </Card>
  </AuthFrame>
</template>