<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
}>();
</script>

<template>
  <div class="glass-panel interactive-panel animated-enter-soft rounded-[28px] border border-dashed border-[color:color-mix(in_srgb,var(--border)_88%,transparent)] px-6 py-10 text-center shadow-[var(--shadow-soft)] sm:px-8 sm:py-12">
    <h3 class="text-base font-medium text-[var(--foreground)]">{{ title }}</h3>
    <p class="mx-auto mt-2 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">{{ description }}</p>
    <div class="mt-4">
      <slot />
    </div>
  </div>
</template>
