import { ref, computed, reactive } from "vue";
import { useTaskStore } from "@/stores/task";

// 新任务的默认值类型
export interface NewTaskDefaults {
  projectId?: string;
  columnId?: string;
  labels?: string[];
  startDate?: string;
  dueDate?: string;
  parentId?: string;
}

// 草稿任务类型（用于新建任务时的临时存储）
export interface DraftTask {
  title: string;
  description: string;
  projectId: string;
  columnId: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  startDate?: string;
  labels: string[];
  parentId?: string;
}

const isOpen = ref(false);
const taskStack = ref<string[]>([]);

// 新任务模式相关状态
const isCreateMode = ref(false);
const draftTask = reactive<DraftTask>({
  title: "",
  description: "",
  projectId: "",
  columnId: "todo",
  priority: undefined,
  dueDate: undefined,
  startDate: undefined,
  labels: [],
  parentId: undefined,
});

// 重置草稿任务
function resetDraftTask(defaults?: NewTaskDefaults) {
  draftTask.title = "";
  draftTask.description = "";
  draftTask.projectId = defaults?.projectId || "";
  draftTask.columnId = defaults?.columnId || "todo";
  draftTask.priority = undefined;
  draftTask.dueDate = defaults?.dueDate || undefined;
  draftTask.startDate = defaults?.startDate || undefined;
  draftTask.labels = defaults?.labels || [];
  draftTask.parentId = defaults?.parentId || undefined;
}

export function useTaskModal() {
  const taskStore = useTaskStore();

  // 打开已有任务
  function openTask(taskId: string) {
    isCreateMode.value = false;
    taskStack.value = [taskId];
    isOpen.value = true;
  }

  // 创建新任务（打开弹窗进入创建模式）
  function openNewTask(defaults?: NewTaskDefaults) {
    isCreateMode.value = true;
    taskStack.value = [];
    resetDraftTask(defaults);
    isOpen.value = true;
  }

  function pushTask(taskId: string) {
    taskStack.value.push(taskId);
  }

  function popTask() {
    if (taskStack.value.length > 1) {
      taskStack.value.pop();
    } else {
      close();
    }
  }

  // 检查草稿是否有内容
  function hasDraftContent(): boolean {
    return !!(draftTask.title.trim() || draftTask.description.trim());
  }

  // 验证草稿任务
  function validateDraft(): {
    valid: boolean;
    error?: string;
    canSave?: boolean;
  } {
    const hasTitle = !!draftTask.title.trim();
    const hasDescription = !!draftTask.description.trim();
    const hasProject = !!draftTask.projectId;
    const hasColumn = !!draftTask.columnId;

    // 没有任何内容，直接允许关闭
    if (!hasTitle && !hasDescription) {
      return { valid: true, canSave: false };
    }

    // 有任务描述但没有任务名、项目或状态
    if (hasDescription) {
      if (!hasTitle) {
        return { valid: false, error: "请填写任务标题" };
      }
      if (!hasProject) {
        return { valid: false, error: "请选择项目" };
      }
      if (!hasColumn) {
        return { valid: false, error: "请选择状态" };
      }
    }

    // 有任务名但没有项目或状态
    if (hasTitle) {
      if (!hasProject) {
        return { valid: false, error: "请选择项目" };
      }
      if (!hasColumn) {
        return { valid: false, error: "请选择状态" };
      }
    }

    // 验证通过，可以保存
    return { valid: true, canSave: true };
  }

  // 尝试关闭弹窗（带验证）
  function tryClose(): { success: boolean; error?: string } {
    if (isCreateMode.value) {
      // 创建模式下的验证
      if (!hasDraftContent()) {
        // 没有内容，直接关闭
        close();
        return { success: true };
      }

      // 有内容但验证不通过，返回错误
      const validation = validateDraft();
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // 验证通过，提示用户是否保存
      return { success: false, error: "请先保存或清空任务内容" };
    }

    // 编辑模式，直接关闭
    close();
    return { success: true };
  }

  // 保存草稿为新任务
  function saveDraft(): string | null {
    const validation = validateDraft();
    if (!validation.valid || !hasDraftContent()) {
      return null;
    }

    const newId = taskStore.addTask({
      title: draftTask.title.trim(),
      description: draftTask.description.trim() || undefined,
      projectId: draftTask.projectId,
      columnId: draftTask.columnId,
      priority: draftTask.priority,
      dueDate: draftTask.dueDate,
      startDate: draftTask.startDate,
      labels: draftTask.labels,
      parentId: draftTask.parentId,
      completed: false,
    });

    // 保存后切换到编辑模式
    isCreateMode.value = false;
    taskStack.value = [newId];

    return newId;
  }

  // 强制关闭，丢弃所有内容
  function forceClose() {
    isOpen.value = false;
    isCreateMode.value = false;
    taskStack.value = [];
    resetDraftTask();
  }

  function close() {
    isOpen.value = false;
    isCreateMode.value = false;
    taskStack.value = [];
    resetDraftTask();
  }

  const currentTaskId = computed(
    () => taskStack.value[taskStack.value.length - 1],
  );

  return {
    isOpen,
    isCreateMode,
    currentTaskId,
    taskStack,
    draftTask,
    openTask,
    openNewTask,
    pushTask,
    popTask,
    close,
    forceClose,
    tryClose,
    saveDraft,
    hasDraftContent,
    validateDraft,
    resetDraftTask,
  };
}
