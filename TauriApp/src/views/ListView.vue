<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">{{ viewTitle }}</h2>
          <span class="text-xs text-gray-400">{{ filteredTasks.length }} {{ t('common.tasks') }}</span>
        </div>
        <!-- Progressing 视图配置按钮 -->
        <button 
          v-if="smartViewId === 'progressing' || smartViewId === 'completed'"
          @click="openViewConfig"
          class="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          <Settings class="w-3 h-3" />
          {{ t('common.preferences') }}
        </button>
      </div>

      <!-- Table -->
      <table class="w-full text-left text-sm table-fixed">
        <thead class="bg-gray-50/50 dark:bg-zinc-800/50 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-zinc-800">
          <tr>
            <th class="w-8 pl-4 py-3"></th>
            <th class="px-2 py-3">{{ t('task.title') }}</th> <!-- Using 'description' as Title/Task Name equivalent or add new key -->
            <th class="w-28 px-2 py-3 hidden md:table-cell">{{ t('task.status') }}</th>
            <th class="w-24 px-2 py-3 hidden sm:table-cell">{{ t('task.priority') }}</th>
            <th class="w-28 px-2 py-3 hidden sm:table-cell">{{ t('task.due_date') }}</th>
            <th class="w-28 px-2 py-3 hidden lg:table-cell">{{ t('task.project') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-zinc-800">
          <tr 
            v-for="node in visibleTasks" 
            :key="node.task.id"
            class="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
            @click="openTask(node.task.id)"
          >
            <td class="w-8 flex items-center justify-center py-2 pl-4">
              <input 
                type="checkbox" 
                :checked="node.task.completed" 
                :disabled="smartViewId === 'trash'"
                @click.stop="smartViewId === 'trash' ? null : toggleComplete(node.task)"
                class="rounded border-gray-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform"
                :class="{ 'scale-90': node.level > 0 }"
              />
            </td>
            <!-- Task Title -->
            <td class="px-2 py-2">
              <div class="flex items-center gap-2">
                <!-- Indentation Spacer -->
                <div :style="{ width: `${node.level * 24}px` }" class="shrink-0 transition-[width]"></div>
                
                <!-- Expand/Collapse Button (Only for tasks with children) -->
                <button 
                  v-if="node.hasChildren"
                  @click.stop="toggleExpand(node.task.id)"
                  class="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <component 
                    :is="node.isExpanded ? ChevronDown : ChevronRight" 
                    class="w-4 h-4"
                  />
                </button>
                <div v-else class="w-5 shrink-0"></div> <!-- Spacer with fixed width for alignment -->

                <span 
                  class="font-medium truncate transition-colors"
                  :class="{ 
                    'line-through text-gray-400 dark:text-gray-500': smartViewId === 'trash',
                    'text-gray-500 grayscale': node.task.completed && smartViewId !== 'trash',
                    'text-gray-900 dark:text-white': !node.task.completed && smartViewId !== 'trash',
                    'text-sm': node.level > 0
                  }"
                  :title="node.task.title"
                >
                  {{ node.task.title }}
                </span>
                
                <!-- Subtask Counter -->
                <span 
                  v-if="node.hasChildren" 
                  class="text-xs text-gray-400 flex items-center gap-1 shrink-0"
                  :title="`${getCompletedSubtaskCount(node.task.id)}/${getSubtaskCount(node.task.id)} Subtasks`"
                >
                  <ListTodo class="w-3 h-3" />
                  <span v-if="!node.isExpanded">
                    {{ getCompletedSubtaskCount(node.task.id) }}/{{ getSubtaskCount(node.task.id) }} 
                  </span>
                </span>
              </div>
            </td>
            <!-- Column/Status -->
            <td class="w-28 px-2 py-2 hidden md:table-cell">
              <span 
                class="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded text-xs truncate block"
                :title="getColumnName(node.task.columnId)"
              >
                {{ getColumnName(node.task.columnId) }}
              </span>
            </td>
            <!-- Priority -->
            <td class="w-24 px-2 py-2 hidden sm:table-cell">
              <span 
                v-if="node.task.priority"
                class="px-2 py-0.5 rounded-full text-xs font-medium truncate block"
                :class="[priorityClass(node.task.priority), { 'scale-90 origin-left': node.level > 0 }]"
                :title="t('priority.' + node.task.priority)"
              >
                {{ t('priority.' + node.task.priority) }}
              </span>
              <span v-else class="text-gray-400 text-xs">-</span>
            </td>
            <!-- Due Date -->
            <td class="w-28 px-2 py-2 text-gray-500 dark:text-gray-400 text-xs hidden sm:table-cell">
              <span class="truncate block" :title="formatDate(node.task.dueDate)">
                {{ formatDate(node.task.dueDate) }}
              </span>
            </td>
            <!-- Project -->
            <td class="w-28 px-2 py-2 hidden lg:table-cell">
              <div 
                class="flex items-center gap-2"
                :title="getProjectName(node.task.projectId)"
              >
                <span class="w-2 h-2 rounded-full shrink-0" :class="getProjectColor(node.task.projectId)"></span>
                <span class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ getProjectName(node.task.projectId) }}</span>
              </div>
            </td>
          </tr>
          
          <tr v-if="visibleTasks.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
              {{ t('common.noTasks') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- View Config Modal -->
  <Teleport to="body">
    <div 
      v-if="showConfigModal" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
      @click="showConfigModal = false"
    >
      <div 
        class="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md p-6 border border-gray-200 dark:border-zinc-800"
        @click.stop
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ smartViewId === 'progressing' ? t('sidebar.progressing') : t('sidebar.completed') }} {{ t('common.preferences') }}
        </h3>
        
        <div v-if="smartViewId === 'progressing'" class="space-y-2 mb-6">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {{ t('task.select_progressing_columns') }}
          </p>
          <label 
            v-for="column in columnStore.columns" 
            :key="column.id"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            <input 
              type="checkbox"
              :checked="columnStore.progressingColumnIds.includes(column.id)"
              @change="columnStore.toggleProgressingColumn(column.id)"
              class="rounded border-gray-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ column.name }}</span>
          </label>
        </div>

        <!-- Completed Config -->
        <div v-if="smartViewId === 'completed'" class="space-y-2 mb-6">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {{ t('task.select_completed_columns') }}
          </p>
           <label 
            v-for="column in columnStore.columns" 
            :key="column.id"
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            <input 
              type="radio"
              :value="column.id"
              v-model="completionColumnId"
              class="border-gray-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ column.name }}</span>
          </label>
        </div>

        <button 
          @click="showConfigModal = false"
          class="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {{ t('common.confirm') }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useTaskStore, Task } from '@/stores/task';
import { useColumnStore } from '@/stores/column';
import { useProjectStore } from '@/stores/project';
import { useLabelStore } from '@/stores/label';
import { useTaskModal } from '@/composables/useTaskModal';
import { ListTodo, Settings, ChevronRight, ChevronDown } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
const route = useRoute();
const taskStore = useTaskStore();
const columnStore = useColumnStore();
const projectStore = useProjectStore();
const labelStore = useLabelStore();
const { openTask } = useTaskModal();

const showConfigModal = ref(false);
const expandedTaskIds = ref(new Set<string>());

function toggleExpand(taskId: string) {
  const newSet = new Set(expandedTaskIds.value);
  if (newSet.has(taskId)) {
    newSet.delete(taskId);
  } else {
    newSet.add(taskId);
  }
  expandedTaskIds.value = newSet;
}

function openViewConfig() {
  showConfigModal.value = true;
}

const completionColumnId = computed({
  get: () => columnStore.completedColumnId,
  set: (val) => columnStore.setCompletedColumnId(val)
});

const projectId = computed(() => route.params.id as string);
const smartViewId = computed(() => route.path.includes('/smart/') ? route.params.id as string : null);
const labelViewId = computed(() => route.path.includes('/label/') ? route.params.id as string : null);

const viewTitle = computed(() => {
  if (smartViewId.value) {
    if (['today', 'upcoming', 'completed', 'progressing', 'yesterday', 'tomorrow'].includes(smartViewId.value)) {
      return t('sidebar.' + smartViewId.value);
    }
    return smartViewId.value;
  }
  if (labelViewId.value) {
    // Label name helper needed? Or just show label ID for now
    // Ideally use labelStore to get name
    const label = labelStore.labels.find(l => l.id === labelViewId.value);
    return label ? label.name : labelViewId.value;
  }
  // Default project view or tasks
  if (projectId.value) {
      const project = projectStore.projects.find(p => p.id === projectId.value);
      return project ? project.name : 'Unknown Project';
  }
  return t('sidebar.projects'); 
});



const filteredTasks = computed(() => {
  if (projectId.value && !smartViewId.value && !labelViewId.value) {
    return taskStore.getTasksByProject(projectId.value);
  }
  
  if (smartViewId.value) {
    switch (smartViewId.value) {
      case 'today':
        return taskStore.todayTasks;
      case 'upcoming':
        return taskStore.upcomingTasks;
      case 'progressing':
        return taskStore.progressingTasks;
      case 'completed':
        return taskStore.completedTasks;
      case 'trash':
        return taskStore.tasks.filter(t => t.isTrashed);
      default:
        // 其他情况暂时返回所有未完成的顶层任务（排除垃圾桶）
        return taskStore.tasks.filter(t => !t.parentId && !t.completed && !t.isTrashed);
    }
  }

  if (labelViewId.value) {
    return taskStore.tasks.filter(t => !t.parentId && t.labels.includes(labelViewId.value!) && !t.isTrashed);
  }

  return [];
});

type TaskNode = {
  task: Task;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
};

const visibleTasks = computed(() => {
  const result: TaskNode[] = [];
  
  const traverse = (tasks: Task[], level: number) => {
    for (const task of tasks) {
      let subtasks = taskStore.getSubtasks(task.id);
      
      // Filter out trashed subtasks unless we are in trash view
      if (smartViewId.value !== 'trash') {
        subtasks = subtasks.filter(t => !t.isTrashed);
      }

      const hasChildren = subtasks.length > 0;
      const isExpanded = expandedTaskIds.value.has(task.id);
      
      result.push({
        task,
        level,
        hasChildren,
        isExpanded
      });
      
      if (isExpanded && hasChildren) {
        traverse(subtasks, level + 1);
      }
    }
  };
  
  traverse(filteredTasks.value, 0);
  return result;
});

function toggleComplete(task: Task) {
  taskStore.updateTask(task.id, { completed: !task.completed });
}

function getColumnName(columnId: string) {
  const col = columnStore.columns.find(c => c.id === columnId);
  return col?.name || columnId;
}

function getProjectName(projectId: string) {
  const project = projectStore.getProject(projectId);
  return project?.name || 'Unknown';
}

function getProjectColor(projectId: string) {
  const project = projectStore.getProject(projectId);
  const colorMap: Record<string, string> = {
    'blue': 'bg-blue-500',
    'red': 'bg-red-500',
    'green': 'bg-emerald-500',
    'orange': 'bg-orange-500',
    'purple': 'bg-purple-500',
  };
  return colorMap[project?.color || ''] || 'bg-gray-400';
}

function getSubtaskCount(taskId: string) {
  return taskStore.getSubtasks(taskId).length;
}

function getCompletedSubtaskCount(taskId: string) {
  return taskStore.getSubtasks(taskId).filter(t => t.completed).length;
}

function priorityClass(priority: string) {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
    case 'medium': return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
    case 'low': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
    default: return 'bg-gray-100 text-gray-600';
  }
}

import { getRelativeDate } from '@/utils/date';

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  
  const today = getRelativeDate(0);
  const tomorrow = getRelativeDate(1);
  const yesterday = getRelativeDate(-1);

  if (dateStr === today) return t('common.today'); 
  if (dateStr === tomorrow) return t('sidebar.tomorrow');
  if (dateStr === yesterday) return t('sidebar.yesterday');

  const date = new Date(dateStr);
  return date.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' });
}
</script>
