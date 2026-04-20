import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "@/services/api";
import type { SiteConfig, UserInfo } from "@/types/api";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token"));
  const authData = ref(localStorage.getItem("auth_data"));
  const user = ref<UserInfo | null>(null);
  const site = ref<SiteConfig | null>(null);
  const ready = ref(false);

  async function hydrate() {
    if (ready.value) return;
    ready.value = true;
    site.value = await api.getSiteConfig().catch(() => null);
    if (authData.value) {
      user.value = await api.getUserInfo().catch(() => null);
    }
  }

  async function login(email: string, password: string) {
    const response = await api.login({ email, password });
    token.value = response.token;
    authData.value = response.auth_data;
    localStorage.setItem("token", response.token);
    localStorage.setItem("auth_data", response.auth_data);
    user.value = await api.getUserInfo();
  }

  function logout() {
    token.value = null;
    authData.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("auth_data");
  }

  return { token, authData, user, site, ready, hydrate, login, logout };
});
