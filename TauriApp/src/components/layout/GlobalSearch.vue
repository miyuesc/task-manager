<template>
  <div class="flex-1 max-w-md relative group" @keydown="handleKeyDown">
    <div class="relative">
      <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
      <input 
        ref="inputRef"
        v-model="searchQuery"
        type="text" 
        :placeholder="t('common.searchPlaceholder') || 'Search tasks...'" 
        class="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        @focus="isSearchFocused = true"
        @blur="handleBlur"
      />
    </div>

    <!-- Search Results Dropdown -->
    <Transition name="fade-scale">
      <div 
        v-if="isSearchFocused && searchQuery.trim()"
        class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 py-2"
      >
        <template v-if="filteredTasks.length > 0">
          <div 
            v-for="(task, index) in filteredTasks" 
            :key="task.id"
            @mousedown="selectTask(task)"
            @mouseenter="selectedIndex = index"
            class="px-4 py-2.5 cursor-pointer flex flex-col gap-0.5 transition-colors group/item"
            :class="[selectedIndex === index ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-50 dark:hover:bg-zinc-800']"
          >
            <div class="flex items-center justify-between">
              <span 
                class="text-sm font-medium transition-colors"
                :class="[selectedIndex === index ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400']"
              >
                {{ task.title }}
              </span>
              <span v-if="task.projectName" class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300">
                {{ task.projectName }}
              </span>
            </div>
            <div v-if="task.description" class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {{ task.description }}
            </div>
          </div>
        </template>
        <div 
          v-else
          class="py-8 text-center"
        >
          <div class="text-gray-400 dark:text-gray-500 text-sm">
            {{ t('common.noResults') || 'No tasks found' }}
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Search } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useTaskStore, Task } from '@/stores/task';
import { useProjectStore } from '@/stores/project';
import { useTaskModal } from '@/composables/useTaskModal';

const { t } = useI18n();
const router = useRouter();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const taskModal = useTaskModal();

const searchQuery = ref('');
const isSearchFocused = ref(false);
const selectedIndex = ref(-1);
const inputRef = ref<HTMLInputElement | null>(null);

const filteredTasks = computed(() => {
  if (!searchQuery.value.trim()) return [];
  const query = searchQuery.value.toLowerCase();
  return taskStore.tasks
    .filter(task => 
      !task.isTrashed && 
      (task.title.toLowerCase().includes(query) || task.description?.toLowerCase().includes(query))
    )
    .map(task => ({
      ...task,
      projectName: projectStore.getProject(task.projectId)?.name
    }))
    .slice(0, 8);
});

// 当搜索词改变时，重置选中索引
watch(searchQuery, () => {
  selectedIndex.value = -1;
});

const handleBlur = () => {
  setTimeout(() => {
    isSearchFocused.value = false;
    selectedIndex.value = -1;
  }, 200);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (!isSearchFocused.value || filteredTasks.value.length === 0) return;

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      selectedIndex.value = (selectedIndex.value + 1) % filteredTasks.value.length;
      break;
    case 'ArrowUp':
      e.preventDefault();
      selectedIndex.value = (selectedIndex.value - 1 + filteredTasks.value.length) % filteredTasks.value.length;
      break;
    case 'Enter':
      e.preventDefault();
      if (selectedIndex.value >= 0) {
        selectTask(filteredTasks.value[selectedIndex.value]);
      }
      break;
    case 'Escape':
      inputRef.value?.blur();
      break;
  }
};

const selectTask = (task: Task) => {
  // 1. 切换到对应的项目状态
  projectStore.activeProjectId = task.projectId;
  
  // 2. 路由跳转到对应项目视图
  // 按路由配置，访问 /project/:id 会自动重定向到 /project/:id/board
  router.push(`/project/${task.projectId}`);
  
  // 3. 打开任务详情弹窗
  taskModal.openTask(task.id);
  
  // 4. 清空界面状态并失去焦点
  searchQuery.value = '';
  isSearchFocused.value = false;
  selectedIndex.value = -1;
  inputRef.value?.blur();
};
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
