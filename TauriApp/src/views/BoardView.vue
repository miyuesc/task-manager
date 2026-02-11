<template>
  <div class="h-full flex gap-4 overflow-x-auto px-6 py-4" ref="boardContainer" @wheel="handleWheel">
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
              class="text-sm font-semibold bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 focus:ring-2 focus:ring-blue-500 rounded px-1.5 py-0.5 text-gray-900 dark:text-gray-50 min-w-0 w-32"
            />
            <h3 
              v-else
              @dblclick="startEditColumn(column)"
              class="font-semibold text-gray-900 dark:text-gray-50 text-sm px-1.5 py-0.5"
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
            :data-task-card="true"
            class="task-card-wrapper"
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
          class="w-full text-sm bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-50 placeholder-gray-400"
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
import { useConfirm } from '@/composables/useConfirm';
import TaskCard from '@/components/board/TaskCard.vue';
import ContextMenu from '@/components/common/ContextMenu.vue';
import { MoreHorizontal, Plus, Pencil, Check, Trash2, BarChart3 } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const { confirm } = useConfirm();
const route = useRoute();
const columnStore = useColumnStore();
const taskStore = useTaskStore();
const { openTask, openNewTask } = useTaskModal();

const projectId = computed(() => route.params.id as string);

// DOM 引用
// DOM 引用
const columnsRef = ref<HTMLElement | null>(null);
const newColumnInputRef = ref<HTMLInputElement | null>(null);
const boardContainer = ref<HTMLElement | null>(null);

function handleWheel(e: WheelEvent) {
  if (!boardContainer.value) return;
  
  // Shift + Scroll for Horizontal Scroll
  if (e.shiftKey) {
     if (e.deltaX === 0) {
       // Conventional Mouse wheel + Shift -> Convert Y to X
       e.preventDefault();
       boardContainer.value.scrollLeft += e.deltaY;
     }
  }
}

const projectStore = useProjectStore();

// Sortable 实例引用
let columnSortable: Sortable | null = null;
const taskSortables: Map<string, Sortable> = new Map();

// 按 order order 字段排序的列列表
const sortedColumns = computed(() => {
  return [...columnStore.columns].sort((a, b) => a.order - b.order);
});

/**
 * 获取指定列的任务列表
 * 过滤掉子任务 (parentId 存在) 和非当前项目的任务
 */
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

/**
 * 初始化 SortableJS 拖拽实例
 * 分为两部分：
 * 1. 列排序 (Column Reordering)
 * 2. 任务排序 (Task Reordering) - 支持跨列拖拽
 * 
 * 核心策略：在 onEnd 中先恢复 DOM 到拖拽前的状态，再通过 Vue store 更新驱动渲染
 * 避免 SortableJS 的 DOM 操作与 Vue 的虚拟 DOM diff 冲突
 */
function initSortables() {
  // 1. 初始化列排序
  if (columnsRef.value && !columnSortable) {
    columnSortable = Sortable.create(columnsRef.value, {
      animation: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      handle: '.column-drag-handle',
      draggable: '.kanban-column',
      ghostClass: 'column-ghost',
      chosenClass: 'column-chosen',
      dragClass: 'column-drag',
      forceFallback: true,
      fallbackOnBody: true,
      onStart: () => { isDragging = true; },
      onEnd: (evt) => {
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
          // 先恢复 DOM：将 SortableJS 移动的元素放回原位，让 Vue 来控制渲染
          const { from, item, oldIndex } = evt;
          from.removeChild(item);
          if (oldIndex < from.children.length) {
            from.insertBefore(item, from.children[oldIndex]);
          } else {
            from.appendChild(item);
          }
          
          const columnIds = sortedColumns.value.map(c => c.id);
          const [moved] = columnIds.splice(oldIndex, 1);
          columnIds.splice(evt.newIndex, 0, moved);
          columnStore.reorderColumns(columnIds);
        }
        isDragging = false;
      },
    });
  }

  // 2. 初始化任务卡片排序（针对每一列）
  initTaskSortables();
}

/**
 * 仅初始化任务拖拽实例（不影响列排序实例）
 */
function initTaskSortables() {
  nextTick(() => {
    // 1. 初始化看板列的任务容器
    const containers = document.querySelectorAll('.task-container');
    containers.forEach((container) => {
      const columnId = (container as HTMLElement).dataset.columnId;
      if (!columnId || taskSortables.has(columnId)) return;

      const sortable = Sortable.create(container as HTMLElement, {
        animation: 200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        group: 'tasks',
        draggable: '[data-task-id]', // 支持所有带 data-task-id 的元素
        ghostClass: 'task-ghost',
        chosenClass: 'task-chosen',
        dragClass: 'task-drag',
        forceFallback: true,
        fallbackOnBody: true,
        swapThreshold: 0.65,
        onMove: (evt) => {
          // 检查是否拖拽到任务卡片上
          const relatedElement = evt.related as HTMLElement;
          const isTaskCard = relatedElement?.dataset?.taskCard === 'true';
          const targetTaskId = relatedElement?.dataset?.taskId;
          
          if (isTaskCard && targetTaskId) {
            // 禁止拖拽到已是子任务的卡片上（禁止三级任务）
            const targetTask = taskStore.tasks.find(t => t.id === targetTaskId);
            if (targetTask && !targetTask.parentId) {
               relatedElement.classList.add('task-drop-target');
            }
          }
          
          return true; // 允许移动
        },
        onStart: () => { isDragging = true; },
        onEnd: (evt) => {
          // 移除所有悬停效果
          document.querySelectorAll('.task-drop-target').forEach(el => {
            el.classList.remove('task-drop-target');
          });
          
          const taskId = (evt.item as HTMLElement).dataset.taskId;
          if (!taskId) {
            isDragging = false;
            return;
          }
          
          const task = taskStore.tasks.find(t => t.id === taskId);
          if (!task) {
            isDragging = false;
            return;
          }
          
          // 注意：不要手动移除 DOM 元素！
          // SortableJS 会处理 DOM移动，而我们通过更新 Vue Store 来最终同步状态。
          // 当 Store 更新后，Vue 会重新渲染列表，覆盖 SortableJS 的 DOM 操作。
          
          // 如果拖拽没有改变位置（同列表同索引），直接返回
          if (evt.to === evt.from && evt.newIndex === evt.oldIndex) {
            isDragging = false;
            return;
          }

          // 恢复 DOM 状态，让 Vue 来处理渲染
          // 这是防止 SortableJS 的 DOM 操作与 Vue 的 Virtual DOM 冲突的关键
          // 特别是在跨组件拖拽时
          const { from, item, oldIndex } = evt;
          if (from.contains(item)) {
            from.removeChild(item);
            // 只有当 oldIndex 有效时才插回去
            if (oldIndex !== undefined) {
               if (oldIndex < from.children.length) {
                 from.insertBefore(item, from.children[oldIndex]);
               } else {
                 from.appendChild(item);
               }
            }
          }
          
          // 检测拖拽目标
          const toElement = evt.to as HTMLElement;
          const toColumnId = toElement.dataset.columnId;
          
          // 检查是否拖拽到了子任务容器
          const isSubtaskContainer = toElement.dataset.subtaskContainer === 'true';
          const parentTaskId = toElement.dataset.parentTaskId;
          
          // 检查是否拖拽到了任务卡片上（通过检查 related 元素）
          // 在 onEnd 中，evt.originalEvent 还没结束，可以使用 document.elementFromPoint
          // 但此时 item 还在鼠标位置，可能会遮挡目标。
          // 更好的方式是利用 onMove 中记录的目标，或者尝试获取
          // 这里我们简单尝试获取
          let targetTaskId: string | undefined;
          
          // 如果拖拽到了某个特定的 drop target
          // 由于我们在 onMove 中添加了类，我们可以尝试查找
          // 但 onEnd 时类已经被移除了（上面代码）。
          // 实际上 elementFromPoint 可能不准。
          // 我们依赖于 SortableJS 的行为：如果它不仅是排序，还能嵌套...
          // 但 Sortable 默认是一维列表。
          // 我们之前是通过检查位置来判定是否拖拽到了任务卡片上。
          // 现在的逻辑：如果 sortable 没能把元素放进子任务列表（因为子任务列表是另一个 sortable group），
          // 那么它一定是在看板列里。
          // 但我们想支持“拖到任务上变成子任务”。这需要我们检测鼠标位置下的元素。
          
          // 使用 clientX/Y 获取 drop 目标
          const touch = (evt as any).originalEvent.changedTouches ? (evt as any).originalEvent.changedTouches[0] : (evt as any).originalEvent;
          const clientX = touch.clientX;
          const clientY = touch.clientY;
          
          // 临时隐藏拖拽元素以获取下方元素
          const displayStyle = item.style.display;
          item.style.display = 'none';
          const elementBelow = document.elementFromPoint(clientX, clientY);
          item.style.display = displayStyle;
          
          const targetTaskCard = elementBelow?.closest('[data-task-card="true"]') as HTMLElement;
          targetTaskId = targetTaskCard?.dataset?.taskId;
          
          // 如果是拖拽到任务卡片上
          if (targetTaskId && targetTaskId !== taskId) {
             const targetTask = taskStore.tasks.find(t => t.id === targetTaskId);
             
             // 禁止拖拽到已是子任务的卡片上（禁止三级任务）
             if (targetTask && !targetTask.parentId) {
                // 检查是否从已完成列拖拽出来
                const fromCompletedColumn = task.columnId === columnStore.completedColumnId;
                const shouldBeCompleted = fromCompletedColumn ? false : targetTask.completed;
                
                // 递归移动所有子任务
                moveTaskWithChildren(taskId, targetTaskId, shouldBeCompleted);
                
                nextTick(() => { isDragging = false; });
                return;
             }
          }
          
          if (isSubtaskContainer && parentTaskId && parentTaskId !== taskId) {
            // 拖拽到子任务容器,成为子任务
            const parentTask = taskStore.tasks.find(t => t.id === parentTaskId);
            const fromCompletedColumn = task.columnId === columnStore.completedColumnId;
            const shouldBeCompleted = fromCompletedColumn ? false : (parentTask?.completed || false);
            
            moveTaskWithChildren(taskId, parentTaskId, shouldBeCompleted);
            
            // 更新子任务顺序
            // 注意：因为我们手动恢复了 DOM，所以通过 store 更新来驱动
            // 但我们需要知道新顺序。
            // 简单的做法：把当前 taskId 放到新位置。
            // 但由于我们没有让 Sortable 完成 DOM 移动，
            // 我们不能简单读取 DOM 顺序。
            // 这里我们需要依赖 evt.newIndex，但这在跨列表时可能不准，取决于 Sortable 的实现。
            
            // 更可靠的做法：
            // 1. 获取目标父任务的子任务列表
            // 2. 根据 newIndex 插入
            nextTick(() => {
               // subtasks was unused
               isDragging = false;
            });
            return;
          } 
          
          if (toColumnId) {
            // 拖拽到看板列
            const fromColumnId = (evt.from as HTMLElement).dataset.columnId;
            const isSubtaskToBoard = !!task.parentId;
            const isCompletedColumn = columnStore.completedColumnId === toColumnId;
            const fromCompletedColumn = fromColumnId === columnStore.completedColumnId;
            
            // 目标列的任务 ID 列表
            // 因为我们恢复了 DOM，所以 DOM 里的顺序是旧的。
            // 我们需要根据 evt.newIndex 来计算新顺序。
            
            const targetColumnTasks = getColumnTasks(toColumnId);
            const targetTaskIds = targetColumnTasks.map(t => t.id);
            
            // 如果是跨列或者是子任务变一级任务
            if (fromColumnId !== toColumnId || isSubtaskToBoard) {
               // 从源列表移除（如果是同列表则不需要，但在 taskStore.tasks 里只要修改 columnId 就会变）
               // 我们只要把 taskId 插到 targetTaskIds 的 newIndex 位置
               
               // 如果是从别的列来的，targetTaskIds 里现在没有它。
               targetTaskIds.splice(evt.newIndex!, 0, taskId);
            } else {
               // 同列排序
               const oldIdx = targetTaskIds.indexOf(taskId);
               if (oldIdx > -1) {
                 targetTaskIds.splice(oldIdx, 1);
                 targetTaskIds.splice(evt.newIndex!, 0, taskId);
               }
            }
            
            if (isSubtaskToBoard) {
              // 子任务转一级任务
              const shouldBeCompleted = isCompletedColumn;
              taskStore.updateTask(taskId, {
                parentId: undefined,
                columnId: toColumnId,
                projectId: projectId.value || task.projectId,
                completed: shouldBeCompleted,
              });
              
              if (fromCompletedColumn && !isCompletedColumn) {
                recursiveUpdateCompletion(taskId, false);
              } else if (isCompletedColumn) {
                recursiveUpdateCompletion(taskId, true);
              }
            } else if (fromColumnId !== toColumnId) {
              // 跨列移动
              const shouldBeCompleted = isCompletedColumn;
              taskStore.updateTask(taskId, {
                columnId: toColumnId,
                completed: shouldBeCompleted,
              });
              
              if (fromCompletedColumn && !isCompletedColumn) {
                recursiveUpdateCompletion(taskId, false);
              } else if (isCompletedColumn) {
                recursiveUpdateCompletion(taskId, true);
              }
            }
            
            // 应用新顺序
            nextTick(() => {
              taskStore.reorderTasks(toColumnId, projectId.value, targetTaskIds);
              isDragging = false;
            });
          } else {
            // 既不是子任务容器，也不是看板列，可能是拖飞了
            isDragging = false;
          }
        },
      });
      
      taskSortables.set(columnId, sortable);
    });
  });
}

/**
 * 递归移动任务及其所有子任务到新的父任务下
 */
/**
 * 递归移动任务及其所有子任务到新的父任务下
 */
function moveTaskWithChildren(taskId: string, newParentId: string, shouldBeCompleted: boolean) {
  const task = taskStore.tasks.find(t => t.id === taskId);
  const newParent = taskStore.tasks.find(t => t.id === newParentId);
  if (!task || !newParent) return;
  
  // 更新当前任务
  taskStore.updateTask(taskId, {
    parentId: newParentId,
    projectId: newParent.projectId, // 继承父任务的项目 ID
    columnId: newParent.columnId,   // 继承父任务的列 ID
    completed: shouldBeCompleted,
  });
  
  // 递归更新所有子任务的配置（项目、列、完成状态）
  recursiveUpdateChildrenConfig(taskId, newParent.projectId, newParent.columnId, shouldBeCompleted);
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

// 仅销毁任务 Sortable 实例
function destroyTaskSortables() {
  taskSortables.forEach(sortable => sortable.destroy());
  taskSortables.clear();
}

// 销毁所有 Sortable 实例
function destroySortables() {
  if (columnSortable) {
    columnSortable.destroy();
    columnSortable = null;
  }
  destroyTaskSortables();
}

// 拖拽进行中标记，避免 onEnd 中 store 更新触发不必要的重建
let isDragging = false;

// 监听列变化，重新初始化所有拖拽实例
watch(
  () => sortedColumns.value.map(c => c.id).join(','),
  () => {
    if (isDragging) return;
    nextTick(() => {
      destroySortables();
      initSortables();
    });
  }
);

// 监听任务数据变化，重建任务拖拽实例
// 当任务增删或属性变化导致 Vue 重渲染 DOM 后，旧的 Sortable 绑定会失效
watch(
  () => taskStore.tasks.map(t => `${t.id}:${t.columnId}:${t.parentId}:${t.order}:${t.completed}`).join(','),
  () => {
    if (isDragging) return;
    nextTick(() => {
      destroyTaskSortables();
      initTaskSortables();
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

async function handleColumnAction(action: 'rename' | 'progressing' | 'completed' | 'delete') {
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
    if (await confirm(t('common.confirm_delete_column'), undefined, 'error')) {
      columnStore.deleteColumn(id);
    }
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
  let targetProjectId = projectId.value;
  // 如果是总览模式（无特定项目ID），且存在项目，默认选择第一个项目
  if (!targetProjectId && projectStore.projects.length > 0) {
    targetProjectId = projectStore.projects[0].id;
  }

  // 打开 TaskDetailModal，预设当前项目和列
  openNewTask({
    projectId: targetProjectId,
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
   items.push({ label: t('task.trash'), action: 'trash', icon: Trash2, class: 'text-red-600' });
   items.push({ label: t('task.delete_permanently'), action: 'delete-permanently', icon: Trash2, class: 'text-red-700 bg-red-50 dark:bg-red-900/10' });
   
   return items;
});

async function handleMenuSelect(action: string) {
   const task = taskContextMenu.value?.task;
   if (!task) return;
   
   if (action === 'trash') {
      taskStore.trashTask(task.id);
   } else if (action === 'restore') {
      taskStore.restoreTask(task.id);
   } else if (action === 'delete-permanently') {
      if (await confirm(t('common.confirm_delete_permanently'), undefined, 'error')) {
        taskStore.deleteTask(task.id);
      }
   } else if (action.startsWith('priority-')) {
      const p = action.replace('priority-', '') as any;
      taskStore.updateTask(task.id, { priority: p });
   } else if (action.startsWith('move-project:')) {
      const projectId = action.replace('move-project:', '');
      // 移动项目时，如果是子任务，则变为一级任务
      taskStore.updateTask(task.id, { projectId, parentId: undefined });
   } else if (action.startsWith('move-column:')) {
      const columnId = action.replace('move-column:', '');
      // 移动列时，如果是子任务，先清除 parentId 变为一级任务
      if (task.parentId) {
         taskStore.updateTask(task.id, { parentId: undefined });
      }
      taskStore.moveTask(task.id, columnId);
   }
   
   taskContextMenu.value = null; 
}
</script>

<style>
/* 任务卡片容器 - 确保拖拽时样式一致 */
.task-card-wrapper {
  border-radius: 12px;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
  will-change: transform;
  cursor: grab;
}

.task-card-wrapper:active {
  cursor: grabbing;
}

/* 拖拽悬停目标效果 */
.task-drop-target {
  border: 2px solid #3b82f6 !important;
  background-color: rgba(59, 130, 246, 0.05) !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
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

