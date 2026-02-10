<template>
  <div 
    class="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white dark:bg-zinc-900 shadow-2xl flex flex-col border-l border-gray-200 dark:border-zinc-800"
    :style="{ zIndex: 50 + index }"
    @keydown.esc="handleEsc"
    tabindex="0"
    ref="panelRef"
  >
    <!-- Header: Project / Column 选择器 -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
      <div class="flex items-center gap-2 text-sm">
        <button v-if="index > 0" @click="emit('back')" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors mr-1">
          <ArrowLeft class="w-4 h-4 text-gray-500" />
        </button>
        
        <!-- 创建模式：Column 下拉选择器 -->
        <template v-if="isCreateMode">
          <Dropdown
            :model-value="draftTask.columnId"
            :options="columnOptions"
            @update:model-value="updateDraftColumn"
            trigger-class="text-gray-700 dark:text-gray-300"
          >
            <template #trigger>
              <span class="flex items-center gap-1.5 cursor-pointer hover:opacity-80">
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getColumnColorHex(draftTask.columnId) }"></span>
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ getColumnName(draftTask.columnId) }}</span>
                <ChevronDown class="w-3.5 h-3.5 text-gray-400" />
              </span>
            </template>
          </Dropdown>
          
          <span class="text-gray-300 dark:text-gray-600">/</span>
          
          <!-- 创建模式：Project 下拉选择器 -->
          <Dropdown
            :model-value="draftTask.projectId"
            :options="projectOptions"
            @update:model-value="updateDraftProject"
          >
            <template #trigger>
              <span class="flex items-center gap-1.5 cursor-pointer text-blue-500 hover:text-blue-600">
                <span class="text-sm">{{ getProjectName(draftTask.projectId) || t('task.select_project') }}</span>
                <ChevronDown class="w-3.5 h-3.5" />
              </span>
            </template>
          </Dropdown>
        </template>
        
        <!-- 编辑模式：Column 下拉选择器 -->
        <template v-else-if="task">
          <Dropdown
            :model-value="task.columnId"
            :options="columnOptions"
            @update:model-value="updateColumn"
            trigger-class="text-gray-700 dark:text-gray-300"
          >
            <template #trigger>
              <span class="flex items-center gap-1.5 cursor-pointer hover:opacity-80">
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getColumnColorHex(task.columnId) }"></span>
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ getColumnName(task.columnId) }}</span>
                <ChevronDown class="w-3.5 h-3.5 text-gray-400" />
              </span>
            </template>
          </Dropdown>
          
          <span class="text-gray-300 dark:text-gray-600">/</span>
          
          <!-- 编辑模式：Project 下拉选择器 -->
          <Dropdown
            :model-value="task.projectId"
            :options="projectOptions"
            @update:model-value="updateProject"
          >
            <template #trigger>
              <span class="flex items-center gap-1.5 cursor-pointer text-blue-500 hover:text-blue-600">
                <span class="text-sm">{{ getProjectName(task.projectId) }}</span>
                <ChevronDown class="w-3.5 h-3.5" />
              </span>
            </template>
          </Dropdown>
        </template>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Trashed Indicator -->
        <span 
          v-if="task?.isTrashed" 
          class="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        >
          {{ t('task.is_trashed') }}
        </span>

        <button class="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
          <MoreHorizontal class="w-6 h-6 text-gray-400" />
        </button>
        <button @click="emit('close')" class="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
          <X class="w-6 h-6 text-gray-400" />
        </button>
      </div>
    </div>
    
    <!-- 验证错误提示 -->
    <div v-if="validationError" class="px-6 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
      <p class="text-sm text-red-600 dark:text-red-400">{{ validationError }}</p>
    </div>

    <!-- Content: 创建模式 -->
    <div class="flex-1 overflow-y-auto" v-if="isCreateMode">
      <div class="px-6 py-5 space-y-5">
        <!-- Title -->
        <input 
          v-model="draftTask.title"
          ref="draftTitleInput"
          class="w-full text-xl font-semibold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white placeholder-gray-400"
          :placeholder="t('task.title_placeholder')"
        />

        <!-- Metadata -->
        <div class="space-y-3">
          <!-- Start Date -->
          <div class="flex items-center">
            <span class="text-sm text-gray-500 w-24">{{ t('task.start_date') }}</span>
            <DatePicker v-model="draftTask.startDate" :placeholder="t('task.set_start_date')" />
          </div>

          <!-- Due Date -->
          <div class="flex items-center">
            <span class="text-sm text-gray-500 w-24">{{ t('task.due_date') }}</span>
            <DatePicker v-model="draftTask.dueDate" :placeholder="t('task.set_due_date')" />
          </div>

          <!-- Priority 下拉 -->
          <div class="flex items-center">
            <span class="text-sm text-gray-500 w-24">{{ t('task.priority') }}</span>
            <Dropdown
              :model-value="draftTask.priority || ''"
              :options="priorityOptions"
              :placeholder="t('task.set_priority')"
              @update:model-value="updateDraftPriority"
            >
              <template #trigger>
                <span 
                  v-if="draftTask.priority"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer"
                  :class="getPriorityClass(draftTask.priority)"
                >
                  <BarChart3 class="w-3.5 h-3.5" />
                  {{ getPriorityLabel(draftTask.priority) }}
                  <ChevronDown class="w-3 h-3 opacity-60" />
                </span>
                <span v-else class="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
                  <Plus class="w-4 h-4" />
                  {{ t('task.set_priority') }}
                </span>
              </template>
            </Dropdown>
          </div>

          <!-- Labels 多选下拉 -->
          <div class="flex items-center">
            <span class="text-sm text-gray-500 w-24">{{ t('task.tags') }}</span>
            <div class="flex items-center gap-2 flex-wrap">
              <!-- 已选标签 -->
              <span 
                v-for="labelId in draftTask.labels" 
                :key="labelId"
                class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300"
              >
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getLabelColor(labelId) }"></span>
                {{ getLabelName(labelId) }}
                <button @click="toggleDraftLabel(labelId)" class="ml-0.5 opacity-60 hover:opacity-100">
                  <X class="w-3 h-3" />
                </button>
              </span>
              
              <!-- 添加标签下拉 -->
              <Dropdown
                :model-value="draftTask.labels"
                :options="labelOptions"
                multiple
                @update:model-value="updateDraftLabels"
              >
                <template #trigger>
                  <span class="inline-flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-zinc-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 cursor-pointer transition-colors">
                    <Plus class="w-3.5 h-3.5" />
                  </span>
                </template>
              </Dropdown>
            </div>
          </div>
        </div>

        <!-- Description Markdown Editor -->
        <div class="pt-2">
          <div class="flex items-center gap-2 mb-3">
            <FileText class="w-4 h-4 text-gray-500" />
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ t('task.description') }}</h3>
          </div>
          
          <div class="bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <MarkdownEditor 
              v-model="draftTask.description"
              :placeholder="t('task.description_placeholder')"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Content: 编辑模式 -->
    <div class="flex-1 overflow-y-auto" v-else-if="task">
      <div class="px-6 py-5 space-y-5">
        <!-- Title -->
        <input 
          v-model="task.title"
          class="w-full text-xl font-semibold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white placeholder-gray-400"
          :placeholder="t('task.title_placeholder')"
        />

        <!-- Metadata -->
        <div class="space-y-3">
          <!-- Start Date -->
          <div class="flex items-center">
            <span class="text-sm text-gray-500 w-24">{{ t('task.start_date') }}</span>
            <DatePicker 
              :model-value="task.startDate" 
              @update:model-value="updateStartDate"
              :placeholder="t('task.set_start_date')" 
            />
          </div>

          <!-- Due Date -->
          <div class="flex items-center">
            <span class="text-sm text-gray-500 w-24">{{ t('task.due_date') }}</span>
            <DatePicker 
              :model-value="task.dueDate" 
              @update:model-value="updateDueDate"
              :placeholder="t('task.set_due_date')" 
            />
          </div>

          <!-- Priority 下拉 -->
          <div class="flex items-center">
            <span class="text-sm text-gray-500 w-24">{{ t('task.priority') }}</span>
            <Dropdown
              :model-value="task.priority || ''"
              :options="priorityOptions"
              :placeholder="t('task.set_priority')"
              @update:model-value="updatePriority"
            >
              <template #trigger>
                <span 
                  v-if="task.priority"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer"
                  :class="getPriorityClass(task.priority)"
                >
                  <BarChart3 class="w-3.5 h-3.5" />
                  {{ getPriorityLabel(task.priority) }}
                  <ChevronDown class="w-3 h-3 opacity-60" />
                </span>
                <span v-else class="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
                  <Plus class="w-4 h-4" />
                  {{ t('task.set_priority') }}
                </span>
              </template>
            </Dropdown>
          </div>

          <!-- Tags 多选下拉 -->
          <div class="flex items-center">
            <span class="text-sm text-gray-500 w-24">{{ t('task.tags') }}</span>
            <div class="flex items-center gap-2 flex-wrap">
              <!-- 已选标签 -->
              <span 
                v-for="labelId in task.labels" 
                :key="labelId"
                class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300"
              >
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getLabelColor(labelId) }"></span>
                {{ getLabelName(labelId) }}
                <button @click="toggleLabel(labelId)" class="ml-0.5 opacity-60 hover:opacity-100">
                  <X class="w-3 h-3" />
                </button>
              </span>
              
              <!-- 添加标签下拉 -->
              <Dropdown
                :model-value="task.labels"
                :options="labelOptions"
                multiple
                @update:model-value="updateLabels"
              >
                <template #trigger>
                  <span class="inline-flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-zinc-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 cursor-pointer transition-colors">
                    <Plus class="w-3.5 h-3.5" />
                  </span>
                </template>
              </Dropdown>
            </div>
          </div>

          <!-- Location -->
          <div class="flex items-center">
            <span class="text-sm text-gray-500 w-24">{{ t('task.location') }}</span>
            <button class="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <MapPin class="w-4 h-4" />
              <span>{{ t('task.add_location') }}</span>
            </button>
          </div>
        </div>

        <!-- Description Markdown Editor -->
        <div class="pt-2">
          <div class="flex items-center gap-2 mb-3">
            <FileText class="w-4 h-4 text-gray-500" />
            <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ t('task.description') }}</h3>
          </div>
          
          <div class="bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
            <MarkdownEditor 
              :model-value="task.description || ''" 
              @update:model-value="updateDescription"
              :placeholder="t('task.description_placeholder')"
            />
          </div>
        </div>

        <!-- Subtasks -->
        <div class="pt-2">
           <div class="flex items-center justify-between mb-3">
             <div class="flex items-center gap-2">
               <ListTodo class="w-4 h-4 text-gray-500" />
               <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ t('task.subtasks') }}</h3>
               <span class="text-xs text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                 {{ completedSubtasksCount }}/{{ subtasks.length }}
               </span>
             </div>
           </div>
           
           <!-- Subtask List -->
          <div class="space-y-1 mb-3">
            <div 
              v-for="subtask in subtasks" 
              :key="subtask.id"
              class="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg group cursor-pointer transition-colors"
              @click="pushTask(subtask.id)"
            >
              <input 
                type="checkbox" 
                :checked="subtask.completed"
                @click.stop="toggleSubtaskComplete(subtask)"
                class="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500 cursor-pointer"
              />
              <span 
                class="flex-1 text-sm"
                :class="subtask.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'"
              >
                {{ subtask.title }}
              </span>
              <button 
                @click.stop="deleteSubtask(subtask.id)"
                class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button 
            @click="addSubtask" 
            class="flex items-center justify-center gap-2 w-full py-2 text-sm text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors"
          >
            <Plus class="w-4 h-4" /> {{ t('task.add_subtask') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue';
import { useTaskModal } from '@/composables/useTaskModal';
import { useTaskStore, Task } from '@/stores/task';
import { useProjectStore } from '@/stores/project';
import { useColumnStore } from '@/stores/column';
import { useLabelStore } from '@/stores/label';
import { 
  X, MoreHorizontal, Plus, Trash2, ArrowLeft, ChevronDown, BarChart3,
  FileText, ListTodo, MapPin
} from 'lucide-vue-next';
import DatePicker from '@/components/common/DatePicker.vue';
import Dropdown from '@/components/ui/Dropdown.vue';
import MarkdownEditor from '@/components/ui/MarkdownEditor.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  taskId?: string;
  isCreateMode?: boolean;
  index: number;
}>();

const emit = defineEmits(['close', 'back']);

const { 
  draftTask,
  pushTask,
} = useTaskModal();

const taskStore = useTaskStore();
const projectStore = useProjectStore();
const columnStore = useColumnStore();
const labelStore = useLabelStore();

const panelRef = ref<HTMLElement | null>(null);
const draftTitleInput = ref<HTMLInputElement | null>(null);
const validationError = ref<string | null>(null);

function handleEsc() {
  // Bubbles up to Modal
}

onMounted(async () => {
    await nextTick();
    if (props.isCreateMode && draftTitleInput.value) {
      draftTitleInput.value.focus();
    } else {
      panelRef.value?.focus();
    }
});

const task = computed(() => {
  if (props.isCreateMode) return null;
  if (!props.taskId) return null;
  return taskStore.tasks.find(t => t.id === props.taskId);
});

const subtasks = computed(() => {
  if (!props.taskId) return [];
  return taskStore.getSubtasks(props.taskId);
});

const completedSubtasksCount = computed(() => {
  return subtasks.value.filter(st => st.completed).length;
});

// Options
const columnOptions = computed(() => columnStore.columns.map(col => ({
  value: col.id, label: col.name, color: getColumnColorHex(col.id)
})));

const projectOptions = computed(() => projectStore.projects.map(proj => ({
  value: proj.id, label: proj.name, color: proj.color
})));

const priorityOptions = computed(() => [
  { value: 'low', label: t('priority.low'), color: '#10B981' },
  { value: 'medium', label: t('priority.medium'), color: '#3B82F6' },
  { value: 'high', label: t('priority.high'), color: '#EF4444' },
]);

const labelOptions = computed(() => labelStore.labels.map(l => ({
  value: l.id, label: l.name, color: getColorHex(l.color)
})));

// Helper functions (Simplified)
function getColumnName(id?: string) { return columnStore.columns.find(c => c.id === id)?.name || id; }
function getProjectName(id?: string) { return projectStore.getProject(id || '')?.name || 'Unknown'; }
function getLabelName(id: string) { return labelStore.labels.find(l => l.id === id)?.name || id; }
function getLabelColor(id: string) { return getColorHex(labelStore.labels.find(l => l.id === id)?.color || 'gray'); }

function getColumnColorHex(columnId?: string): string {
  const colorMap: Record<string, string> = { 'todo': '#3B82F6', 'in-progress': '#F59E0B', 'review': '#8B5CF6', 'done': '#10B981' };
  return colorMap[columnId || ''] || '#9CA3AF';
}

function getColorHex(color: string): string {
    // Basic mapping, assume standard tailwind colors or hex
    const map: Record<string, string> = { red: '#EF4444', blue: '#3B82F6', green: '#10B981', orange: '#F97316', purple: '#A855F7', gray: '#6B7280' };
    return map[color] || color;
}

function getPriorityLabel(p?: string) { return p ? t(`priority.${p}`) : p; }
function getPriorityClass(p?: string) {
    if (p === 'low') return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30';
    if (p === 'medium') return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30';
    if (p === 'high') return 'bg-red-100 text-red-600 dark:bg-red-900/30';
    return '';
}

// Update / Actions
function updateColumn(val: any) { if(task.value && !Array.isArray(val)) taskStore.updateTask(task.value.id, { columnId: val }); }
function updateProject(val: any) { if(task.value && !Array.isArray(val)) taskStore.updateTask(task.value.id, { projectId: val }); }
function updatePriority(val: any) { if(task.value && !Array.isArray(val)) taskStore.updateTask(task.value.id, { priority: val }); }
function updateLabels(val: any) { if(task.value) taskStore.updateTask(task.value.id, { labels: Array.isArray(val) ? val : [val] }); }
function updateDescription(val: string) { if(task.value) taskStore.updateTask(task.value.id, { description: val }); }
function updateStartDate(val: string) { if(task.value) taskStore.updateTask(task.value.id, { startDate: val }); }
function updateDueDate(val: string) { if(task.value) taskStore.updateTask(task.value.id, { dueDate: val }); }
function toggleLabel(id: string) { if(task.value) updateLabels(task.value.labels.filter(l => l !== id)); }
function toggleSubtaskComplete(st: Task) { taskStore.updateTask(st.id, { completed: !st.completed }); }
function deleteSubtask(id: string) { taskStore.deleteTask(id); }

function addSubtask() {
  if (!task.value) return;
  const newId = taskStore.addTask({
    projectId: task.value.projectId,
    columnId: task.value.columnId,
    title: t('task.add_subtask'),
    parentId: task.value.id,
    labels: [],
    completed: false
  });
  pushTask(newId);
}

// Draft Actions
function updateDraftColumn(val: any) { if(!Array.isArray(val)) draftTask.columnId = val; }
function updateDraftProject(val: any) { if(!Array.isArray(val)) draftTask.projectId = val; }
function updateDraftPriority(val: any) { if(!Array.isArray(val)) draftTask.priority = val; }
function updateDraftLabels(val: any) { draftTask.labels = Array.isArray(val) ? val : [val]; }
function toggleDraftLabel(id: string) { draftTask.labels = draftTask.labels.filter(l => l !== id); }

</script>
