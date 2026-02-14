<template>
  <div class="h-full overflow-y-auto p-6 space-y-4">
    <!-- 按项目分组展示 -->
    <div 
      v-for="project in projectsWithTasks" 
      :key="project.id"
      class="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden"
    >
      <!-- 项目 Header（可展开/折叠） -->
      <div 
        class="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between cursor-pointer select-none hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors"
        @click="toggleProject(project.id)"
      >
        <div class="flex items-center gap-3">
          <button class="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <component 
              :is="isProjectExpanded(project.id) ? ChevronDown : ChevronRight" 
              class="w-4 h-4"
            />
          </button>
          <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="getProjectColor(project.color)"></span>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-gray-50">{{ project.name }}</h2>
          <span class="text-xs text-gray-400">{{ project.tasks.length }} {{ t('common.tasks') }}</span>
        </div>
      </div>

      <!-- 任务表格（展开时显示） -->
      <table v-if="isProjectExpanded(project.id)" class="w-full text-left text-sm table-fixed">
        <thead class="bg-gray-50/50 dark:bg-zinc-800/50 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-zinc-800">
          <tr>
            <th class="w-8 pl-4 py-3"></th>
            <th class="px-2 py-3">{{ t('task.title') }}</th>
            <th class="w-40 px-2 py-3 hidden md:table-cell">{{ t('task.status') }}</th>
            <th class="w-32 px-2 py-3 hidden sm:table-cell">{{ t('task.priority') }}</th>
            <th class="w-32 px-2 py-3 hidden sm:table-cell">{{ t('task.due_date') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-zinc-800">
          <tr 
            v-for="node in getVisibleTasks(project.id)" 
            :key="node.task.id"
            class="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
            @click="openTask(node.task.id)"
          >
            <td class="w-8 flex items-center justify-center py-4 pl-4">
              <input 
                type="checkbox" 
                :checked="node.task.completed" 
                @click.stop="toggleComplete(node.task)"
                class="rounded border-gray-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500 cursor-pointer transform transition-transform"
                :class="{ 'scale-90': node.level > 0 }"
              />
            </td>
            <!-- 任务标题 -->
            <td class="px-2 py-2">
              <div class="flex items-center gap-2">
                <!-- 缩进 -->
                <div :style="{ width: `${node.level * 16}px` }" class="shrink-0 transition-[width]"></div>
                
                <!-- 展开/折叠按钮 -->
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
                <div v-else class="w-5 shrink-0"></div>

                <span 
                  class="font-medium truncate transition-colors"
                  :class="{ 
                    'text-gray-500 grayscale': node.task.completed,
                    'text-gray-900 dark:text-gray-50': !node.task.completed,
                    'text-sm': node.level > 0
                  }"
                  :title="node.task.title"
                >
                  {{ node.task.title }}
                </span>
                
                <!-- 子任务计数 -->
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
            <!-- 状态列 -->
            <td class="w-28 px-2 py-2 hidden md:table-cell">
              <span 
                class="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded text-xs truncate block"
                :title="getColumnName(node.task.columnId)"
              >
                {{ getColumnName(node.task.columnId) }}
              </span>
            </td>
            <!-- 优先级 -->
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
            <!-- 截止日期 -->
            <td class="w-28 px-2 py-2 text-gray-500 dark:text-gray-400 text-xs hidden sm:table-cell">
              <span class="truncate block" :title="formatDate(node.task.dueDate)">
                {{ formatDate(node.task.dueDate) }}
              </span>
            </td>
          </tr>
          
          <tr v-if="getVisibleTasks(project.id).length === 0">
            <td colspan="5" class="px-6 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
              {{ t('common.noTasks') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 没有任何项目时 -->
    <div 
      v-if="projectsWithTasks.length === 0" 
      class="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 px-6 py-12 text-center text-gray-400 dark:text-gray-500"
    >
      {{ t('common.noTasks') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTaskStore, Task } from '@/stores/task';
import { useColumnStore } from '@/stores/column';
import { useProjectStore, Project } from '@/stores/project';
import { useTaskModal } from '@/composables/useTaskModal';
import { ListTodo, ChevronRight, ChevronDown } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { TaskPriority, PRIORITY_CONFIG, COLOR_BG_MAP } from '@/constants/resources';
import { getRelativeDate } from '@/utils/date';

const { t, locale } = useI18n();
const taskStore = useTaskStore();
const columnStore = useColumnStore();
const projectStore = useProjectStore();
const { openTask } = useTaskModal();

// 跟踪展开的项目（默认全部展开）
const collapsedProjectIds = ref(new Set<string>());
// 跟踪展开的任务（子任务层级）
const expandedTaskIds = ref(new Set<string>());

function toggleProject(projectId: string) {
  const newSet = new Set(collapsedProjectIds.value);
  if (newSet.has(projectId)) {
    newSet.delete(projectId);
  } else {
    newSet.add(projectId);
  }
  collapsedProjectIds.value = newSet;
}

function isProjectExpanded(projectId: string) {
  return !collapsedProjectIds.value.has(projectId);
}

function toggleExpand(taskId: string) {
  const newSet = new Set(expandedTaskIds.value);
  if (newSet.has(taskId)) {
    newSet.delete(taskId);
  } else {
    newSet.add(taskId);
  }
  expandedTaskIds.value = newSet;
}

// 按项目分组的任务数据
type ProjectWithTasks = Project & { tasks: Task[] };

const projectsWithTasks = computed<ProjectWithTasks[]>(() => {
  return projectStore.projects
    .map(project => {
      const tasks = taskStore.getTasksByProject(project.id);
      return { ...project, tasks };
    })
    .filter(p => p.tasks.length > 0);
});

// 构建可见任务树
type TaskNode = {
  task: Task;
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
};

function getVisibleTasks(projectId: string): TaskNode[] {
  const project = projectsWithTasks.value.find(p => p.id === projectId);
  if (!project) return [];

  const result: TaskNode[] = [];
  
  const traverse = (tasks: Task[], level: number) => {
    for (const task of tasks) {
      const subtasks = taskStore.getSubtasks(task.id).filter(t => !t.isTrashed);
      const hasChildren = subtasks.length > 0;
      const isExpanded = expandedTaskIds.value.has(task.id);
      
      result.push({ task, level, hasChildren, isExpanded });
      
      if (isExpanded && hasChildren) {
        traverse(subtasks, level + 1);
      }
    }
  };
  
  traverse(project.tasks, 0);
  return result;
}

function toggleComplete(task: Task) {
  taskStore.updateTask(task.id, { completed: !task.completed });
}

function getColumnName(columnId: string) {
  const col = columnStore.columns.find(c => c.id === columnId);
  return col?.name || columnId;
}

function getProjectColor(color: string) {
  return COLOR_BG_MAP[color] || 'bg-gray-400';
}

function getSubtaskCount(taskId: string) {
  return taskStore.getSubtasks(taskId).length;
}

function getCompletedSubtaskCount(taskId: string) {
  return taskStore.getSubtasks(taskId).filter(t => t.completed).length;
}

function priorityClass(priority: string) {
  const config = PRIORITY_CONFIG[priority as TaskPriority];
  return config ? config.bgClass : 'bg-gray-100 text-gray-600';
}

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
