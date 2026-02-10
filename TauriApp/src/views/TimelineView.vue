<template>
  <div class="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden">
    <!-- Gantt Chart Area -->
    <div class="flex flex-col border-b border-gray-200 dark:border-zinc-800" :style="{ maxHeight: '60vh' }">
      <!-- Timeline Header -->
      <div class="flex border-b border-gray-200 dark:border-zinc-800 shrink-0 sticky top-0 z-30 bg-white dark:bg-zinc-900">
          <!-- Sidebar Header -->
          <div class="w-[300px] shrink-0 p-3 border-r border-gray-200 dark:border-zinc-800 font-medium text-sm text-gray-500 dark:text-gray-400 flex items-center bg-gray-50 dark:bg-zinc-900">
              {{ $t('task.title') }}
          </div>
          
          <!-- Dates Header (Scrollable Sync) -->
          <div class="flex-1 overflow-x-hidden" ref="headerContainer">
              <div class="flex h-12" :style="{ width: totalWidth + 'px' }">
                  <div v-for="day in days" :key="day.iso" class="w-[40px] shrink-0 border-r border-gray-100 dark:border-zinc-800 flex flex-col items-center justify-center">
                      <span class="text-[10px] uppercase text-gray-400 font-bold mb-0.5">{{ day.dow }}</span>
                      <span class="text-xs font-medium" :class="day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'">{{ day.date }}</span>
                  </div>
              </div>
          </div>
      </div>

      <!-- Timeline Body -->
      <div 
          class="flex-1 overflow-auto flex flex-col relative custom-scrollbar-x" 
          ref="bodyContainer"
          @scroll="syncScroll"
          @wheel="handleWheel"
      >
          <div class="relative w-max min-w-full">
              <!-- Rows -->
              <template v-for="task in displayTasks" :key="task.id">
                  <div 
                      class="flex h-10 border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors group"
                  >
                      <!-- Task Info (Sticky Left) -->
                      <div 
                        class="w-[300px] shrink-0 px-3 border-r border-gray-200 dark:border-zinc-800 flex items-center gap-2 sticky left-0 bg-white dark:bg-zinc-900 z-10 group-hover:bg-gray-50 dark:group-hover:bg-zinc-800/30 cursor-pointer"
                        :style="{ paddingLeft: (task.level * 20 + 12) + 'px' }"
                        @click="openTask(task.id)"
                      >
                          <div 
                            v-if="hasSubtasks(task.id)" 
                            class="w-4 h-4 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition-colors"
                            @click.stop="toggleExpand(task.id)"
                          >
                             <ChevronRight :size="14" class="transition-transform text-gray-400" :class="{ 'rotate-90': isExpanded(task.id) }" />
                          </div>
                          <div v-else class="w-4"></div>

                          <div class="w-2 h-2 rounded-full shrink-0" :class="getPriorityColor(task.priority)"></div>
                          <span class="text-sm text-gray-700 dark:text-gray-200 truncate flex-1">{{ task.title }}</span>
                      </div>

                      <!-- Timeline Bar Base -->
                      <div class="relative flex-1" :style="{ width: totalWidth + 'px' }">
                          <!-- Background Grid -->
                          <div class="absolute inset-0 flex pointer-events-none">
                              <div v-for="i in days.length" :key="i" class="w-[40px] border-r border-dashed border-gray-100 dark:border-zinc-800/50 h-full"></div>
                          </div>

                          <!-- Task Bar -->
                          <div 
                              v-if="getTaskPosition(task)"
                              class="absolute top-2 h-6 rounded-md px-2 flex items-center shadow-sm cursor-pointer hover:brightness-95 transition-all text-xs font-medium text-white overflow-hidden whitespace-nowrap z-0"
                              :class="getBarColor(task.priority)"
                              :style="getTaskPosition(task)"
                              @click="openTask(task.id)"
                          >
                              {{ task.title }}
                          </div>
                      </div>
                  </div>
              </template>
          </div>
      </div>
    </div>

    <!-- Bottom List: Tasks without Start Date -->
    <div class="flex-1 overflow-hidden flex flex-col bg-gray-50/50 dark:bg-zinc-900/50">
      <div class="p-3 border-b border-gray-200 dark:border-zinc-800 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <List :size="14" />
        {{ $t('task.unplanned') || 'Unplanned Tasks' }}
        <span class="ml-auto text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-zinc-800 rounded-full">{{ unassignedTasks.length }}</span>
      </div>
      <div class="flex-1 overflow-y-auto p-2">
        <div v-if="unassignedTasks.length === 0" class="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
           No unplanned tasks
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
           <div 
            v-for="task in unassignedTasks" 
            :key="task.id"
            @click="openTask(task.id)"
            class="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group"
           >
              <div class="w-1.5 h-6 rounded-full" :class="getPriorityColor(task.priority)"></div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{{ task.title }}</div>
                <div class="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                   <span v-if="task.dueDate" class="flex items-center gap-1">
                      <Calendar :size="10" /> {{ task.dueDate.split('T')[0] }}
                   </span>
                   <span v-else>No due date</span>
                </div>
              </div>
              <ArrowRight :size="14" class="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTaskStore, Task } from '@/stores/task';
import { useTaskModal } from '@/composables/useTaskModal';
import { getLocalDateISOString } from '@/utils/date';
import { ChevronRight, List, Calendar, ArrowRight } from 'lucide-vue-next';

const route = useRoute();
const taskStore = useTaskStore();
const { openTask } = useTaskModal();

const headerContainer = ref<HTMLElement | null>(null);
const bodyContainer = ref<HTMLElement | null>(null);
const expandedTaskIds = ref<Set<string>>(new Set());

function syncScroll() {
    if (headerContainer.value && bodyContainer.value) {
        headerContainer.value.scrollLeft = bodyContainer.value.scrollLeft;
    }
}

function handleWheel(e: WheelEvent) {
    if (!bodyContainer.value) return;

    // 如果是 Mac 触摸板或已经产生水平滚动增量，让原生行为处理（除非被 preventDefault 阻止）
    // 但这里我们想要手动控制或者增强
    // 通常 Shift + 滚轮应该产生 deltaX (Mac) 或 deltaY (Windows Mouse + Shift)
    
    if (e.shiftKey) {
        if (e.deltaX !== 0) {
            // 原生支持 Shift -> deltaX 的设备 (Mac Trackpad)
            // 不需要干预，除非我们想要自定义速度
        } else {
             // 鼠标滚轮 + Shift，通常产生 deltaY，我们需要将其转换为水平滚动
             e.preventDefault();
             bodyContainer.value.scrollLeft += e.deltaY;
        }
    }
}

function toggleExpand(taskId: string) {
    if (expandedTaskIds.value.has(taskId)) {
        expandedTaskIds.value.delete(taskId);
    } else {
        expandedTaskIds.value.add(taskId);
    }
}

function isExpanded(taskId: string) {
    return expandedTaskIds.value.has(taskId);
}

function hasSubtasks(taskId: string) {
    return taskStore.tasks.some(t => t.parentId === taskId && t.startDate);
}

// Timeline Config
const cellWidth = 40;
const totalDays = 60; 
const startDate = new Date();
startDate.setDate(startDate.getDate() - 5); 

const days = computed(() => {
    const arr = [];
    const d = new Date(startDate);
    for (let i = 0; i < totalDays; i++) {
        arr.push({
            date: d.getDate(),
            dow: d.toLocaleString('en-US', { weekday: 'short' }).substring(0, 1),
            isToday: d.toDateString() === new Date().toDateString(),
            iso: getLocalDateISOString(d)
        });
        d.setDate(d.getDate() + 1);
    }
    return arr;
});

const totalWidth = computed(() => totalDays * cellWidth);

// Recursive helper to build display tree
interface TreeTask extends Task {
    level: number;
}

const displayTasks = computed(() => {
    const projectId = route.params.id as string;
    const allTasks = projectId ? taskStore.tasks.filter(t => t.projectId === projectId) : taskStore.tasks;
    
    const result: TreeTask[] = [];
    const topLevelWithStart = allTasks.filter(t => !t.parentId && t.startDate);

    function traverse(tasks: Task[], level: number) {
        tasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        for (const task of tasks) {
            result.push({ ...task, level });
            if (isExpanded(task.id)) {
                const subtasks = allTasks.filter(t => t.parentId === task.id && t.startDate);
                if (subtasks.length > 0) {
                    traverse(subtasks, level + 1);
                }
            }
        }
    }

    traverse(topLevelWithStart, 0);
    return result;
});

const unassignedTasks = computed(() => {
    const projectId = route.params.id as string;
    return taskStore.tasks.filter(t => {
        const matchProject = projectId ? t.projectId === projectId : true;
        return matchProject && !t.startDate && !t.isTrashed;
    });
});

function getPriorityColor(priority?: string) {
    switch (priority) {
        case 'high': return 'bg-red-500';
        case 'medium': return 'bg-yellow-500';
        case 'low': return 'bg-green-500';
        default: return 'bg-blue-500';
    }
}

function getBarColor(priority?: string) {
    switch (priority) {
        case 'high': return 'bg-red-500/80 border border-red-600';
        case 'medium': return 'bg-yellow-500/80 border border-yellow-600';
        case 'low': return 'bg-green-500/80 border border-green-600';
        default: return 'bg-blue-500/80 border border-blue-600';
    }
}

function getTaskPosition(task: Task) {
    if (!task.startDate) return null;
    
    const start = new Date(task.startDate);
    const timelineStart = new Date(startDate);
    
    // Calculate start offset
    const diffTime = start.getTime() - timelineStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    
    // Calculate duration
    let duration = 1; // Default 1 day
    if (task.dueDate) {
        const due = new Date(task.dueDate);
        const durationTime = due.getTime() - start.getTime();
        duration = Math.max(1, Math.ceil(durationTime / (1000 * 60 * 60 * 24)));
    }
    
    // Visibility check
    if (diffDays + duration < 0 || diffDays >= totalDays) return null;
    
    // Adjust for clipping
    const actualLeft = Math.max(0, diffDays);
    const visibleDuration = Math.min(duration - (actualLeft - diffDays), totalDays - actualLeft);

    if (visibleDuration <= 0) return null;

    return {
        left: `${actualLeft * cellWidth}px`,
        width: `${visibleDuration * cellWidth}px`
    };
}
</script>

<style scoped>
.custom-scrollbar-x::-webkit-scrollbar {
  height: 6px;
}
.custom-scrollbar-x::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar-x::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}
.custom-scrollbar-x::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>
