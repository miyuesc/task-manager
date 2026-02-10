<template>
  <AppLayout>
    <router-view />
    <SettingsModal 
      :is-open="settingsStore.isSettingsOpen" 
      @close="settingsStore.closeSettings()" 
    />
    <ConfirmDialog />
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppLayout from '@/layouts/AppLayout.vue';
import SettingsModal from '@/components/common/SettingsModal.vue';
import ConfirmDialog from '@/components/common/ConfirmDialog.vue';
import { useSettingsStore } from '@/stores/settings';
import { useSyncStore } from '@/stores/sync';

const { locale } = useI18n();
const settingsStore = useSettingsStore();
const syncStore = useSyncStore();

// Global Event Handlers
function handleContextMenu(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
    return;
  }
  e.preventDefault();
}

function handleDragStart(e: DragEvent) {
  const target = e.target as HTMLElement;
  if (target.tagName === 'A' || target.closest('a')) {
    e.preventDefault();
  }
}

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
  settingsStore.init();
  
  // Initialize Cloud Sync if configured
  syncStore.initSync();
  
  // Sync initial locale
  locale.value = settingsStore.locale;

  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('contextmenu', handleContextMenu);
  window.addEventListener('dragstart', handleDragStart);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  window.removeEventListener('contextmenu', handleContextMenu);
  window.removeEventListener('dragstart', handleDragStart);
});
</script>