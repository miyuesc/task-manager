<template>
  <div 
    class="relative"
    :class="{ 'inline-flex': props.inline }"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
  >
    <slot />
    <Teleport to="body">
      <Transition name="tooltip">
        <div
          v-if="visible && text"
          ref="tooltipRef"
          class="fixed z-[9999] px-2.5 py-1.5 text-xs font-medium text-gray-100 bg-gray-800 dark:bg-zinc-700 rounded-lg shadow-lg pointer-events-none whitespace-nowrap"
          :style="tooltipStyle"
        >
          {{ text }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  text?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  inline?: boolean;
}>();

const visible = ref(false);
const tooltipRef = ref<HTMLElement | null>(null);
const tooltipStyle = ref<Record<string, string>>({});

let triggerEl: HTMLElement | null = null;

function showTooltip(e: MouseEvent) {
  if (props.disabled) return;
  triggerEl = (e.currentTarget as HTMLElement);
  visible.value = true;
  nextTick(updatePosition);
}

function hideTooltip() {
  visible.value = false;
}

function updatePosition() {
  if (!triggerEl || !tooltipRef.value) return;

  const rect = triggerEl.getBoundingClientRect();
  const tipRect = tooltipRef.value.getBoundingClientRect();
  const pos = props.position || 'right';

  let top = 0;
  let left = 0;

  switch (pos) {
    case 'top':
      top = rect.top - tipRect.height - 6;
      left = rect.left + (rect.width - tipRect.width) / 2;
      break;
    case 'bottom':
      top = rect.bottom + 6;
      left = rect.left + (rect.width - tipRect.width) / 2;
      break;
    case 'left':
      top = rect.top + (rect.height - tipRect.height) / 2;
      left = rect.left - tipRect.width - 6;
      break;
    case 'right':
      top = rect.top + (rect.height - tipRect.height) / 2;
      left = rect.right + 6;
      break;
  }

  // 边界修正
  if (left < 4) left = 4;
  if (top < 4) top = 4;

  tooltipStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
  };
}

// 全局点击关闭
function onGlobalClick() {
  visible.value = false;
}

onMounted(() => {
  document.addEventListener('click', onGlobalClick);
});

onUnmounted(() => {
  document.removeEventListener('click', onGlobalClick);
});
</script>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
