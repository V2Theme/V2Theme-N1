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
    title: "安全与信任",
    description: "企业级安全防护与加密传输，让每一次账户访问都更安心。",
    icon: ShieldCheck,
  },
  {
    title: "稳定连接",
    description: "精选线路与更稳定的服务调度，常用访问场景始终顺畅自然。",
    icon: Waypoints,
  },
  {
    title: "持续支持",
    description: "从注册、登录到日常使用，遇到问题时都能获得及时响应。",
    icon: Wrench,
  },
  {
    title: "多端体验",
    description: "兼容桌面端与移动端使用，在不同设备上都保持一致体验。",
    icon: Laptop,
  },
];
</script>

<template>
  <div class="min-h-screen bg-[var(--background)]">
    <div class="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
      <section class="relative hidden overflow-hidden border-r border-[var(--border)] lg:block">
        <div class="hero-orb left-[12%] top-[14%] h-56 w-56 bg-blue-600/18" />
        <div class="hero-orb bottom-[12%] right-[10%] h-72 w-72 bg-sky-400/18" style="animation-delay: -6s;" />
        <div class="hero-grid absolute inset-0 opacity-70" />
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(120,119,255,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(76,201,240,0.18),transparent_32%)]" />

        <div class="relative flex h-full flex-col justify-between p-10">
          <div class="glass-panel inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold text-[var(--foreground)]">
            <Sparkles class="h-4 w-4 text-[var(--primary)]" />
            {{ appConfig.title }}
          </div>

          <div class="section-glow">
            <Badge variant="secondary" class="rounded-full px-3 py-1.5">高品质账户访问体验</Badge>
            <h1 class="mt-6 max-w-xl text-5xl font-semibold leading-tight">
              从登录开始
              <br>
              保持一致而从容的使用体验
            </h1>
            <p class="mt-5 max-w-lg text-base leading-7 text-[var(--muted-foreground)]">
              无论是创建账户、登录进入还是日常管理，我们都将稳定性、清晰的信息结构与克制的交互反馈统一到同一套体验中。
            </p>

            <div class="mt-8 grid max-w-lg gap-3">
              <Card
                v-for="(item, index) in featureCards"
                :key="item.title"
                class="glass-panel interactive-panel micro-lift rounded-[24px] border-white/10 animated-enter-soft"
                :style="{ animationDelay: `${index * 90}ms` }"
              >
                <CardContent class="flex items-start gap-3 p-4">
                  <div class="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-elevated)]">
                    <component :is="item.icon" class="h-4 w-4 text-[var(--primary)]" />
                  </div>
                  <div>
                    <div class="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">{{ item.title }}</div>
                    <div class="mt-2 text-base font-medium">{{ item.description }}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div class="text-sm text-[var(--muted-foreground)]">
            兼容亮色与暗色主题，并适配桌面端与移动端访问。
          </div>
        </div>
      </section>

      <section class="relative flex items-center justify-center px-4 py-10 sm:px-6">
        <div class="hero-orb left-[5%] top-14 h-32 w-32 bg-blue-600/10 lg:hidden" />
        <div class="hero-orb bottom-12 right-[6%] h-40 w-40 bg-sky-400/10 lg:hidden" style="animation-delay: -4s;" />
        <div class="w-full max-w-md animated-enter-soft">
          <div class="mb-8 flex items-center justify-between">
            <RouterLink to="/" class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[var(--hero-gradient)] shadow-[var(--shadow-soft)]">
                <Sparkles class="h-4 w-4 text-[var(--primary)]" />
              </div>
              <div>
                <div class="text-sm font-semibold text-[var(--foreground)]">{{ appConfig.title }}</div>
                <div class="text-xs text-[var(--muted-foreground)]">账户访问</div>
              </div>
            </RouterLink>
            <ThemeToggle />
          </div>
          <slot />
          <AppFooter />
        </div>
      </section>
    </div>
  </div>
</template>
