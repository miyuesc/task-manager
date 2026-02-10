<script setup lang="ts">
import { onMounted, onUnmounted, ref, nextTick } from 'vue';

const props = defineProps<{
  x: number;
  y: number;
  items: Array<{
    label?: string;
    action?: string;
    icon?: any;
    class?: string;
    separator?: boolean;
    disabled?: boolean;
    children?: any[]; // For submenus (future)
  }>;
}>();

const emit = defineEmits(['close', 'select']);

const menuRef = ref<HTMLElement | null>(null);
const adjustedX = ref(props.x);
const adjustedY = ref(props.y);

// 关闭菜单
function close() {
  emit('close');
}

// 处理点击外部
function handleClickOutside(event: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    close();
  }
}

// 处理动作选择
function handleAction(item: any) {
  if (item.disabled || item.separator) return;
  if (item.action) {
    emit('select', item.action);
    close();
  }
}

// 自动调整位置防止超出屏幕
onMounted(async () => {
  await nextTick();
  if (menuRef.value) {
    const rect = menuRef.value.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let newX = props.x;
    let newY = props.y;

    if (newX + rect.width > windowWidth) {
      newX = windowWidth - rect.width - 10;
    }
    if (newY + rect.height > windowHeight) {
      newY = windowHeight - rect.height - 10;
    }
    
    adjustedX.value = newX;
    adjustedY.value = newY;
  }
  
  // 延迟添加监听器，避免包含触发菜单的点击事件
  setTimeout(() => {
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('contextmenu', handleClickOutside);
    document.addEventListener('scroll', close, true); // 滚动时关闭
  }, 0);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('contextmenu', handleClickOutside);
  document.removeEventListener('scroll', close, true);
});
</script>

<template>
  <Teleport to="body">
    <div 
      ref="menuRef"
      class="fixed z-[100] bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 py-1 min-w-[180px] overflow-hidden"
      :style="{ top: adjustedY + 'px', left: adjustedX + 'px' }"
      @contextmenu.prevent
    >
      <template v-for="(item, index) in items" :key="index">
         <div v-if="item.separator" class="h-px bg-gray-100 dark:bg-zinc-700 my-1 mx-1"></div>
         <button 
           v-else
           @click="handleAction(item)"
           :disabled="item.disabled"
           class="w-full flex items-center px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors text-left gap-2"
           :class="[{ 'opacity-50 cursor-not-allowed': item.disabled }, item.class]"
         >
           <component :is="item.icon" v-if="item.icon" class="w-4 h-4 shrink-0" />
           <span class="truncate flex-1">{{ item.label }}</span>
         </button>
      </template>
    </div>
  </Teleport>
</template>
