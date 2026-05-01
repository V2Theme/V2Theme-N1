<script setup lang="ts">
import { ArrowRight, Globe, Laptop, ShieldCheck, Sparkles, Waypoints, Wrench } from "lucide-vue-next";
import { RouterLink } from "vue-router";
import AppFooter from "@/components/AppFooter.vue";
import ThemeToggle from "@/components/ThemeToggle.vue";
import { appConfig } from "@/config/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// 数据保留不变...
</script>

<template>
  <div class="relative min-h-screen bg-background text-foreground selection:bg-primary/20">
    <!-- 替换为干净的网格线 -->
    <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

    <div class="relative mx-auto flex max-w-7xl flex-col px-6 py-8">
      <header class="flex items-center justify-between mb-24">
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles class="h-4 w-4" />
          </div>
          <span class="font-bold tracking-tight">{{ appConfig.title }}</span>
        </div>
        <div class="flex items-center gap-4">
          <ThemeToggle />
          <RouterLink to="/login">
            <Button variant="ghost" class="hidden sm:inline-flex">登录</Button>
          </RouterLink>
          <RouterLink to="/register">
            <Button>免费开始</Button>
          </RouterLink>
        </div>
      </header>

      <main class="mx-auto max-w-4xl text-center">
        <Badge variant="outline" class="mb-6 rounded-full px-4 py-1 text-sm">
          <span class="mr-2 flex h-2 w-2 rounded-full bg-green-500"></span>
          高可用企业级网络服务
        </Badge>
        
        <h1 class="mb-8 text-5xl font-extrabold tracking-tight sm:text-7xl">
          连接世界，<br>
          <span class="text-muted-foreground">稳定、快速且从容。</span>
        </h1>
        
        <p class="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
          为日常访问、流媒体使用与多设备在线场景提供更可靠的连接品质，让速度、稳定性与使用体验在同一套服务标准下始终保持出色。
        </p>

        <div class="flex items-center justify-center gap-4">
          <RouterLink to="/register">
            <Button size="lg" class="h-12 px-8 text-base">
              立即开始
              <ArrowRight class="ml-2 h-4 w-4" />
            </Button>
          </RouterLink>
          <RouterLink to="/plans">
            <Button variant="outline" size="lg" class="h-12 px-8 text-base">查看方案</Button>
          </RouterLink>
        </div>
      </main>

      <AppFooter class="mt-auto border-none pt-24" />
    </div>
  </div>
</template>