<script setup lang="ts">
import { appConfig } from "@/config/app";
</script>

<template>
  <footer class="mt-10 border-t border-[var(--border)]/80">
    <div class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>{{ appConfig.title }} © {{ new Date().getFullYear() }}</div>
      <div class="flex flex-wrap gap-4">
        <a
          v-for="link in appConfig.footerLinks"
          :key="link.label"
          :href="link.url"
          target="_blank"
          rel="noreferrer"
          class="transition-colors duration-200 hover:text-[var(--foreground)]"
        >
          {{ link.label }}
        </a>
      </div>
    </div>
  </footer>
</template>
