<script setup lang="ts">
import { Laptop, ShieldCheck, Sparkles, Waypoints, Wrench } from "lucide-vue-next";
import { RouterLink } from "vue-router";
import AppFooter from "@/components/AppFooter.vue";
import ThemeToggle from "@/components/ThemeToggle.vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { appConfig } from "@/config/app";

const featureCards = [
  {
    title: "端到端加密",
    description: "采用行业领先的加密协议，保障您的数据隐私与传输安全。",
    icon: ShieldCheck,
  },
  {
    title: "全球边缘网络",
    description: "智能路由与优选节点，确保在全球任意位置均能获得极低延迟。",
    icon: Waypoints,
  },
  {
    title: "SLA 可用性保障",
    description: "承诺极高的业务正常运行时间，提供全天候工单技术支持。",
    icon: Wrench,
  },
  {
    title: "全平台无缝接入",
    description: "提供标准化的配置协议，完美兼容跨平台终端生态设备。",
    icon: Laptop,
  },
];
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div class="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
      <!-- 左侧品牌展示区 -->
      <section class="relative hidden overflow-hidden border-r bg-muted/30 lg:block">
        <!-- 干净的网格线背景 -->
        <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div class="relative flex h-full flex-col justify-between p-12">
          <div class="inline-flex w-fit items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm font-semibold shadow-sm">
            <Sparkles class="h-4 w-4 text-primary" />
            {{ appConfig.title }}
          </div>

          <div class="animated-enter-soft">
            <Badge variant="secondary" class="rounded-md px-3 py-1 text-xs font-medium">企业级基础设施</Badge>
            <h1 class="mt-6 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
              重新定义
              <br>
              网络访问体验
            </h1>
            <p class="mt-6 max-w-lg text-base leading-7 text-muted-foreground">
              专为对稳定性与安全性有极高要求的用户打造。从边缘节点调度到核心流量加密，我们为您提供无与伦比的高性能网络服务。
            </p>

            <div class="mt-10 grid max-w-lg gap-4">
              <Card
                v-for="(item, index) in featureCards"
                :key="item.title"
                class="rounded-xl border shadow-sm animated-enter-soft bg-background/80 backdrop-blur-sm"
                :style="{ animationDelay: `${index * 90}ms` }"
              >
                <CardContent class="flex items-start gap-4 p-5">
                  <div class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <component :is="item.icon" class="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <div class="text-sm font-semibold">{{ item.title }}</div>
                    <div class="mt-1 text-sm text-muted-foreground">{{ item.description }}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div class="text-sm text-muted-foreground">
            © {{ new Date().getFullYear() }} {{ appConfig.title }}. All rights reserved.
          </div>
        </div>
      </section>

      <!-- 右侧表单区 -->
      <section class="relative flex items-center justify-center px-6 py-12 sm:px-12">
        <div class="w-full max-w-md animated-enter-soft flex flex-col min-h-[60vh] justify-center">
          <div class="mb-10 flex items-center justify-between">
            <RouterLink to="/" class="flex items-center gap-2">
              <div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground lg:hidden">
                <Sparkles class="h-4 w-4" />
              </div>
              <div class="text-sm font-semibold lg:hidden">{{ appConfig.title }}</div>
            </RouterLink>
            <ThemeToggle />
          </div>
          
          <slot />

          <!-- 加回 AppFooter 保证功能链接不丢失，并取消边框融入环境 -->
          <AppFooter class="mt-12 border-none px-0 opacity-80 hover:opacity-100 transition-opacity" />
        </div>
      </section>
    </div>
  </div>
</template>