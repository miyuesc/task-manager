<template>
  <div class="pt-2">
     <div class="flex items-center justify-between mb-3">
       <div class="flex items-center gap-2">
         <ListTodo class="w-4 h-4 text-gray-500" />
         <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ t('task.subtasks') }}</h3>
         <span class="text-xs text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
           {{ completedCount }}/{{ subtasks.length }}
         </span>
       </div>
     </div>
     
     <!-- Subtask List -->
    <div class="space-y-1 mb-3">
      <div 
        v-for="subtask in subtasks" 
        :key="subtask.id"
        class="flex items-center gap-2.5 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-800/50 rounded-lg group cursor-pointer transition-colors"
        :class="{ 'opacity-50 grayscale': subtask.isTrashed }"
        @click="$emit('open', subtask.id)"
      >
        <input 
          type="checkbox" 
          :checked="subtask.completed"
          :disabled="subtask.isTrashed"
          @click.stop="$emit('toggle', subtask)"
          class="w-4 h-4 rounded border-gray-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span 
          class="flex-1 text-sm"
          :class="subtask.completed || subtask.isTrashed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'"
        >
          {{ subtask.title }}
          <span 
            v-if="getSubtaskCount(subtask.id).total > 0"
            class="ml-2 text-xs text-gray-400"
          >
            {{ getSubtaskCount(subtask.id).completed }}/{{ getSubtaskCount(subtask.id).total }}
          </span>
        </span>
        <button 
          @click.stop="$emit('delete', subtask.id)"
          class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <button 
      @click="$emit('add')" 
      class="flex items-center justify-center gap-2 w-full py-2 text-sm text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors"
    >
      <Plus class="w-4 h-4" /> {{ t('task.add_subtask') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ListTodo, Trash2, Plus } from 'lucide-vue-next';
import { Task, useTaskStore } from '@/stores/task';

const props = defineProps<{
  subtasks: Task[];
}>();

defineEmits(['add', 'delete', 'toggle', 'open']);

const { t } = useI18n();
const taskStore = useTaskStore();

const completedCount = computed(() => props.subtasks.filter(st => st.completed).length);

function getSubtaskCount(taskId: string) {
  const children = taskStore.getSubtasks(taskId);
  return {
    total: children.length,
    completed: children.filter(t => t.completed).length
  };
}
</script>
