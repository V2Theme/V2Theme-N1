<script setup lang="ts">
defineProps<{ title: string; description: string }>();
</script>

<template>
  <div class="mb-6 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_92%,transparent),transparent)] px-1 py-1">
    <div class="animated-enter-soft rounded-[26px] px-4 py-4 sm:px-6 sm:py-6">
      <div class="text-[11px] font-medium uppercase tracking-[0.24em] text-[var(--muted-foreground)]">用户中心</div>
      <h1 class="mt-2 text-[2rem] font-semibold tracking-tight text-[var(--foreground)] sm:text-[2.2rem]">{{ title }}</h1>
      <p class="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted-foreground)] sm:text-[0.98rem]">{{ description }}</p>
    </div>
  </div>
</template>
