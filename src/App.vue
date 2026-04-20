<template>
  <RouterView />
  <Toaster rich-colors close-button position="top-right" />
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import "vue-sonner/style.css";
import { Toaster } from "vue-sonner";
</script>
