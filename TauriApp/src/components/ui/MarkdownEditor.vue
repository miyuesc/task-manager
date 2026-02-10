<template>
  <div class="markdown-editor">
    <!-- 工具栏组件 -->
    <MarkdownToolbar 
      :show-preview="showPreview"
      @action="insertFormat"
      @insert-image="insertImage"
      @toggle-preview="showPreview = !showPreview"
    />

    <!-- 编辑区域：左右分栏实时预览 -->
    <div class="flex min-h-[200px] relative">
      <!-- 
        编辑器输入框 
        当开启预览时，显示右侧边框以分隔预览区
      -->
      <div class="flex-1 min-w-0" :class="{ 'border-r border-gray-200 dark:border-zinc-700': showPreview }">
        <textarea
          ref="textareaRef"
          :value="modelValue"
          @input="onInput"
          @keydown="handleKeydown"
          :placeholder="placeholder"
          class="w-full h-full bg-transparent border-none focus:ring-0 text-sm text-gray-700 dark:text-gray-300 resize-none min-h-[200px] p-4 placeholder-gray-400 font-mono focus:outline-none"
        ></textarea>
      </div>

      <!-- 
        实时预览区域
        使用 v-show 控制显示，保持 DOM 存在以维持滚动状态（如果需要）
      -->
      <div v-show="showPreview" class="flex-1 overflow-auto min-w-0 bg-gray-50/30 dark:bg-zinc-900/20">
        <div
          class="prose prose-sm dark:prose-invert max-w-none p-4 min-h-[200px]"
          v-html="renderedContent"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import MarkdownToolbar from './markdown/MarkdownToolbar.vue';
import { useMarkdownEditor } from '@/composables/useMarkdownEditor';
import { markdownParser } from '@/utils/markdown';

// 定义组件属性
interface Props {
  modelValue: string;
  placeholder?: string;
}

// 设置默认值
const props = withDefaults(defineProps<Props>(), {
  placeholder: '添加描述...', // 默认占位符，建议使用 i18n key 但在此保持兼容
});

// 定义事件
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const { t } = useI18n();
const showPreview = ref(true); // 控制预览区域的显示/隐藏
const textareaRef = ref<HTMLTextAreaElement | null>(null); // 获取 textarea DOM 引用

// 引入 Markdown 编辑核心逻辑 (Composable)
// 包含文本插入、快捷键处理等
const { insertFormat, insertImage, handleKeydown } = useMarkdownEditor(
  textareaRef,
  emit,
  props
);

// 实时渲染 Markdown 内容
// 如果没有内容，显示空状态提示
const renderedContent = computed(() => {
  if (!props.modelValue) {
    return `<p class="text-gray-400">${t('common.no_description')}</p>`;
  }
  return markdownParser(props.modelValue);
});

// 处理输入事件，更新 modelValue
function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
}
</script>

<style scoped>
/* Markdown 预览样式 - 使用 scoped 样式覆盖/补充 tailwind typography */
:deep(.prose) {
  color: rgb(55 65 81);
}

:root.dark :deep(.prose) {
  color: rgb(209 213 219);
}

/* 标题样式 */
:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3) {
  color: rgb(17 24 39);
  font-weight: 600;
}

:root.dark :deep(.prose h1),
:root.dark :deep(.prose h2),
:root.dark :deep(.prose h3) {
  color: white;
}

/* 行内代码块样式 */
:deep(.prose code) {
  background-color: rgb(243 244 246);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

:root.dark :deep(.prose code) {
  background-color: rgb(39 39 42);
}

/* 代码块容器样式 */
:deep(.prose pre) {
  background-color: rgb(17 24 39);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
}

:root.dark :deep(.prose pre) {
  background-color: rgb(9 9 11);
}

/* 代码块内部 code 样式（避免双重背景） */
:deep(.prose pre code) {
  background-color: transparent;
  padding: 0;
}

/* 链接样式 */
:deep(.prose a) {
  color: rgb(59 130 246);
}

:deep(.prose a:hover) {
  text-decoration: underline;
}

/* 列表缩进 */
:deep(.prose ul),
:deep(.prose ol) {
  padding-left: 1.25rem;
}

:deep(.prose ul) {
  list-style-type: disc;
}

:deep(.prose ol) {
  list-style-type: decimal;
}

/* 列表项间距 */
:deep(.prose li) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

/* 图片样式 */
:deep(.prose img) {
  border-radius: 0.5rem;
  max-width: 100%;
}
</style>

