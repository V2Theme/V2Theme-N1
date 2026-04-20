<script setup lang="ts">
import { ArrowRight, Globe, Laptop, ShieldCheck, Sparkles, Waypoints, Wrench } from "lucide-vue-next";
import { RouterLink } from "vue-router";
import AppFooter from "@/components/AppFooter.vue";
import ThemeToggle from "@/components/ThemeToggle.vue";
import { appConfig } from "@/config/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const serviceCards = [
  { name: "Google", mark: "G", color: "text-blue-500", description: "搜索与工作访问" },
  { name: "Netflix", mark: "N", color: "text-red-500", description: "影音与娱乐体验" },
  { name: "YouTube", mark: "▶", color: "text-rose-500", description: "视频播放更流畅" },
  { name: "Facebook", mark: "f", color: "text-blue-600", description: "社交通讯连接稳定" },
  { name: "X", mark: "X", color: "text-slate-900 dark:text-white", description: "资讯访问保持顺畅" },
  { name: "ChatGPT", mark: "◌", color: "text-emerald-500", description: "智能工具响应更快" },
];

const stats = [
  { value: "50+", label: "覆盖地区" },
  { value: "200+", label: "优质节点" },
  { value: "1Gbps", label: "带宽保障" },
];

const highlights = [
  { icon: ShieldCheck, text: "企业级安全防护与加密传输，连接体验更安心" },
  { icon: Waypoints, text: "精选线路与稳定调度机制，日常访问始终顺畅" },
  { icon: Wrench, text: "持续响应的技术支持服务，问题处理更及时" },
  { icon: Laptop, text: "兼容多平台与多设备使用，随时随地轻松接入" },
];
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[var(--background)]">
    <div class="hero-orb left-[6%] top-16 h-48 w-48 bg-sky-400/25" />
    <div class="hero-orb right-[8%] top-24 h-56 w-56 bg-indigo-500/25" style="animation-delay: -5s;" />
    <div class="hero-grid absolute inset-0 opacity-70" />

    <div class="relative mx-auto flex max-w-7xl flex-col gap-14 px-4 py-8 sm:px-6 lg:gap-18">
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[var(--hero-gradient)] shadow-[var(--shadow-soft)]">
            <Sparkles class="h-4 w-4 text-[var(--primary)]" />
          </div>
          <div>
            <div class="text-sm font-semibold text-[var(--foreground)]">{{ appConfig.title }}</div>
            <div class="text-xs text-[var(--muted-foreground)]">高品质网络访问与账户管理体验</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <ThemeToggle />
          <RouterLink to="/login">
            <Button size="sm" class="rounded-full px-4">登录</Button>
          </RouterLink>
        </div>
      </header>

      <section class="grid gap-10 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
        <div class="section-glow animated-enter-soft" style="animation-delay: 70ms;">
          <Badge variant="secondary" class="rounded-full px-3 py-1.5">
            <span class="mr-2 inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            品质网络访问服务
          </Badge>

          <h1 class="mt-5 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-tight text-[var(--foreground)] sm:text-6xl">
            连接世界的每一次访问
            <br>
            都值得更稳定与从容
          </h1>

          <p class="mt-6 max-w-2xl text-base leading-8 text-[var(--muted-foreground)]">
            为日常访问、流媒体使用与多设备在线场景提供更可靠的连接品质，
            让速度、稳定性与使用体验在同一套服务标准下始终保持出色。
          </p>

          <div class="mt-8 flex flex-wrap gap-3">
            <RouterLink to="/register">
              <Button size="lg" class="hero-cta rounded-2xl px-6">
                立即开始
                <ArrowRight class="h-4 w-4" />
              </Button>
            </RouterLink>
            <RouterLink to="/plans">
              <Button variant="outline" size="lg" class="rounded-2xl px-6">查看套餐</Button>
            </RouterLink>
          </div>

          <div class="mt-10 grid max-w-md grid-cols-3 gap-4 sm:gap-6">
            <div
              v-for="(item, index) in stats"
              :key="item.label"
              class="stagger-enter"
              :style="{ '--stagger-delay': `${index * 80 + 180}ms` }"
            >
              <div class="text-3xl font-semibold text-[var(--foreground)]">{{ item.value }}</div>
              <div class="mt-2 text-sm text-[var(--muted-foreground)]">{{ item.label }}</div>
            </div>
          </div>

          <div class="soft-stack mt-10 max-w-2xl">
            <Card
              v-for="(item, index) in highlights"
              :key="item.text"
              class="glass-panel interactive-panel surface-hover rounded-[24px] border-white/10 stagger-enter"
              :style="{ '--stagger-delay': `${index * 90 + 260}ms` }"
            >
              <CardContent class="flex items-center gap-3 p-4">
                <component :is="item.icon" class="h-5 w-5 text-[var(--primary)]" />
                <div class="text-sm font-medium">{{ item.text }}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div class="animated-enter-soft ambient-panel" style="animation-delay: 180ms;">
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Card
              v-for="(card, index) in serviceCards"
              :key="card.name"
              class="glass-panel interactive-panel micro-lift rounded-[28px] border-white/10 shadow-[var(--shadow-card)] stagger-enter"
              :style="{ '--stagger-delay': `${index * 70 + 120}ms` }"
            >
              <CardContent class="flex aspect-square flex-col items-center justify-center gap-3 p-6 text-center">
                <div
                  class="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[var(--surface-elevated)] text-3xl font-semibold"
                  :class="card.color"
                >
                  {{ card.mark }}
                </div>
                <div class="text-lg font-semibold text-[var(--foreground)]">{{ card.name }}</div>
                <div class="text-xs text-[var(--muted-foreground)]">{{ card.description }}</div>
              </CardContent>
            </Card>
          </div>

          <div class="mt-4 rounded-[30px] border border-white/10 bg-[var(--surface)]/82 p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl stagger-enter" style="--stagger-delay: 560ms;">
            <div class="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
              <Globe class="h-4 w-4 text-[var(--primary)]" />
              热门服务稳定可用
            </div>
            <div class="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
              搜索、影音、社交通讯与智能工具访问都能保持更稳定、更流畅的连接表现。
            </div>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  </div>
</template>
