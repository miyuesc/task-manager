<template>
  <div class="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
    <div class="top-row mb-4 flex items-center justify-between">
      <!-- 面包屑导航: 项目 / 列 -->
      <div class="flex items-center gap-2 text-sm">
        <button v-if="showBackButton" @click="$emit('back')" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors mr-1">
          <ArrowLeft class="w-4 h-4 text-gray-500" />
        </button>
        
        <!-- Column Selector -->
        <Dropdown
          :model-value="task.columnId"
          :options="columnOptions"
          @update:model-value="(val) => $emit('update', 'columnId', val)"
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
        
        <!-- Project Selector -->
        <Dropdown
          :model-value="task.projectId"
          :options="projectOptions"
          @update:model-value="(val) => $emit('update', 'projectId', val)"
        >
          <template #trigger>
            <span class="flex items-center gap-1.5 cursor-pointer text-blue-500 hover:text-blue-600">
              <span class="text-sm">{{ getProjectName(task.projectId) || t('task.select_project') }}</span>
              <ChevronDown class="w-3.5 h-3.5" />
            </span>
          </template>
        </Dropdown>
      </div>

       <div class="flex items-center gap-2">
        <!-- Trashed Indicator -->
        <span 
          v-if="task.isTrashed" 
          class="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        >
          {{ t('task.is_trashed') }}
        </span>

        <button class="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
          <MoreHorizontal class="w-6 h-6 text-gray-400" />
        </button>
        <button @click="$emit('close')" class="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
          <X class="w-6 h-6 text-gray-400" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowLeft, ChevronDown, MoreHorizontal, X } from 'lucide-vue-next';
import Dropdown from '@/components/ui/Dropdown.vue';
import { useProjectStore } from '@/stores/project';
import { useColumnStore } from '@/stores/column';

defineProps<{
  task: any; // Using any temporarily for flexibility, ideally define strict interface
  showBackButton?: boolean;
}>();

defineEmits(['update', 'close', 'back']);

const { t } = useI18n();
const projectStore = useProjectStore();
const columnStore = useColumnStore();

// Options
const columnOptions = computed(() => columnStore.columns.map(col => ({
  value: col.id, label: col.name
})));

const projectOptions = computed(() => projectStore.projects.map(proj => ({
  value: proj.id, label: proj.name
})));

// Helper Functions
function getColumnName(id?: string) { return columnStore.columns.find(c => c.id === id)?.name || id; }
function getProjectName(id?: string) { return projectStore.getProject(id || '')?.name || 'Unknown'; }

function getColumnColorHex(columnId?: string): string {
  const colorMap: Record<string, string> = { 'todo': '#3B82F6', 'in-progress': '#F59E0B', 'review': '#8B5CF6', 'done': '#10B981' };
  return colorMap[columnId || ''] || '#9CA3AF';
}
</script>
