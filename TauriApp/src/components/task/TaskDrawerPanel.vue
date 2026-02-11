<template>
  <div 
    class="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white dark:bg-zinc-900 shadow-2xl flex flex-col border-l border-gray-200 dark:border-zinc-800 outline-none"
    :style="{ zIndex: 50 + index }"
    @keydown.esc.stop="handleEsc"
    tabindex="0"
    ref="panelRef"
  >
    <!-- 头部组件：包含导航、项目/列选择、操作按钮 -->
    <TaskHeader 
      v-if="currentTask"
      :task="currentTask"
      :show-back-button="index > 0"
      @update="handleUpdate"
      @close="emit('close')"
      @back="emit('back')"
    />
    
    <!-- 验证错误提示 -->
    <div v-if="validationError" class="px-6 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
      <p class="text-sm text-red-600 dark:text-red-400">{{ validationError }}</p>
    </div>

    <!-- 主体内容区域 -->
    <div class="flex-1 overflow-y-auto" v-if="currentTask">
      <div class="px-6 py-5 space-y-5">
        
        <!-- 标题输入 -->
        <input 
          v-model="titleModel"
          ref="titleInputRef"
          class="w-full text-xl font-semibold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-gray-50 placeholder-gray-400"
          :placeholder="t('task.title_placeholder')"
        />

        <!-- 属性表单：日期、优先级、标签等 -->
        <TaskProperties 
          :task="currentTask"
          @update="handleUpdate"
        />

        <!-- 描述编辑器 -->
        <div class="pt-2">
          <div class="flex items-center gap-2 mb-3">
            <FileText class="w-4 h-4 text-gray-500" />
            <h3 class="text-sm font-medium text-gray-900 dark:text-gray-50">{{ t('task.description') }}</h3>
          </div>
          
          <div class="bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <MarkdownEditor 
              :model-value="currentTask.description || ''"
              @update:model-value="(val) => handleUpdate('description', val)"
              :placeholder="t('task.description_placeholder')"
            />
          </div>
        </div>

        <!-- 子任务列表：新建模式下若无标题/项目/列则隐藏 -->
        <TaskSubtasks 
          v-if="!isCreateMode || (currentTask?.title && currentTask?.projectId && currentTask?.columnId)"
          :subtasks="subtasks"
          @add="handleAddSubtask"
          @delete="handleDeleteSubtask"
          @toggle="handleToggleSubtask"
          @open="pushTask"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue';
import { useTaskModal } from '@/composables/useTaskModal';
import { useConfirm } from '@/composables/useConfirm';
import { useTaskStore, Task } from '@/stores/task';
import { FileText } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

// 子组件
import MarkdownEditor from '@/components/ui/MarkdownEditor.vue';
import TaskHeader from '@/components/task/form/TaskHeader.vue';
import TaskProperties from '@/components/task/form/TaskProperties.vue';
import TaskSubtasks from '@/components/task/form/TaskSubtasks.vue';

const props = defineProps<{
  taskId?: string;
  isCreateMode?: boolean;
  index: number;
}>();

const emit = defineEmits(['close', 'back']);

const { t } = useI18n();
const { confirm } = useConfirm();
const taskStore = useTaskStore();
const { draftTask, pushTask, saveDraft } = useTaskModal();

const panelRef = ref<HTMLElement | null>(null);
const titleInputRef = ref<HTMLInputElement | null>(null);
const validationError = ref<string | null>(null);

// 计算当前任务数据源
// 如果是创建模式，使用 draftTask
// 如果是编辑模式，从 store 中查找
const currentTask = computed(() => {
  if (props.isCreateMode) return draftTask;
  return taskStore.tasks.find(t => t.id === props.taskId);
});

// 标题的双向绑定代理
// 因为 input v-model 需要直接绑定 ref，这里做一个 computed setter 转发
const titleModel = computed({
  get: () => currentTask.value?.title || '',
  set: (val) => handleUpdate('title', val)
});

// 子任务列表
const subtasks = computed(() => {
  if (props.isCreateMode || !props.taskId) return [];
  return taskStore.getSubtasks(props.taskId);
});

// 统一更新逻辑
function handleUpdate(field: string, value: any) {
  if (!currentTask.value) return;

  if (props.isCreateMode) {
    // 更新草稿
    // @ts-ignore - draftTask is reactive object potentially cleaner way exists
    draftTask[field] = value;
  } else if (props.taskId) {
    // 更新实际任务
    taskStore.updateTask(props.taskId, { [field]: value });
  }
}

// 子任务处理
function handleAddSubtask() {
  if (props.isCreateMode) {
    // 创建模式：先保存主任务，再添加子任务
    const newId = saveDraft();
    if (newId) {
      createSubtaskFor(newId);
    }
  } else if (props.taskId) {
    // 编辑模式：直接添加
    createSubtaskFor(props.taskId);
  }
}

function createSubtaskFor(parentId: string) {
  const parent = taskStore.tasks.find(t => t.id === parentId);
  if (!parent) return;

  const subtaskId = taskStore.addTask({
    projectId: parent.projectId,
    columnId: parent.columnId,
    title: t('task.add_subtask'),
    parentId: parentId,
    labels: [],
    completed: false
  });
  
  // 立即打开新创建的子任务
  pushTask(subtaskId);
}

async function handleDeleteSubtask(id: string) {
  if (await confirm(t('common.confirm_delete_subtask'), undefined, 'error')) {
    taskStore.deleteTask(id);
  }
}

function handleToggleSubtask(subtask: Task) {
  taskStore.updateTask(subtask.id, { completed: !subtask.completed });
}

function handleEsc() {
  emit('back');
}

onMounted(async () => {
  await nextTick();
  if (props.isCreateMode && titleInputRef.value) {
    titleInputRef.value.focus();
  } else {
    // Check if it's a new subtask (title matches default)
    if (currentTask.value?.title === t('task.add_subtask') && titleInputRef.value) {
      titleInputRef.value.focus();
      titleInputRef.value.select();
    } else {
      panelRef.value?.focus();
    }
  }
});
</script>
