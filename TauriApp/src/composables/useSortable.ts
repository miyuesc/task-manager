import { onMounted, onUnmounted, ref, Ref, watch } from "vue";
import Sortable, { SortableEvent, Options } from "sortablejs";

export interface UseSortableOptions {
  // 容器元素选择器或 Ref
  container: Ref<HTMLElement | null>;
  // 拖拽项选择器
  draggable?: string;
  // 拖拽手柄选择器
  handle?: string;
  // 分组名称（用于跨容器拖拽）
  group?:
    | string
    | { name: string; pull?: boolean | "clone"; put?: boolean | string[] };
  // 动画持续时间（毫秒）
  animation?: number;
  // 拖拽幽灵元素的透明度
  ghostClass?: string;
  // 选中项的样式类
  chosenClass?: string;
  // 拖拽中的样式类
  dragClass?: string;
  // 禁用排序
  disabled?: boolean;
  // 回调：拖拽开始
  onStart?: (evt: SortableEvent) => void;
  // 回调：拖拽结束
  onEnd?: (evt: SortableEvent) => void;
  // 回调：元素移动到其他容器
  onAdd?: (evt: SortableEvent) => void;
  // 回调：元素从当前容器移除
  onRemove?: (evt: SortableEvent) => void;
  // 回调：排序更新
  onUpdate?: (evt: SortableEvent) => void;
  // 回调：排序变化（包括跨容器）
  onSort?: (evt: SortableEvent) => void;
}

export function useSortable(options: UseSortableOptions) {
  const sortableInstance = ref<Sortable | null>(null);

  const defaultOptions: Partial<Options> = {
    animation: 200,
    ghostClass: "sortable-ghost",
    chosenClass: "sortable-chosen",
    dragClass: "sortable-drag",
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    forceFallback: false, // 使用原生拖拽
    fallbackOnBody: true,
    swapThreshold: 0.65,
  };

  function initSortable() {
    if (!options.container.value) return;

    // 销毁旧实例
    if (sortableInstance.value) {
      sortableInstance.value.destroy();
    }

    const sortableOptions: Options = {
      ...defaultOptions,
      draggable: options.draggable || ".sortable-item",
      handle: options.handle,
      group: options.group,
      animation: options.animation ?? 200,
      disabled: options.disabled ?? false,

      onStart: (evt) => {
        document.body.classList.add("is-dragging");
        options.onStart?.(evt);
      },

      onEnd: (evt) => {
        document.body.classList.remove("is-dragging");
        options.onEnd?.(evt);
      },

      onAdd: options.onAdd,
      onRemove: options.onRemove,
      onUpdate: options.onUpdate,
      onSort: options.onSort,
    };

    // 如果有自定义 ghostClass
    if (options.ghostClass) {
      sortableOptions.ghostClass = options.ghostClass;
    }
    if (options.chosenClass) {
      sortableOptions.chosenClass = options.chosenClass;
    }
    if (options.dragClass) {
      sortableOptions.dragClass = options.dragClass;
    }

    sortableInstance.value = Sortable.create(
      options.container.value,
      sortableOptions,
    );
  }

  function destroySortable() {
    if (sortableInstance.value) {
      sortableInstance.value.destroy();
      sortableInstance.value = null;
    }
  }

  // 监听容器变化
  watch(
    () => options.container.value,
    (newContainer) => {
      if (newContainer) {
        initSortable();
      } else {
        destroySortable();
      }
    },
    { immediate: true },
  );

  // 监听 disabled 变化
  watch(
    () => options.disabled,
    (disabled) => {
      if (sortableInstance.value) {
        sortableInstance.value.option("disabled", disabled ?? false);
      }
    },
  );

  onMounted(() => {
    if (options.container.value) {
      initSortable();
    }
  });

  onUnmounted(() => {
    destroySortable();
  });

  return {
    sortableInstance,
    reinit: initSortable,
    destroy: destroySortable,
  };
}

// 列拖拽专用 composable
export function useColumnSortable(
  container: Ref<HTMLElement | null>,
  onReorder: (oldIndex: number, newIndex: number) => void,
) {
  return useSortable({
    container,
    draggable: ".kanban-column",
    handle: ".column-drag-handle",
    group: "columns",
    animation: 250,
    ghostClass: "column-ghost",
    chosenClass: "column-chosen",
    onEnd: (evt) => {
      if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
        onReorder(evt.oldIndex, evt.newIndex);
      }
    },
  });
}

// 任务卡片拖拽专用 composable
export function useTaskSortable(
  container: Ref<HTMLElement | null>,
  columnId: string,
  onReorder: (taskIds: string[], columnId: string) => void,
  onMove: (
    taskId: string,
    fromColumnId: string,
    toColumnId: string,
    newIndex: number,
  ) => void,
) {
  return useSortable({
    container,
    draggable: ".task-card",
    group: { name: "tasks", pull: true, put: true },
    animation: 200,
    ghostClass: "task-ghost",
    chosenClass: "task-chosen",
    onEnd: (evt) => {
      const taskId = evt.item.dataset.taskId;
      const fromColumnId = evt.from.dataset.columnId;
      const toColumnId = evt.to.dataset.columnId;

      if (!taskId) return;

      // 跨列移动
      if (fromColumnId !== toColumnId && toColumnId) {
        onMove(taskId, fromColumnId || columnId, toColumnId, evt.newIndex ?? 0);
      } else {
        // 同列内排序
        const taskIds = Array.from(evt.to.querySelectorAll(".task-card"))
          .map((el) => (el as HTMLElement).dataset.taskId)
          .filter((id): id is string => !!id);
        onReorder(taskIds, columnId);
      }
    },
  });
}
