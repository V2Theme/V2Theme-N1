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
    toast.error(error instanceof Error ? error.message : "登录失败，请检查您的凭证。");
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
          <Badge variant="secondary" class="rounded-md px-2.5 py-0.5 text-xs font-medium">欢迎回来</Badge>
          <div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <ShieldCheck class="h-4 w-4 text-foreground" />
          </div>
        </div>
        <div>
          <CardTitle class="text-2xl font-bold tracking-tight">登录控制台</CardTitle>
          <CardDescription class="mt-1.5 text-sm">
            请输入您的身份凭证以管理您的网络服务资源。
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent class="space-y-6 sm:p-8 sm:pt-0">
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              注册邮箱
            </label>
            <Input v-model="form.email" type="email" placeholder="name@example.com" class="h-10" />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                账户密码
              </label>
              <RouterLink to="/forgot-password" class="text-xs font-medium text-primary hover:underline underline-offset-4">
                忘记密码？
              </RouterLink>
            </div>
            <Input v-model="form.password" type="password" placeholder="请输入密码" class="h-10" />
          </div>

          <Button class="w-full h-10 mt-2" type="submit" :disabled="loading || !canSubmit">
            <LoaderCircle v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            <span v-else class="flex items-center">
              进入控制台
              <ArrowRight class="ml-2 h-4 w-4" />
            </span>
          </Button>
        </form>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-lg border bg-muted/50 p-4">
            <div class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">服务概览</div>
            <div class="mt-1 text-sm font-medium">实时监控节点状态与流量消耗。</div>
          </div>
          <div class="rounded-lg border bg-muted/50 p-4">
            <div class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">智能管理</div>
            <div class="mt-1 text-sm font-medium">一站式管理订阅与账单设备。</div>
          </div>
        </div>

        <div class="text-center text-sm text-muted-foreground">
          尚未拥有账户？
          <RouterLink to="/register" class="font-semibold text-primary hover:underline underline-offset-4">立即创建</RouterLink>
        </div>
      </CardContent>
    </Card>
  </AuthFrame>
</template>