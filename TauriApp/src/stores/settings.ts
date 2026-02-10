import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";

export type Theme = "light" | "dark" | "auto";

export const useSettingsStore = defineStore(
  "settings",
  () => {
    const theme = ref<Theme>("auto");
    const locale = ref<string>("zh");
    const zoomLevel = ref<number>(1);
    const userName = ref<string>("User");
    const userAvatar = ref<string>(""); // URL or base64

    const isSettingsOpen = ref(false);

    // Helper to get system preference
    const systemIsDark = ref(
      window.matchMedia("(prefers-color-scheme: dark)").matches,
    );

    // Update system preference listener
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        systemIsDark.value = e.matches;
        if (theme.value === "auto") {
          applyTheme();
        }
      });

    const isDark = computed(() => {
      if (theme.value === "auto") {
        return systemIsDark.value;
      }
      return theme.value === "dark";
    });

    function setTheme(newTheme: Theme) {
      theme.value = newTheme;
      applyTheme();
    }

    function applyTheme() {
      const shouldBeDark = isDark.value;
      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
        // Update Title Bar style if possible (e.g. via meta tag)
        document
          .querySelector('meta[name="theme-color"]')
          ?.setAttribute("content", "#09090b"); // zinc-950
      } else {
        document.documentElement.classList.remove("dark");
        document
          .querySelector('meta[name="theme-color"]')
          ?.setAttribute("content", "#ffffff");
      }
    }

    function setLocale(newLocale: string) {
      locale.value = newLocale;
      // Note: Actual i18n instance update should happen in App.vue or where i18n is available,
      // or we can try to access the composer if exported, but typically we just bind this value to i18n.locale
    }

    function setZoom(level: number) {
      zoomLevel.value = parseFloat(level.toFixed(1));
      applyZoom();
    }

    function applyZoom() {
      const baseFontSize = 14;
      const newSize = baseFontSize * zoomLevel.value;
      document.documentElement.style.fontSize = `${newSize}px`;
    }

    function openSettings() {
      isSettingsOpen.value = true;
    }

    function closeSettings() {
      isSettingsOpen.value = false;
    }

    // Initialize application state
    function init() {
      applyTheme();
      applyZoom();
    }

    return {
      theme,
      locale,
      zoomLevel,
      userName,
      userAvatar,
      isDark,
      isSettingsOpen,
      setTheme,
      setLocale,
      setZoom,
      applyTheme,
      applyZoom,
      openSettings,
      closeSettings,
      init,
    };
  },
  {
    persist: true,
  },
);
