<script setup lang="ts">
import { ChevronRight, LogOut, Menu, Sparkles, X } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import AppFooter from "@/components/AppFooter.vue";
import ThemeToggle from "@/components/ThemeToggle.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { appConfig, navItems } from "@/config/app";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const open = ref(false);

const activeLabel = computed(() => navItems.find((item) => route.path.startsWith(item.to))?.label ?? "用户中心");

watch(
  () => route.fullPath,
  () => {
    open.value = false;
  },
);

function logout() {
  auth.logout();
  router.push("/login");
}
</script>

<template>
  <div class="min-h-screen bg-[var(--background)]">
    <header class="sticky top-0 z-40 border-b border-[var(--border)] bg-[color:color-mix(in_srgb,var(--background)_88%,transparent)] backdrop-blur-xl">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div class="flex items-center gap-3">
          <Button variant="outline" size="icon" class="md:hidden" @click="open = !open">
            <Menu class="h-4 w-4" />
          </Button>
          <RouterLink to="/dashboard" class="group flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-[var(--hero-gradient)] shadow-[var(--shadow-soft)] transition-transform duration-200 group-hover:-translate-y-0.5">
              <Sparkles class="h-4 w-4 text-[var(--primary)]" />
            </div>
            <div>
              <div class="text-sm font-semibold tracking-wide text-[var(--foreground)]">{{ appConfig.title }}</div>
              <div class="text-xs text-[var(--muted-foreground)]">{{ activeLabel }}</div>
            </div>
          </RouterLink>
        </div>

        <div class="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" class="gap-2 rounded-full px-3.5" @click="logout">
            <LogOut class="h-4 w-4" />
            退出
          </Button>
        </div>
      </div>
    </header>

    <div class="mx-auto flex max-w-7xl items-start gap-6 px-4 py-6 sm:px-6">
      <div v-if="open" class="fixed inset-0 z-20 bg-slate-950/42 backdrop-blur-sm md:hidden" @click="open = false" />

      <aside
        :class="
          cn(
            'fixed inset-y-0 left-0 z-30 w-[88vw] max-w-80 self-start overflow-y-auto bg-[var(--background)] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] pt-[max(env(safe-area-inset-top,0px),1rem)] transition-transform duration-300 md:static md:block md:w-72 md:shrink-0 md:overflow-visible md:bg-transparent md:px-0 md:pb-0 md:pt-0',
            open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          )
        "
      >
        <div class="mb-3 flex items-center justify-between px-1 md:hidden">
          <div class="text-xs uppercase tracking-[0.2em] text-[var(--muted-foreground)]">导航</div>
          <Button variant="ghost" size="icon-sm" @click="open = false">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <Card class="glass-panel premium-shell rounded-[32px] border-white/10 md:sticky md:top-24">
          <CardContent class="space-y-6 p-4">
            <div class="rounded-[26px] border border-white/10 bg-[var(--hero-gradient)] p-5 shadow-[var(--shadow-soft)]">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                  <Sparkles class="h-3.5 w-3.5" />
                  {{ appConfig.title }}
                </div>
                <Badge variant="secondary" class="rounded-full px-2.5">用户中心</Badge>
              </div>
              <div class="mt-4 text-[1.15rem] font-semibold leading-7 text-[var(--foreground)]">账户与服务管理</div>
              <div class="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                在这里查看订阅状态、订单与钱包信息，也可以继续处理工单、公告和帮助文档。
              </div>
            </div>

            <div class="border-t border-[color:color-mix(in_srgb,var(--border)_76%,transparent)] pt-1">
              <div class="mb-3 px-2 text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Navigation
              </div>
              <div class="space-y-2">
                <RouterLink
                  v-for="item in navItems"
                  :key="item.to"
                  :to="item.to"
                  :class="
                    cn(
                      'group flex h-[50px] items-center justify-between rounded-[18px] border px-4 text-sm transition-all duration-250 will-change-transform',
                      route.path.startsWith(item.to)
                        ? 'border-[color:color-mix(in_srgb,var(--primary)_18%,var(--border))] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-soft)]'
                        : 'border-transparent text-[var(--muted-foreground)] hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--primary)_16%,var(--border))] hover:bg-[var(--surface)] hover:text-[var(--foreground)]',
                    )
                  "
                >
                  <span class="leading-none">{{ item.label }}</span>
                  <ChevronRight
                    class="h-4 w-4 shrink-0 transition"
                    :class="route.path.startsWith(item.to) ? 'text-[var(--primary)] opacity-100' : 'opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100'"
                  />
                </RouterLink>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>

      <main class="min-w-0 flex-1 pb-[calc(env(safe-area-inset-bottom,0px)+0.25rem)]">
        <div class="animated-enter-soft">
          <slot />
          <AppFooter />
        </div>
      </main>
    </div>
  </div>
</template>
