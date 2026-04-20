<script setup lang="ts">
import { MoonStar, SunMedium } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/composables/theme";

const { theme, toggleTheme } = useTheme();
</script>

<template>
  <Button
    variant="outline"
    size="sm"
    class="rounded-full px-3.5 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:color-mix(in_srgb,var(--primary)_22%,var(--border))]"
    @click="toggleTheme"
  >
    <SunMedium v-if="theme === 'dark'" class="h-4 w-4" />
    <MoonStar v-else class="h-4 w-4" />
    {{ theme === "dark" ? "浅色" : "深色" }}
  </Button>
</template>
