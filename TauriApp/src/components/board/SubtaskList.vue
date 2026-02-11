<template>
  <div 
    class="space-y-1 subtask-container transition-all duration-200 group/subtasks" 
    ref="subtaskContainerRef" 
    :data-subtask-container="true" 
    :data-parent-task-id="parentId"
  >


    <div v-for="subtask in subtasks" :key="subtask.id" class="subtask-item" :data-task-id="subtask.id">
      <div 
        class="flex items-center gap-2 text-xs py-1 rounded hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors group cursor-grab active:cursor-grabbing"
        :class="{ 'opacity-50 grayscale': subtask.isTrashed }"
        @contextmenu.prevent.stop="$emit('context-menu', $event, subtask)"
      >
        <!-- Indentation spacer -->
        <div :style="{ width: `${level * 12}px` }"></div>

        <!-- Checkbox -->
        <input 
          type="checkbox"
          :checked="subtask.completed"
          :disabled="subtask.isTrashed"
          @click.stop="toggleSubtaskCompleted(subtask)"
          class="w-3.5 h-3.5 rounded border-gray-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500 cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <!-- Expand Button (if has children) -->
        <button 
          v-if="hasChildren(subtask.id)"
          @click.stop="toggleExpand(subtask.id)"
          class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <ChevronRight 
            class="w-3 h-3 transition-transform" 
            :class="{ 'rotate-90': taskStore.isSubtaskExpanded(subtask.id) }" 
          />
        </button>
        <div v-else class="w-4"></div>

        <!-- Title -->
        <span 
          @click.stop="openSubtask(subtask.id)"
          class="flex-1 cursor-pointer hover:text-blue-500 transition-colors truncate"
          :class="{ 
            'line-through text-gray-400 dark:text-gray-500 decoration-gray-400': subtask.completed || subtask.isTrashed, 
            'text-gray-600 dark:text-gray-400': !subtask.completed && !subtask.isTrashed 
          }"
          :title="subtask.title"
        >
          {{ subtask.title }}
        </span>
      </div>

      <!-- Recursive Subtasks -->
      <SubtaskList 
        v-if="taskStore.isSubtaskExpanded(subtask.id)"
        :parent-id="subtask.id"
        :level="level + 1"
        @context-menu="(e, t) => $emit('context-menu', e, t)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { Task, useTaskStore } from '@/stores/task';
import { useColumnStore } from '@/stores/column';
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

const emit = defineEmits<{
  (e: 'context-menu', event: MouseEvent, task: Task): void
}>();

const taskStore = useTaskStore();
const columnStore = useColumnStore();
const { openTask: openTaskModal, pushTask } = useTaskModal(); 

// State
const subtaskContainerRef = ref<HTMLElement | null>(null);
let sortableInstance: Sortable | null = null;

// Computed
const subtasks = computed(() => taskStore.getSubtasks(props.parentId));

// 初始化 Sortable
function initSortable() {
  if (subtaskContainerRef.value && !sortableInstance) {
    const isRootLevel = props.level === 0;
    
    sortableInstance = Sortable.create(subtaskContainerRef.value, {
      // 允许从一级任务拖入变成二级子任务，但禁止拖入变成三级及以上子任务
      group: {
        name: 'tasks',
        put: isRootLevel, // 只有一级任务的子任务列表允许接收拖入
        pull: true
      },
      animation: 200,
      draggable: '[data-task-id]',
      ghostClass: 'subtask-ghost',
      chosenClass: 'task-chosen',
      dragClass: 'task-drag',
      forceFallback: true,
      fallbackOnBody: true,
      swapThreshold: 0.65,
      // 禁用 onMove 以避免与 BoardView 冲突，或者根据需要实现
      // 这里我们主要依赖 onEnd 来处理数据更新
      onEnd: (evt) => {
        const taskId = (evt.item as HTMLElement).dataset.taskId;
        if (!taskId) return;

        // 注意：不要手动操作 DOM (如 removeChild/insertBefore)
        // SortableJS 已经移动了 DOM，我们只需更新数据，Vue 会自动纠正视图
        
        // 检测拖拽目标
        const toElement = evt.to as HTMLElement;
        const toColumnId = toElement.dataset.columnId;
        const isSubtaskContainer = toElement.dataset.subtaskContainer === 'true';
        const parentTaskId = toElement.dataset.parentTaskId;

        // 1. 同容器排序 (子任务内排序)
        if (evt.from === evt.to) {
          if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
            const taskIds = subtasks.value.map(t => t.id);
            const [moved] = taskIds.splice(evt.oldIndex, 1);
            taskIds.splice(evt.newIndex, 0, moved);
            
            // 手动更新顺序，不改变 columnId
            taskIds.forEach((id, index) => {
              const task = taskStore.tasks.find(t => t.id === id);
              if (task) {
                task.order = index;
              }
            });
          }
          return;
        }

        // 2. 拖拽到看板列 (子任务 -> 一级任务)
        if (toColumnId) {
             // 变成一级任务
             const task = taskStore.tasks.find(t => t.id === taskId);
             if (!task) return;

             const isCompletedColumn = columnStore.completedColumnId === toColumnId;
             const shouldBeCompleted = isCompletedColumn;

             // 更新任务状态
             taskStore.updateTask(taskId, {
                parentId: undefined,
                columnId: toColumnId,
                projectId: task.projectId, // 保持项目不变
                completed: shouldBeCompleted,
             });
             
             // 如果变成已完成
             if (shouldBeCompleted) {
                // 递归完成所有子任务
                recursiveUpdateCompletion(taskId, true);
             } else {
                // 如果是从已完成变成未完成（不太可能，因为子任务本身有状态）
                // 但如果这子任务之前是完成的，移到 progressing 列，应变为未完成
                if (task.completed) {
                   recursiveUpdateCompletion(taskId, false);
                }
             }

             // 在新列中的排序
             // 我们无法轻易获取新列的完整列表因为 dom 已经恢复。
             // 只能由 store 更新后放到默认位置（通常是末尾或根据 order）。
             // 如果需要精确排序，可在 updateTask 后立即 reorder。
             // 这里简化处理，先变成一级任务。
             return;
        }

        // 3. 拖拽到其他子任务列表 (子任务 -> 其他父任务的子任务)
        if (isSubtaskContainer && parentTaskId && parentTaskId !== props.parentId) {
             // 改变父任务
             const parentTask = taskStore.tasks.find(t => t.id === parentTaskId);
             const shouldBeCompleted = parentTask?.completed || false;
             
             if (parentTask) {
                taskStore.updateTask(taskId, {
                   parentId: parentTaskId,
                   projectId: parentTask.projectId, // 继承项目 ID
                   columnId: parentTask.columnId,   // 继承列 ID
                   completed: shouldBeCompleted,
                });

                // 递归更新子任务的项目 ID、列 ID 和完成状态
                recursiveUpdateChildrenConfig(taskId, parentTask.projectId, parentTask.columnId, shouldBeCompleted);
             }
             return;
        }
      }
    });
  }
}

/**
 * 递归更新子任务的配置 (Project, Column, Completion)
 */
function recursiveUpdateChildrenConfig(parentId: string, projectId: string, columnId: string, shouldBeCompleted: boolean) {
  const children = taskStore.getSubtasks(parentId);
  children.forEach(child => {
    taskStore.updateTask(child.id, {
      projectId: projectId,
      columnId: columnId,
      completed: shouldBeCompleted,
    });
    recursiveUpdateChildrenConfig(child.id, projectId, columnId, shouldBeCompleted);
  });
}

/**
 * 递归更新任务及其所有子任务的完成状态
 */
function recursiveUpdateCompletion(taskId: string, shouldBeCompleted: boolean) {
  const children = taskStore.getSubtasks(taskId);
  children.forEach(child => {
    taskStore.updateTask(child.id, {
        completed: shouldBeCompleted,
    });
    recursiveUpdateCompletion(child.id, shouldBeCompleted);
  });
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

// 监听数据变化，必要时刷新 Sortable
watch(subtasks, () => {
  // Sortable 通常能自动处理 DOM 变化，但在某些情况下可能需要刷新或重建
});

function hasChildren(taskId: string) {
  return taskStore.getSubtasks(taskId).length > 0;
}

function toggleExpand(taskId: string) {
  taskStore.toggleSubtaskExpansion(taskId);
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
