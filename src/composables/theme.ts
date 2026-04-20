import { ref } from "vue";

type ThemeMode = "light" | "dark";

const theme = ref<ThemeMode>("light");
let initialized = false;

function applyTheme(value: ThemeMode) {
  theme.value = value;
  document.documentElement.dataset.theme = value;
  document.documentElement.classList.toggle("dark", value === "dark");
}

export function initTheme() {
  if (initialized || typeof window === "undefined") return;
  const stored = localStorage.getItem("theme");
  const nextTheme: ThemeMode = stored === "dark" ? "dark" : "light";
  applyTheme(nextTheme);
  initialized = true;
}

export function useTheme() {
  initTheme();

  function setTheme(value: ThemeMode) {
    applyTheme(value);
    localStorage.setItem("theme", value);
  }

  function toggleTheme() {
    setTheme(theme.value === "dark" ? "light" : "dark");
  }

  return {
    theme,
    setTheme,
    toggleTheme,
  };
}
