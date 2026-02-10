<template>
  <div class="flex items-center gap-1 px-3 py-2 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 rounded-t-xl">
    <!-- 文本格式 -->
    <button @click="$emit('action', 'bold')" class="toolbar-btn" :title="t('format.bold')">
      <Bold class="w-4 h-4" />
    </button>
    <button @click="$emit('action', 'italic')" class="toolbar-btn" :title="t('format.italic')">
      <Italic class="w-4 h-4" />
    </button>
    <button @click="$emit('action', 'heading')" class="toolbar-btn" :title="t('format.heading')">
      <Heading2 class="w-4 h-4" />
    </button>

    <div class="w-px h-4 bg-gray-300 dark:bg-zinc-600 mx-1"></div>

    <!-- 插入元素 -->
    <button @click="$emit('action', 'link')" class="toolbar-btn" :title="t('format.link')">
      <Link class="w-4 h-4" />
    </button>
    <button @click="$emit('insertImage')" class="toolbar-btn" :title="t('format.image')">
      <Image class="w-4 h-4" />
    </button>
    <button @click="$emit('action', 'code')" class="toolbar-btn" :title="t('format.code')">
      <Code class="w-4 h-4" />
    </button>

    <div class="w-px h-4 bg-gray-300 dark:bg-zinc-600 mx-1"></div>

    <!-- 列表 -->
    <button @click="$emit('action', 'list')" class="toolbar-btn" :title="t('format.list')">
      <List class="w-4 h-4" />
    </button>

    <div class="flex-1"></div>

    <!-- 实时预览切换 -->
    <button 
      @click="$emit('togglePreview')" 
      class="toolbar-btn flex items-center gap-1.5 px-2 mr-1"
      :class="{ 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20': showPreview }"
      :title="showPreview ? t('common.hide_preview') : t('common.show_preview')"
    >
      <Eye class="w-4 h-4" />
      <span class="text-xs font-medium">{{ t('common.live_preview') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Bold, Italic, Link, Image, Code, List, Eye, Heading2 } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

defineProps<{
  showPreview: boolean;
}>();

defineEmits<{
  (e: 'action', type: string): void;
  (e: 'insertImage'): void;
  (e: 'togglePreview'): void;
}>();

const { t } = useI18n();
</script>

<style scoped>
.toolbar-btn {
  padding: 0.375rem;
  color: rgb(107 114 128);
  border-radius: 0.25rem;
  transition: color 0.15s, background-color 0.15s;
}

.toolbar-btn:hover {
  color: rgb(55 65 81);
  background-color: rgb(229 231 235);
}

:root.dark .toolbar-btn {
  color: rgb(156 163 175);
}

:root.dark .toolbar-btn:hover {
  color: rgb(209 213 219);
  background-color: rgb(63 63 70);
}
</style>
