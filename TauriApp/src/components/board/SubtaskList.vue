<template>
  <div class="space-y-1" ref="subtaskContainerRef">
    <div v-for="subtask in subtasks" :key="subtask.id" class="subtask-item" :data-task-id="subtask.id">
      <div 
        class="flex items-center gap-2 text-xs py-1 rounded hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors group cursor-grab active:cursor-grabbing"
      >
        <!-- Indentation spacer -->
        <div :style="{ width: `${level * 12}px` }"></div>

        <!-- Checkbox -->
        <input 
          type="checkbox"
          :checked="subtask.completed"
          @click.stop="toggleSubtaskCompleted(subtask)"
          class="w-3.5 h-3.5 rounded border-gray-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500 cursor-pointer flex-shrink-0"
        />

        <!-- Expand Button (if has children) -->
        <button 
          v-if="hasChildren(subtask.id)"
          @click.stop="toggleExpand(subtask.id)"
          class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <ChevronRight 
            class="w-3 h-3 transition-transform" 
            :class="{ 'rotate-90': expandedIds.has(subtask.id) }" 
          />
        </button>
        <div v-else class="w-4"></div>

        <!-- Title -->
        <span 
          @click.stop="openSubtask(subtask.id)"
          class="flex-1 cursor-pointer hover:text-blue-500 transition-colors truncate"
          :class="{ 'line-through text-gray-400': subtask.completed, 'text-gray-600 dark:text-gray-400': !subtask.completed }"
          :title="subtask.title"
        >
          {{ subtask.title }}
        </span>
      </div>

      <!-- Recursive Subtasks -->
      <SubtaskList 
        v-if="expandedIds.has(subtask.id)"
        :parent-id="subtask.id"
        :level="level + 1"
      />

      <!-- 添加子任务按钮 -->
      <button 
        v-if="expandedIds.has(subtask.id)"
        @click.stop="openNewSubtask(subtask.id)"
        class="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium py-1 mt-1 ml-1 pl-[level * 12 + 16]px"
        :style="{ paddingLeft: `${(level + 1) * 12 + 4}px` }"
      >
        <Plus class="w-3 h-3" />
        Add subtask
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
import { Task, useTaskStore } from '@/stores/task';
import { useTaskModal } from '@/composables/useTaskModal';
import { ChevronRight } from 'lucide-vue-next';
import Sortable from 'sortablejs';

interface Props {
  parentId: string;
  level?: number;
}

const props = withDefaults(defineProps<Props>(), {
  level: 0
});

const taskStore = useTaskStore();
const { openTask: openTaskModal, pushTask, openNewTask } = useTaskModal(); 

function openNewSubtask(parentId: string) {
  const task = taskStore.tasks.find(t => t.id === parentId);
  if (!task) return;
  
  openNewTask({
    projectId: task.projectId,
    columnId: task.columnId,
    parentId: parentId
  });
}
// State
const expandedIds = ref(new Set<string>());
const subtaskContainerRef = ref<HTMLElement | null>(null);
let sortableInstance: Sortable | null = null;

// Computed
const subtasks = computed(() => taskStore.getSubtasks(props.parentId).filter(t => !t.isTrashed));

function initSortable() {
  if (subtaskContainerRef.value && !sortableInstance) {
    sortableInstance = Sortable.create(subtaskContainerRef.value, {
      group: 'tasks',
      animation: 200,
      draggable: '.subtask-item',
      ghostClass: 'subtask-ghost',
      onEnd: (evt) => {
        const taskId = (evt.item as HTMLElement).dataset.taskId;
        if (!taskId) return;

        // 如果拖到了其他容器（比如看板列）
        if (evt.from !== evt.to) {
          const toColumnId = (evt.to as HTMLElement).dataset.columnId;
          if (toColumnId) {
            // 变成一级任务
            taskStore.updateTask(taskId, { 
              parentId: undefined, 
              columnId: toColumnId 
            });
            // 重新排序逻辑会在 BoardView 的 onAdd 或 onEnd 中处理，
            // 或者是这里手动触发一次 reorder
            const taskCards = Array.from(evt.to.querySelectorAll('[data-task-id]'));
            const taskIds = taskCards
              .map(el => (el as HTMLElement).dataset.taskId)
              .filter((id): id is string => !!id);
            taskStore.reorderTasks(toColumnId, '', taskIds); // projectId 传空，由 store 内部处理
          }
        } else {
          // 内部排序
          if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
            const taskIds = subtasks.value.map(t => t.id);
            const [moved] = taskIds.splice(evt.oldIndex, 1);
            taskIds.splice(evt.newIndex, 0, moved);
            
            // 更新该父级下的子任务顺序
            taskIds.forEach((id, index) => {
              const task = taskStore.tasks.find(t => t.id === id);
              if (task) task.order = index;
            });
          }
        }
      }
    });
  }
}

onMounted(() => {
  nextTick(() => initSortable());
});

onUnmounted(() => {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
});

function hasChildren(taskId: string) {
  return taskStore.getSubtasks(taskId).filter(t => !t.isTrashed).length > 0;
}

function toggleExpand(taskId: string) {
  if (expandedIds.value.has(taskId)) {
    expandedIds.value.delete(taskId);
  } else {
    expandedIds.value.add(taskId);
    // 展开后，内部的子任务列表也需要初始化 Sortable
  }
}

function toggleSubtaskCompleted(subtask: Task) {
  taskStore.updateTask(subtask.id, { completed: !subtask.completed });
}

function openSubtask(subtaskId: string) {
  let current = taskStore.tasks.find(t => t.id === subtaskId);
  const rootId = getRootId(current);
  
  if (rootId) {
      openTaskModal(rootId);
      pushTask(subtaskId);
  }
}

function getRootId(task?: Task): string | undefined {
    if (!task) return undefined;
    if (!task.parentId) return task.id;
    const parent = taskStore.tasks.find(t => t.id === task.parentId);
    return getRootId(parent);
}
</script>
