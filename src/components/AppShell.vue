<script setup lang="ts">
import { ChevronRight, LogOut, Menu, Sparkles, X, LayoutDashboard } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import AppFooter from "@/components/AppFooter.vue";
import ThemeToggle from "@/components/ThemeToggle.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { appConfig, navItems } from "@/config/app";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const open = ref(false);

const activeLabel = computed(() => navItems.find((item) => route.path.startsWith(item.to))?.label ?? "用户中心");

watch(() => route.fullPath, () => { open.value = false; });

function logout() {
  auth.logout();
  router.push("/login");
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 极简高亮顶部栏 -->
    <header class="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div class="flex items-center gap-3">
          <Button variant="outline" size="icon" class="md:hidden" @click="open = !open">
            <Menu class="h-4 w-4" />
          </Button>
          <RouterLink to="/dashboard" class="flex items-center gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles class="h-4 w-4" />
            </div>
            <div class="hidden sm:block">
              <div class="text-sm font-semibold tracking-tight">{{ appConfig.title }}</div>
            </div>
            <Badge variant="secondary" class="hidden sm:inline-flex rounded-md ml-2">{{ activeLabel }}</Badge>
          </RouterLink>
        </div>

        <div class="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="ghost" size="sm" class="gap-2 text-muted-foreground hover:text-foreground" @click="logout">
            <LogOut class="h-4 w-4" />
            <span class="hidden sm:inline">退出</span>
          </Button>
        </div>
      </div>
    </header>

    <div class="mx-auto flex max-w-7xl items-start gap-8 px-4 py-8 sm:px-6">
      <div v-if="open" class="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden" @click="open = false" />

      <!-- 现代侧边栏 -->
      <aside :class="cn(
          'fixed inset-y-0 left-0 z-30 w-64 self-start overflow-y-auto border-r bg-background px-4 py-6 transition-transform duration-300 md:static md:block md:w-56 md:shrink-0 md:border-0 md:bg-transparent md:px-0 md:py-0',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )"
      >
        <div class="mb-6 flex items-center justify-between md:hidden">
          <div class="text-sm font-semibold">导航菜单</div>
          <Button variant="ghost" size="icon" @click="open = false">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <nav class="space-y-1 md:sticky md:top-24">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="cn(
              'flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors',
              route.path.startsWith(item.to)
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )"
          >
            <span class="flex items-center gap-3">
              {{ item.label }}
            </span>
          </RouterLink>
        </nav>
      </aside>

      <main class="min-w-0 flex-1">
        <div class="animated-fade">
          <slot />
          <AppFooter />
        </div>
      </main>
    </div>
  </div>
</template>