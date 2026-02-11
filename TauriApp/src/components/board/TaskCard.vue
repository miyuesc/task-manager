<template>
  <div 
    class="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 transition-shadow duration-200 group overflow-hidden"
    :class="{ 
      'border-l-4': leftBorderColor, 
      'hover:shadow-md': true,
      'grayscale opacity-75': task.completed || task.isTrashed 
    }"
    :style="leftBorderColor ? { borderLeftColor: leftBorderColor } : {}"
    @contextmenu.prevent="$emit('context-menu', $event, task)"
  >
    <!-- Main Content -->
    <div class="p-3">
      <!-- Header: Checkbox + Title + Expand -->
      <div class="flex items-start gap-2">
        <input 
          v-if="task.columnId !== columnStore.completedColumnId"
          type="checkbox" 
          :checked="task.completed"
          :disabled="task.isTrashed"
          class="mt-0.5 w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          @click.stop="toggleTaskCompleted"
        />
        <div class="flex-1 min-w-0 cursor-pointer">
          <p 
            class="text-sm font-medium leading-snug" 
            :class="{ 
              'line-through text-gray-500 dark:text-gray-400': task.isTrashed,
              'text-gray-500 dark:text-gray-400': task.completed && !task.isTrashed,
              'text-gray-900 dark:text-gray-50': !task.completed && !task.isTrashed
            }"
          >
            {{ task.title }}
          </p>
          <!-- Description preview (default show, with markdown support) -->
          <div 
            v-if="task.description" 
            class="mt-1.5 text-xs text-gray-500 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none"
            :class="{ 'line-clamp-3': !isExpanded }"
            v-html="markdownParser.parse(task.description)"
          ></div>
        </div>
        <!-- 展开/收起按钮（仅有详情内容时显示） -->
        <button 
          v-if="task.description"
          @click.stop="toggleExpand"
          class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
          :class="{ 'opacity-100': isExpanded }"
        >
          <ChevronDown class="w-4 h-4 transition-transform" :class="{ 'rotate-180': isExpanded }" />
        </button>
      </div>

      <!-- Meta Row: Priority Badge + Due Date -->
      <div v-if="task.priority || task.dueDate" class="flex items-center gap-2 mt-2 ml-6">
        <!-- Priority Badge -->
        <span 
          v-if="task.priority" 
          class="text-xs px-2 py-0.5 rounded-full font-medium"
          :class="priorityBadgeClass"
        >
          {{ t('priority.' + task.priority) }}
        </span>
        <!-- Due Date -->
        <span v-if="task.dueDate" class="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Clock class="w-3 h-3" />
          {{ formatDate(task.dueDate) }}
        </span>
      </div>

      <!-- Subtasks Section -->
      <div v-if="subtasks.length > 0 || isSubtaskExpanded" class="mt-3">
        <!-- Subtask Header: Toggle + Progress Ring (仅在有子任务时显示) -->
        <div v-if="subtasks.length > 0" class="flex items-center gap-2" @click.stop="toggleSubtaskExpand">
          <!-- 圆环进度指示器 -->
          <div class="relative w-5 h-5 cursor-pointer">
            <svg class="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
              <circle 
                cx="10" cy="10" r="8" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2"
                class="text-gray-200 dark:text-zinc-700"
              />
              <circle 
                cx="10" cy="10" r="8" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="progressOffset"
                class="text-blue-500 transition-all duration-300"
              />
            </svg>
          </div>
          <!-- 子任务统计文本 -->
          <span class="text-xs text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-blue-500 transition-colors">
            {{ completedSubtasks }}/{{ subtasks.length }}
          </span>
          <!-- 展开收起图标 -->
          <ChevronDown 
            class="w-3.5 h-3.5 text-gray-400 transition-transform cursor-pointer" 
            :class="{ 'rotate-180': isSubtaskExpanded }"
          />
        </div>

        <!-- Subtasks List - 展开时始终显示容器以接收拖拽 -->
        <SubtaskList 
          v-if="isSubtaskExpanded" 
          class="mt-2 pl-1" 
          :parent-id="task.id" 
          @context-menu="(e, t) => $emit('context-menu', e, t)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Task, useTaskStore } from '@/stores/task';
import { useColumnStore } from '@/stores/column';
import { ChevronDown, Clock } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import SubtaskList from './SubtaskList.vue'; // Import SubtaskList
import { markdownParser } from '@/utils/markdown';

const { t, locale } = useI18n();

const props = defineProps<{
  task: Task
}>();

defineEmits<{
  (e: 'context-menu', event: MouseEvent, task: Task): void
}>();


const taskStore = useTaskStore();
const columnStore = useColumnStore();
const isExpanded = ref(false);
const isSubtaskExpanded = computed(() => taskStore.expandedSubtaskIds.includes(props.task.id));

const subtasks = computed(() => taskStore.getSubtasks(props.task.id));
const completedSubtasks = computed(() => {
    // Count ALL completed descendant subtasks? Or just direct children?
    // The previous logic was just direct children. Let's keep it consistent for the card summary.
    // If we want recursive count, we'd need a recursive helper.
    // For now, taskStore.getSubtasks returns direct children.
    return subtasks.value.filter(st => st.completed).length;
});

const subtaskProgress = computed(() => {
  if (subtasks.value.length === 0) return 0;
  return (completedSubtasks.value / subtasks.value.length) * 100;
});

// 圆环进度计算
const circumference = 2 * Math.PI * 8; // r=8
const progressOffset = computed(() => {
  return circumference - (subtaskProgress.value / 100) * circumference;
});

const leftBorderColor = computed(() => {
  switch (props.task.priority) {
    case 'high': return '#ef4444';
    case 'medium': return '#3b82f6';
    case 'low': return '#10b981';
    default: return null;
  }
});

const priorityBadgeClass = computed(() => {
  switch (props.task.priority) {
    case 'high': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    case 'medium': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    case 'low': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
    default: return 'bg-gray-100 text-gray-600';
  }
});

// 展开/收起详情
function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

// 展开/收起子任务
function toggleSubtaskExpand() {
  taskStore.toggleSubtaskExpansion(props.task.id);
}

// 切换任务完成状态
function toggleTaskCompleted() {
  if (props.task.isTrashed) return;
  taskStore.updateTask(props.task.id, { completed: !props.task.completed });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  
  // Reset time part for accurate day comparison
  date.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diff = date.getTime() - now.getTime();
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return t('common.today');
  if (days === 1) return t('sidebar.tomorrow');
  if (days === -1) return t('sidebar.yesterday');
  
  return date.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' });
}
</script>

<style scoped>
.prose :where(ul, ol):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
  padding-left: 1.25rem;
}

.prose :where(li):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
  margin-top: 0;
  margin-bottom: 0;
}

.prose :where(p):not(:where([class~="not-prose"], [class~="not-prose"] *)) {
  margin-top: 0;
  margin-bottom: 0;
}

.prose :where(p):not(:first-child) {
  margin-top: 0.25rem;
}
</style>
