<template>
  <AppLayout>
    <router-view />
    <SettingsModal 
      :is-open="settingsStore.isSettingsOpen" 
      @close="settingsStore.closeSettings()" 
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppLayout from '@/layouts/AppLayout.vue';
import SettingsModal from '@/components/common/SettingsModal.vue';
import { useSettingsStore } from '@/stores/settings';
import { useSyncStore } from '@/stores/sync';

const { locale } = useI18n();
const settingsStore = useSettingsStore();
const syncStore = useSyncStore();

// Zoom Shortcut Logic
function handleKeydown(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey) {
    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      const newZoom = Math.min(1.5, settingsStore.zoomLevel + 0.1);
      settingsStore.setZoom(newZoom);
    } else if (e.key === '-') {
      e.preventDefault();
      const newZoom = Math.max(0.5, settingsStore.zoomLevel - 0.1);
      settingsStore.setZoom(newZoom);
    } else if (e.key === '0') {
      e.preventDefault();
      settingsStore.setZoom(1);
    }
  }
}

// Sync Locale
watch(
  () => settingsStore.locale,
  (newLocale) => {
    locale.value = newLocale;
  }
);

watch(
  locale,
  (newLocale) => {
    if (newLocale !== settingsStore.locale) {
      settingsStore.setLocale(newLocale as string);
    }
  }
);

onMounted(() => {
  // Initialize settings
  // Trust store persistence via pinia-plugin-persistedstate which runs before mount usually.
  // But we need to call init() to apply styles.
  settingsStore.init();
  
  // Initialize Cloud Sync if configured
  syncStore.initSync();
  
  // Sync initial locale
  locale.value = settingsStore.locale;

  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>