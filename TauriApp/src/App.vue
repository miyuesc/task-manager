<template>
  <AppLayout>
    <router-view />
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import AppLayout from '@/layouts/AppLayout.vue';

function handleKeydown(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey) {
    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      const currentZoom = parseFloat((document.body.style as any).zoom || '1');
      (document.body.style as any).zoom = (currentZoom + 0.1).toFixed(1);
    } else if (e.key === '-') {
      e.preventDefault();
      const currentZoom = parseFloat((document.body.style as any).zoom || '1');
      if (currentZoom > 0.5) {
        (document.body.style as any).zoom = (currentZoom - 0.1).toFixed(1);
      }
    } else if (e.key === '0') {
      e.preventDefault();
      (document.body.style as any).zoom = '1';
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>