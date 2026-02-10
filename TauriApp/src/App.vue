<template>
  <AppLayout>
    <router-view />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import AppLayout from '@/layouts/AppLayout.vue';

const zoomLevel = ref(1);
const baseFontSize = 14; // 从 style.css 里的 :root font-size: 14px 继承

function updateZoom() {
  const newSize = baseFontSize * zoomLevel.value;
  document.documentElement.style.fontSize = `${newSize}px`;
}

function handleKeydown(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey) {
    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      zoomLevel.value = parseFloat((zoomLevel.value + 0.1).toFixed(1));
      updateZoom();
    } else if (e.key === '-') {
      e.preventDefault();
      if (zoomLevel.value > 0.5) {
        zoomLevel.value = parseFloat((zoomLevel.value - 0.1).toFixed(1));
        updateZoom();
      }
    } else if (e.key === '0') {
      e.preventDefault();
      zoomLevel.value = 1;
      updateZoom();
    }
  }
}

onMounted(() => {
  // 确保初始 zoom 被清除
  (document.body.style as any).zoom = '';
  // 根据当前设置初始化
  updateZoom(); 
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>