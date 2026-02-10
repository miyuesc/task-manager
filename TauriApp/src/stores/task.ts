import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useColumnStore } from "./column";
import { getLocalDateISOString } from "@/utils/date";

export interface Task {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  startDate?: string;
  labels: string[];
  parentId?: string;
  completed: boolean;
  order: number; // 用于排序
  location?: string;
  isTrashed?: boolean; // 是否已作废
}

export const useTaskStore = defineStore(
  "tasks",
  () => {
    const tasks = ref<Task[]>([]);

    // 获取项目下的顶级任务
    function getTasksByProject(projectId: string) {
      return tasks.value
        .filter((t) => t.projectId === projectId && !t.parentId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    // 获取指定列的任务
    function getTasksByColumn(columnId: string, projectId?: string) {
      return tasks.value
        .filter((t) => {
          if (t.parentId) return false;
          if (t.columnId !== columnId) return false;
          if (projectId && t.projectId !== projectId) return false;
          return true;
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    // 获取指定状态列下的所有任务（用于 Progressing 视图）
    function getTasksByColumns(columnIds: string[]) {
      return tasks.value
        .filter((t) => !t.parentId && columnIds.includes(t.columnId))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    // 获取子任务
    function getSubtasks(parentId: string) {
      return tasks.value
        .filter((t) => t.parentId === parentId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    // 进行中的任务（基于 columnStore.progressingColumnIds）
    const progressingTasks = computed(() => {
      const columnStore = useColumnStore();
      const progressingIds = columnStore.progressingColumnIds;

      return tasks.value.filter(
        (t) =>
          !t.parentId &&
          !t.completed &&
          progressingIds.includes(t.columnId) &&
          !t.isTrashed,
      );
    });

    // 今日任务（基于 startDate 开始日期）
    const todayTasks = computed(() => {
      const todayStr = getLocalDateISOString();
      return tasks.value.filter(
        (t) =>
          !t.parentId &&
          t.startDate?.split("T")[0] === todayStr &&
          !t.completed &&
          !t.isTrashed,
      );
    });

    // 即将到来的任务（未来三天内的开始日期）
    const upcomingTasks = computed(() => {
      const todayStr = getLocalDateISOString();
      const threeDaysLater = new Date();
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);
      const threeDaysLaterStr = getLocalDateISOString(threeDaysLater);

      return tasks.value.filter(
        (t) =>
          !t.parentId &&
          t.startDate &&
          t.startDate.split("T")[0] > todayStr &&
          t.startDate.split("T")[0] <= threeDaysLaterStr &&
          !t.completed &&
          !t.isTrashed,
      );
    });

    // 已完成任务
    const completedTasks = computed(() => {
      return tasks.value.filter(
        (t) => !t.parentId && t.completed && !t.isTrashed,
      );
    });

    // 已作废任务
    const trashedTasks = computed(() => {
      return tasks.value.filter((t) => t.isTrashed);
    });

    function addTask(task: Omit<Task, "id" | "order">) {
      const sameColumnTasks = tasks.value.filter(
        (t) =>
          t.columnId === task.columnId &&
          t.projectId === task.projectId &&
          !t.parentId,
      );
      const maxOrder = sameColumnTasks.reduce(
        (max, t) => Math.max(max, t.order ?? 0),
        -1,
      );

      const newTask: Task = {
        id: Date.now().toString(),
        order: maxOrder + 1,
        isTrashed: false,
        ...task,
      };
      tasks.value.push(newTask);
      return newTask.id;
    }

    function updateTask(id: string, updates: Partial<Task>) {
      const index = tasks.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        const oldTask = tasks.value[index];

        // 自动移动到已完成列逻辑
        if (
          updates.completed === true &&
          !oldTask.completed &&
          !oldTask.parentId
        ) {
          const columnStore = useColumnStore();
          const targetColId = columnStore.completedColumnId;
          // 简单的检查该列是否存在
          if (columnStore.columns.some((c) => c.id === targetColId)) {
            updates.columnId = targetColId;
          }
        }

        tasks.value[index] = { ...oldTask, ...updates };

        // 父级任务完成时，子任务自动完成
        if (updates.completed !== undefined) {
          toggleSubtasksCompletion(id, updates.completed);
        }
      }
    }

    function trashTask(id: string) {
      updateTask(id, { isTrashed: true });
    }

    function restoreTask(id: string) {
      updateTask(id, { isTrashed: false });
    }

    function deleteTask(id: string) {
      // 递归删除子任务
      const children = getSubtasks(id);
      children.forEach((child) => deleteTask(child.id));

      const index = tasks.value.findIndex((t) => t.id === id);
      if (index !== -1) {
        tasks.value.splice(index, 1);
      }
    }

    function toggleSubtasksCompletion(parentId: string, completed: boolean) {
      const children = getSubtasks(parentId);
      children.forEach((child) => {
        if (child.completed !== completed) {
          updateTask(child.id, { completed });
        }
      });
    }

    function moveTask(taskId: string, newColumnId: string, newIndex?: number) {
      const task = tasks.value.find((t) => t.id === taskId);
      if (!task) return;

      const columnStore = useColumnStore();
      const oldColumnId = task.columnId;
      task.columnId = newColumnId;

      // 如果移动到已完成列
      if (
        newColumnId === columnStore.completedColumnId &&
        oldColumnId !== newColumnId
      ) {
        task.completed = true;
        toggleSubtasksCompletion(taskId, true);
      }
      // 如果从已完成列移出
      else if (
        oldColumnId === columnStore.completedColumnId &&
        oldColumnId !== newColumnId
      ) {
        task.completed = false;
        // 注意：移出时是否需要递归取消子任务？用户未明确，但通常子任务状态不应被主任务带回来，这里保持原样或可选。
        // 根据常理，主任务恢复，子任务不一定恢复，但这里为了逻辑对称，我们可以暂不自动恢复子任务。
      }

      // 重新排序
      if (newIndex !== undefined) {
        const columnTasks = tasks.value
          .filter(
            (t) => t.columnId === newColumnId && !t.parentId && t.id !== taskId,
          )
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        columnTasks.splice(newIndex, 0, task);
        columnTasks.forEach((t, i) => {
          t.order = i;
        });
      }
    }

    // 重新排序任务
    function reorderTasks(
      columnId: string,
      _projectId: string,
      taskIds: string[],
    ) {
      taskIds.forEach((id, index) => {
        const task = tasks.value.find((t) => t.id === id);
        if (task) {
          task.order = index;
          task.columnId = columnId;
        }
      });
    }

    // 记录看板卡片中子任务列表展开的任务ID (持久化)
    const expandedSubtaskIds = ref<string[]>([]);

    function toggleSubtaskExpansion(taskId: string) {
      const index = expandedSubtaskIds.value.indexOf(taskId);
      if (index === -1) {
        expandedSubtaskIds.value.push(taskId);
      } else {
        expandedSubtaskIds.value.splice(index, 1);
      }
    }

    function isSubtaskExpanded(taskId: string) {
      return expandedSubtaskIds.value.includes(taskId);
    }

    return {
      tasks,
      progressingTasks,
      todayTasks,
      upcomingTasks,
      completedTasks,
      trashedTasks,
      expandedSubtaskIds,
      getTasksByProject,
      getTasksByColumn,
      getTasksByColumns,
      getSubtasks,
      addTask,
      updateTask,
      deleteTask,
      trashTask,
      restoreTask,
      moveTask,
      reorderTasks,
      toggleSubtaskExpansion,
      isSubtaskExpanded,
    };
  },
  {
    persist: true,
  },
);
