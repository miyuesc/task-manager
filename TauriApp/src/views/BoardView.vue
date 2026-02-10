<template>
  <div class="h-full flex gap-4 overflow-x-auto px-6 py-4" ref="boardContainer">
    <!-- Columns Container -->
    <div ref="columnsRef" class="flex gap-4">
      <div 
        v-for="column in sortedColumns" 
        :key="column.id"
        :data-column-id="column.id"
        class="kanban-column w-72 flex-shrink-0 flex flex-col max-h-full"
      >
        <!-- Column Header -->
        <div class="flex items-center justify-between mb-3 px-1 column-drag-handle cursor-grab active:cursor-grabbing">
          <div class="flex items-center gap-2">
            <!-- 双击编辑列名 -->
            <input 
              v-if="editingColumnId === column.id"
              ref="columnInputRefs"
              v-model="editingColumnName"
              @keydown.enter="saveColumnName"
              @keydown.escape="cancelEditColumn"
              @blur="saveColumnName"
              class="text-sm font-semibold bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 focus:ring-2 focus:ring-blue-500 rounded px-1.5 py-0.5 text-gray-900 dark:text-white min-w-0 w-32"
            />
            <h3 
              v-else
              @dblclick="startEditColumn(column)"
              class="font-semibold text-gray-900 dark:text-white text-sm px-1.5 py-0.5"
            >
              {{ column.name }}
            </h3>
            <span class="text-gray-400 dark:text-gray-500 text-sm font-medium bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
              {{ getColumnTaskCount(column.id) }}
            </span>
          </div>
          <button 
            @click="showColumnMenu(column.id, $event)"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <MoreHorizontal class="w-4 h-4" />
          </button>
        </div>

        <!-- Task List -->
        <div 
          ref="taskContainerRefs"
          :data-column-id="column.id"
          class="task-container flex-1 overflow-y-auto space-y-2 scrollbar-hide min-h-[100px] pb-2"
        >
          <div 
            v-for="task in getColumnTasks(column.id)" 
            :key="task.id"
            :data-task-id="task.id"
            class="task-card"
          >
            <TaskCard 
              :task="task" 
              @click="openTask(task.id)" 
              @context-menu="handleTaskContextMenu"
            />
          </div>

          <!-- Quick Add: 改为直接显示按钮 -->
          <button 
            @click="startQuickAdd(column.id)"
            class="flex items-center gap-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Plus class="w-4 h-4" />
            <span>{{ t('task.new_task') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Add Column Button -->
    <div class="w-72 flex-shrink-0">
      <div v-if="isAddingColumn" class="bg-white dark:bg-zinc-800 rounded-xl border border-blue-300 dark:border-blue-700 p-3 shadow-sm">
        <input 
          ref="newColumnInputRef"
          v-model="newColumnName"
          @keydown.enter="confirmAddColumn"
          @keydown.escape="cancelAddColumn"
          @blur="confirmAddColumn"
          class="w-full text-sm bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white placeholder-gray-400"
          placeholder="Column name..."
        />
      </div>
      <button 
        v-else
        @click="startAddColumn"
        class="flex items-center gap-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600 transition-colors w-full"
      >
        <Plus class="w-4 h-4" />
        <span>{{ t('board.add_column') }}</span>
      </button>
    </div>
  </div>

  <!-- Column Context Menu -->
  <Teleport to="body">
    <div 
      v-if="columnMenuId"
      class="fixed z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 py-1 min-w-[160px]"
      :style="{ left: columnMenuPosition.x + 'px', top: columnMenuPosition.y + 'px' }"
      @click.stop
    >
      <button 
        @click="handleColumnAction('rename')"
        class="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2"
      >
        <Pencil class="w-4 h-4" />
        {{ t('common.rename') }}
      </button>
      <button 
        @click="handleColumnAction('progressing')"
        class="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2"
      >
        <div class="w-4 h-4 rounded border-2 flex items-center justify-center" :class="isProgressingColumn(columnMenuId!) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-zinc-600'">
          <Check v-if="isProgressingColumn(columnMenuId!)" class="w-3 h-3 text-white" />
        </div>
        {{ t('common.show_in_progressing') }}
      </button>
      <button 
        @click="handleColumnAction('completed')"
        class="w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2"
      >
        <div class="w-4 h-4 rounded border-2 flex items-center justify-center" :class="isCompletedColumn(columnMenuId!) ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-zinc-600'">
          <Check v-if="isCompletedColumn(columnMenuId!)" class="w-3 h-3 text-white" />
        </div>
        {{ t('common.show_in_completed') }}
      </button>
      <div class="h-px bg-gray-200 dark:bg-zinc-700 my-1"></div>
      <button 
        @click="handleColumnAction('delete')"
        class="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
      >
        <Trash2 class="w-4 h-4" />
        {{ t('common.delete') }}
      </button>
    </div>
  </Teleport>

  <!-- Task Context Menu -->
  <ContextMenu 
    v-if="taskContextMenu"
    :x="taskContextMenu.x"
    :y="taskContextMenu.y"
    :items="taskMenuItems"
    @select="handleMenuSelect"
    @close="taskContextMenu = null"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import Sortable from 'sortablejs';
import { useColumnStore } from '@/stores/column';
import { useProjectStore } from '@/stores/project';
import { useTaskStore, Task } from '@/stores/task';
import { useTaskModal } from '@/composables/useTaskModal';
import TaskCard from '@/components/board/TaskCard.vue';
import ContextMenu from '@/components/common/ContextMenu.vue';
import { MoreHorizontal, Plus, Pencil, Check, Trash2, BarChart3 } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const route = useRoute();
const columnStore = useColumnStore();
const taskStore = useTaskStore();
const { openTask, openNewTask } = useTaskModal();

const projectId = computed(() => route.params.id as string);

// DOM 引用
// DOM 引用
const columnsRef = ref<HTMLElement | null>(null);
const newColumnInputRef = ref<HTMLInputElement | null>(null);

const projectStore = useProjectStore();

// Sortable 实例
let columnSortable: Sortable | null = null;
const taskSortables: Map<string, Sortable> = new Map();

// 按 order 排序的列
const sortedColumns = computed(() => {
  return [...columnStore.columns].sort((a, b) => a.order - b.order);
});

// 获取列的任务
function getColumnTasks(columnId: string): Task[] {
  return taskStore.tasks
    .filter(t => 
      t.columnId === columnId && 
      !t.parentId &&
      (!projectId.value || t.projectId === projectId.value)
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function getColumnTaskCount(columnId: string) {
  return getColumnTasks(columnId).length;
}

// 初始化 Sortable
function initSortables() {
  // 列排序
  if (columnsRef.value && !columnSortable) {
    columnSortable = Sortable.create(columnsRef.value, {
      animation: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      handle: '.column-drag-handle',
      draggable: '.kanban-column',
      ghostClass: 'column-ghost',
      chosenClass: 'column-chosen',
      dragClass: 'column-drag',
      forceFallback: true, // 修复 macOS 拖拽兼容性
      fallbackOnBody: true, // 确保拖拽层级正确
      onEnd: (evt) => {
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
          const columnIds = sortedColumns.value.map(c => c.id);
          const [moved] = columnIds.splice(evt.oldIndex, 1);
          columnIds.splice(evt.newIndex, 0, moved);
          columnStore.reorderColumns(columnIds);
        }
      },
    });
  }

  // 任务排序
  nextTick(() => {
    const containers = document.querySelectorAll('.task-container');
    containers.forEach((container) => {
      const columnId = (container as HTMLElement).dataset.columnId;
      if (!columnId || taskSortables.has(columnId)) return;

      const sortable = Sortable.create(container as HTMLElement, {
        animation: 200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        group: 'tasks',
        draggable: '.task-card',
        ghostClass: 'task-ghost',
        chosenClass: 'task-chosen',
        dragClass: 'task-drag',
        forceFallback: true, // 修复 macOS 拖拽兼容性
        fallbackOnBody: true,
        swapThreshold: 0.65,
        onEnd: (evt) => {
          const taskId = (evt.item as HTMLElement).dataset.taskId;
          const fromColumnId = (evt.from as HTMLElement).dataset.columnId;
          const toColumnId = (evt.to as HTMLElement).dataset.columnId;
          
          if (!taskId || !toColumnId) return;
          
          // 获取新顺序
          const taskCards = Array.from(evt.to.querySelectorAll('.task-card'));
          const taskIds = taskCards
            .map(el => (el as HTMLElement).dataset.taskId)
            .filter((id): id is string => !!id);
          
          // 跨列移动
          if (fromColumnId !== toColumnId) {
            taskStore.moveTask(taskId, toColumnId, evt.newIndex);
          }
          
          // 更新顺序
          taskStore.reorderTasks(toColumnId, projectId.value, taskIds);
        },
      });
      
      taskSortables.set(columnId, sortable);
    });
  });
}

// 销毁 Sortable
function destroySortables() {
  if (columnSortable) {
    columnSortable.destroy();
    columnSortable = null;
  }
  taskSortables.forEach(sortable => sortable.destroy());
  taskSortables.clear();
}

// 监听列变化，重新初始化任务排序
watch(
  () => sortedColumns.value.map(c => c.id).join(','),
  () => {
    nextTick(() => {
      // 清理已删除列的 sortable
      const currentColumnIds = new Set(sortedColumns.value.map(c => c.id));
      taskSortables.forEach((_, columnId) => {
        if (!currentColumnIds.has(columnId)) {
          taskSortables.get(columnId)?.destroy();
          taskSortables.delete(columnId);
        }
      });
      initSortables();
    });
  }
);

onMounted(() => {
  nextTick(() => {
    initSortables();
  });
  document.addEventListener('click', closeColumnMenu);
});

onUnmounted(() => {
  destroySortables();
  document.removeEventListener('click', closeColumnMenu);
});

// 列名编辑
const editingColumnId = ref<string | null>(null);
const editingColumnName = ref('');

function startEditColumn(column: { id: string, name: string }) {
  editingColumnId.value = column.id;
  editingColumnName.value = column.name;
  nextTick(() => {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
      if (input.value === column.name) {
        input.focus();
        input.select();
      }
    });
  });
}

function saveColumnName() {
  if (editingColumnId.value && editingColumnName.value.trim()) {
    columnStore.updateColumn(editingColumnId.value, { name: editingColumnName.value.trim() });
  }
  editingColumnId.value = null;
}

function cancelEditColumn() {
  editingColumnId.value = null;
}

// 列菜单
const columnMenuId = ref<string | null>(null);
const columnMenuPosition = ref({ x: 0, y: 0 });

function showColumnMenu(columnId: string, event: MouseEvent) {
  event.stopPropagation();
  columnMenuId.value = columnId;
  columnMenuPosition.value = { x: event.clientX, y: event.clientY };
}

function closeColumnMenu() {
  columnMenuId.value = null;
}

function isProgressingColumn(columnId: string) {
  return columnStore.progressingColumnIds.includes(columnId);
}

function isCompletedColumn(columnId: string) {
  return columnStore.completedColumnId === columnId;
}

function handleColumnAction(action: 'rename' | 'progressing' | 'completed' | 'delete') {
  if (!columnMenuId.value) return;
  
  const id = columnMenuId.value;
  
  if (action === 'rename') {
    const column = columnStore.columns.find(c => c.id === id);
    if (column) startEditColumn(column);
  } else if (action === 'progressing') {
    columnStore.toggleProgressingColumn(id);
  } else if (action === 'completed') {
    columnStore.setCompletedColumnId(id);
  } else if (action === 'delete') {
    columnStore.deleteColumn(id);
  }
  
  closeColumnMenu();
}

// 添加列
const isAddingColumn = ref(false);
const newColumnName = ref('');

function startAddColumn() {
  isAddingColumn.value = true;
  newColumnName.value = '';
  nextTick(() => {
    newColumnInputRef.value?.focus();
  });
}

function confirmAddColumn() {
  if (newColumnName.value.trim()) {
    columnStore.addColumn(newColumnName.value.trim());
    nextTick(() => initSortables());
  }
  isAddingColumn.value = false;
  newColumnName.value = '';
}

function cancelAddColumn() {
  isAddingColumn.value = false;
  newColumnName.value = '';
}

// 快速添加任务 - 改为打开 TaskDetailModal
function startQuickAdd(columnId: string) {
  // 打开 TaskDetailModal，预设当前项目和列
  openNewTask({
    projectId: projectId.value || undefined,
    columnId: columnId,
  });
}

// Task Context Menu
const taskContextMenu = ref<{ x: number, y: number, task: Task } | null>(null);

function handleTaskContextMenu(event: MouseEvent, task: Task) {
  taskContextMenu.value = { x: event.clientX, y: event.clientY, task };
}

const taskMenuItems = computed(() => {
   if (!taskContextMenu.value) return [];
   
   const task = taskContextMenu.value.task;
   
   if (task.isTrashed) {
     return [
       { label: t('task.restore'), action: 'restore', icon: Check, class: 'text-green-600' },
       { separator: true },
       { label: t('task.delete_permanently'), action: 'delete-permanently', icon: Trash2, class: 'text-red-600' }
     ];
   }

   const items: any[] = [
     { label: t('priority.high'), action: 'priority-high', icon: BarChart3, class: 'text-red-500' },
     { label: t('priority.medium'), action: 'priority-medium', icon: BarChart3, class: 'text-amber-500' },
     { label: t('priority.low'), action: 'priority-low', icon: BarChart3, class: 'text-green-500' },
     { separator: true },
   ];
   
   // Move to Project
   items.push({ label: t('task.move_to') + ' ' + t('task.project_board'), disabled: true, class: 'text-xs font-semibold text-gray-400 uppercase tracking-wider pl-2' });
   projectStore.projects.forEach(p => {
     if (p.id !== task.projectId) {
       items.push({ label: p.name, action: `move-project:${p.id}`, class: 'pl-6' });
     }
   });
   
   items.push({ separator: true });

   // Move to Column
   items.push({ label: t('task.move_to') + ' ' + t('task.column'), disabled: true, class: 'text-xs font-semibold text-gray-400 uppercase tracking-wider pl-2' }); 
   columnStore.columns.forEach(c => {
     if (c.id !== task.columnId) {
       items.push({ label: c.name, action: `move-column:${c.id}`, class: 'pl-6' });
     }
   });

   items.push({ separator: true });
   items.push({ separator: true });
   items.push({ label: t('task.trash'), action: 'trash', icon: Trash2, class: 'text-red-600' });
   items.push({ label: t('task.delete_permanently'), action: 'delete-permanently', icon: Trash2, class: 'text-red-700 bg-red-50 dark:bg-red-900/10' });
   
   return items;
});

function handleMenuSelect(action: string) {
   const task = taskContextMenu.value?.task;
   if (!task) return;
   
   if (action === 'trash') {
      taskStore.trashTask(task.id);
   } else if (action === 'restore') {
      taskStore.restoreTask(task.id);
   } else if (action === 'delete-permanently') {
      taskStore.deleteTask(task.id);
   } else if (action.startsWith('priority-')) {
      const p = action.replace('priority-', '') as any;
      taskStore.updateTask(task.id, { priority: p });
   } else if (action.startsWith('move-project:')) {
      const projectId = action.replace('move-project:', '');
      taskStore.updateTask(task.id, { projectId });
   } else if (action.startsWith('move-column:')) {
      const columnId = action.replace('move-column:', '');
      taskStore.moveTask(task.id, columnId);
   }
   
   taskContextMenu.value = null; 
}
</script>

<style>
/* 任务卡片容器 - 确保拖拽时样式一致 */
.task-card {
  border-radius: 12px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  will-change: transform;
  -webkit-user-drag: element;
  cursor: grab;
}

.task-card:active {
  cursor: grabbing;
}

/* 列拖拽样式 */
.column-ghost {
  opacity: 0.4;
  background: #e0e7ff;
  border-radius: 12px;
}

.column-chosen {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
}

.column-drag {
  transform: rotate(2deg);
  border-radius: 12px;
}

/* 任务卡片拖拽样式 */
.task-ghost, .subtask-ghost {
  opacity: 0.4;
  background: #dbeafe !important;
  border-radius: 12px;
  box-shadow: none !important;
}

.task-ghost > *, .subtask-ghost > * {
  visibility: hidden;
}

.task-chosen {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transform: scale(1.02);
  border-radius: 12px;
  z-index: 100;
}

.task-chosen > div {
  border-radius: 12px;
}

.task-drag {
  transform: rotate(1deg) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  z-index: 100;
}

.task-drag > div {
  border-radius: 12px;
}

/* 拖拽中禁用所有过渡动画，防止闪烁 */
.sortable-fallback {
  transition: none !important;
}

.sortable-ghost {
  transition: none !important;
}

/* 拖拽中的全局状态 */
body.is-dragging {
  cursor: grabbing !important;
  user-select: none;
}

body.is-dragging * {
  cursor: grabbing !important;
}

/* 防止拖拽时的样式闪烁 */
body.is-dragging .task-card,
body.is-dragging .kanban-column {
  transition: none !important;
}

/* 滚动条隐藏 */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 任务容器最小高度，确保空列可以接收拖拽 */
.task-container {
  min-height: 100px;
}
</style>

