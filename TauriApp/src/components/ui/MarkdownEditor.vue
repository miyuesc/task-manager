<template>
  <div class="markdown-editor">
    <!-- 工具栏 -->
    <div class="flex items-center gap-1 px-3 py-2 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 rounded-t-xl">
      <!-- 文本格式 -->
      <button @click="insertFormat('bold')" class="toolbar-btn" title="粗体 (Ctrl+B)">
        <Bold class="w-4 h-4" />
      </button>
      <button @click="insertFormat('italic')" class="toolbar-btn" title="斜体 (Ctrl+I)">
        <Italic class="w-4 h-4" />
      </button>
      <button @click="insertFormat('heading')" class="toolbar-btn" title="标题">
        <Heading1 class="w-4 h-4" />
      </button>

      <div class="w-px h-4 bg-gray-300 dark:bg-zinc-600 mx-1"></div>

      <!-- 插入元素 -->
      <button @click="insertFormat('link')" class="toolbar-btn" title="链接 (Ctrl+K)">
        <Link class="w-4 h-4" />
      </button>
      <button @click="insertImage" class="toolbar-btn" title="插入图片">
        <Image class="w-4 h-4" />
      </button>
      <button @click="insertFormat('code')" class="toolbar-btn" title="代码块">
        <Code class="w-4 h-4" />
      </button>

      <div class="w-px h-4 bg-gray-300 dark:bg-zinc-600 mx-1"></div>

      <!-- 列表 -->
      <button @click="insertFormat('list')" class="toolbar-btn" title="列表">
        <List class="w-4 h-4" />
      </button>

      <div class="flex-1"></div>

      <!-- 实时预览提示 -->
      <span class="text-xs text-gray-400 mr-2">{{ t('common.live_preview') }}</span>
    </div>

    <!-- 编辑区域：左右分栏实时预览 -->
    <div class="flex min-h-[200px]">
      <!-- 编辑器 -->
      <div class="flex-1 border-r border-gray-200 dark:border-zinc-700">
        <textarea
          ref="textareaRef"
          :value="modelValue"
          @input="onInput"
          @keydown="handleKeydown"
          :placeholder="placeholder"
          class="w-full h-full bg-transparent border-none focus:ring-0 text-sm text-gray-700 dark:text-gray-300 resize-none min-h-[200px] p-4 placeholder-gray-400 font-mono"
        ></textarea>
      </div>

      <!-- 实时预览 -->
      <div class="flex-1 overflow-auto">
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
import { marked } from 'marked';
import hljs from 'highlight.js';
import { Bold, Italic, Heading1, Link, Image, Code, List } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// 配置 marked 使用代码高亮
marked.use({
  breaks: true,
  gfm: true,
});

// 使用 marked 的 renderer 进行代码高亮
const renderer = new marked.Renderer();
renderer.code = function({ text, lang }: { text: string; lang?: string }) {
  const language = lang || '';
  const validLang = hljs.getLanguage(language) ? language : 'plaintext';
  const highlighted = hljs.highlight(text, { language: validLang }).value;
  return `<pre><code class="hljs language-${validLang}">${highlighted}</code></pre>`;
};
marked.use({ renderer });

interface Props {
  modelValue: string;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '添加描述...',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const textareaRef = ref<HTMLTextAreaElement | null>(null);

const renderedContent = computed(() => {
  if (!props.modelValue) return `<p class="text-gray-400">${t('common.no_description')}</p>`;
  return marked(props.modelValue);
});

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
}

// 快捷键处理
function handleKeydown(e: KeyboardEvent) {
  const isMod = e.metaKey || e.ctrlKey;
  
  if (isMod && e.key === 'b') {
    e.preventDefault();
    insertFormat('bold');
  } else if (isMod && e.key === 'i') {
    e.preventDefault();
    insertFormat('italic');
  } else if (isMod && e.key === 'k') {
    e.preventDefault();
    insertFormat('link');
  }
}

function insertFormat(type: string) {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = props.modelValue || '';
  const selected = text.substring(start, end);

  let insert = '';
  let cursorOffset = 0;

  switch (type) {
    case 'bold':
      insert = `**${selected || '粗体文本'}**`;
      cursorOffset = selected ? insert.length : 2;
      break;
    case 'italic':
      insert = `*${selected || '斜体文本'}*`;
      cursorOffset = selected ? insert.length : 1;
      break;
    case 'heading':
      insert = `\n## ${selected || '标题'}\n`;
      cursorOffset = selected ? insert.length : 4;
      break;
    case 'link':
      insert = `[${selected || '链接文本'}](url)`;
      cursorOffset = selected ? insert.length : 1;
      break;
    case 'code':
      insert = selected.includes('\n')
        ? `\n\`\`\`\n${selected || '代码'}\n\`\`\`\n`
        : `\`${selected || '代码'}\``;
      cursorOffset = selected ? insert.length : 1;
      break;
    case 'list':
      insert = `\n- ${selected || '列表项'}`;
      cursorOffset = insert.length;
      break;
  }

  const newText = text.substring(0, start) + insert + text.substring(end);
  emit('update:modelValue', newText);

  // 恢复焦点和光标位置
  setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
  }, 0);
}

function insertImage() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const insert = `![${file.name}](${url})`;
      const textarea = textareaRef.value;
      if (textarea) {
        const start = textarea.selectionStart;
        const text = props.modelValue || '';
        const newText = text.substring(0, start) + insert + text.substring(start);
        emit('update:modelValue', newText);
      }
    }
  };
  input.click();
}
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

/* Markdown 预览样式 */
:deep(.prose) {
  color: rgb(55 65 81);
}

:root.dark :deep(.prose) {
  color: rgb(209 213 219);
}

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

:deep(.prose code) {
  background-color: rgb(243 244 246);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

:root.dark :deep(.prose code) {
  background-color: rgb(39 39 42);
}

:deep(.prose pre) {
  background-color: rgb(17 24 39);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
}

:root.dark :deep(.prose pre) {
  background-color: rgb(9 9 11);
}

:deep(.prose pre code) {
  background-color: transparent;
  padding: 0;
}

:deep(.prose a) {
  color: rgb(59 130 246);
}

:deep(.prose a:hover) {
  text-decoration: underline;
}

:deep(.prose ul),
:deep(.prose ol) {
  padding-left: 1.25rem;
}

:deep(.prose li) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
}

:deep(.prose img) {
  border-radius: 0.5rem;
  max-width: 100%;
}
</style>
