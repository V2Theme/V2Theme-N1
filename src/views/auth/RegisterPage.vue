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
    toast.success("验证码已发送至您的邮箱。");
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
    toast.success("账户创建成功。");
    router.push("/dashboard");
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "注册失败，请检查输入信息。");
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
          <Badge variant="secondary" class="rounded-md px-2.5 py-0.5 text-xs font-medium">新用户</Badge>
          <div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <Sparkles class="h-4 w-4 text-foreground" />
          </div>
        </div>
        <div>
          <CardTitle class="text-2xl font-bold tracking-tight">创建账户</CardTitle>
          <CardDescription class="mt-1.5 text-sm">
            只需几步，即可开启您的全球极速网络之旅。
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
                验证码
              </label>
            </div>
            <div class="flex gap-2">
              <Input v-model="form.code" placeholder="输入邮箱验证码" class="h-10" />
              <Button
                type="button"
                variant="outline"
                class="h-10 shrink-0"
                :disabled="sending || countdown > 0 || !form.email.trim()"
                @click="sendCode"
              >
                <MailCheck class="mr-2 h-4 w-4" />
                {{ countdown > 0 ? `${countdown}s` : "发送验证码" }}
              </Button>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">登录密码</label>
              <Input v-model="form.password" type="password" placeholder="至少 8 位安全密码" class="h-10" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none text-muted-foreground">邀请码 (可选)</label>
              <Input v-model="form.inviteCode" placeholder="若有推荐链接会自动填入" class="h-10" />
            </div>
          </div>

          <Button class="w-full h-10 mt-2" type="submit" :disabled="disabled || loading">
            <LoaderCircle v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            <span v-else>注册并初始化控制台</span>
          </Button>
        </form>

        <div class="rounded-lg border bg-muted/50 p-4">
          <div class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">极速部署</div>
          <div class="mt-1 text-sm font-medium">
            注册后即可选购方案并一键导入配置，全平台无缝衔接。
          </div>
        </div>

        <div class="text-center text-sm text-muted-foreground">
          已有控制台账户？
          <RouterLink to="/login" class="font-semibold text-primary hover:underline underline-offset-4">返回登录</RouterLink>
        </div>
      </CardContent>
    </Card>
  </AuthFrame>
</template>