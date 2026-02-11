<template>
  <div class="flex flex-col h-full bg-white dark:bg-zinc-900 overflow-hidden">
    <!-- 甘特图区域 -->
    <div class="flex flex-col border-b border-gray-200 dark:border-zinc-800" :style="{ height: '50vh' }">
      <!-- 时间轴 Header -->
      <div class="flex h-12 border-b border-gray-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
          <div class="w-[300px] shrink-0 p-3 border-r border-gray-200 dark:border-zinc-800 font-medium text-sm text-gray-500 dark:text-gray-400 flex items-center bg-gray-50 dark:bg-zinc-900 h-full">
              {{ $t('task.title') }}
          </div>
          <div class="flex-1 overflow-hidden h-full" ref="headerContainer">
              <div class="flex h-full" :style="{ width: totalWidth + 'px' }">
                  <div v-for="day in days" :key="day.iso" class="w-[40px] shrink-0 border-r border-gray-100 dark:border-zinc-800 flex flex-col items-center justify-center h-full">
                      <span class="text-[10px] uppercase text-gray-400 font-bold mb-0.5">{{ day.dow }}</span>
                      <span class="text-xs font-medium" :class="day.isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'">{{ day.date }}</span>
                  </div>
              </div>
          </div>
      </div>

      <!-- 甘特图主体 (左右分栏) -->
      <div class="flex flex-1 overflow-hidden relative">
          <!-- 左侧任务列表 -->
          <div 
            class="w-[300px] shrink-0 overflow-hidden border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-10"
            ref="leftContainer"
            @wheel="onLeftWheel"
          >
             <template v-for="row in displayRows" :key="row.key">
               <!-- 项目分组头 -->
               <div v-if="row.type === 'project-header'" 
                    class="flex h-8 items-center px-3 gap-2 bg-gray-100/50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800/50 cursor-pointer select-none"
                    @click="toggleProjectExpand(row.projectId!)"
               >
                 <ChevronRight :size="14" class="transition-transform text-gray-400" :class="{ 'rotate-90': isProjectExpanded(row.projectId!) }" />
                 <span class="w-2 h-2 rounded-full shrink-0" :class="getProjectColorClass(row.projectId!)"></span>
                 <span class="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate">{{ row.label }}</span>
                 <span class="ml-auto text-[10px] text-gray-400">{{ row.count }}</span>
               </div>
               <!-- 任务行 -->
               <div v-else-if="row.type === 'task'"
                    class="flex h-10 border-b border-gray-100 dark:border-zinc-800/50 items-center px-3 gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                    :style="{ paddingLeft: (row.level! * 20 + 32) + 'px' }"
                    @click="openTask(row.task!.id)"
               >
                 <div 
                    v-if="hasSubtasks(row.task!.id)" 
                    class="w-4 h-4 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-zinc-700 rounded transition-colors"
                    @click.stop="toggleExpand(row.task!.id)"
                  >
                     <ChevronRight :size="14" class="transition-transform text-gray-400" :class="{ 'rotate-90': isExpanded(row.task!.id) }" />
                  </div>
                  <div v-else class="w-4"></div>
                  <div class="w-2 h-2 rounded-full shrink-0" :class="getPriorityColor(row.task!.priority)"></div>
                  <span class="text-sm text-gray-700 dark:text-gray-200 truncate flex-1">{{ row.task!.title }}</span>
               </div>
             </template>
          </div>

          <!-- 右侧甘特图条 -->
          <div 
             class="flex-1 overflow-auto custom-scrollbar-x" 
             ref="rightContainer"
             @scroll="onRightScroll"
             @wheel="onRightWheel"
          >
             <div class="relative" :style="{ width: totalWidth + 'px', minHeight: '100%' }">
                 <!-- 背景网格 -->
                 <div class="absolute inset-0 flex pointer-events-none z-0">
                     <div v-for="i in days.length" :key="i" class="w-[40px] border-r border-dashed border-gray-100 dark:border-zinc-800/50 h-full"></div>
                 </div>

                 <!-- 行 -->
                 <template v-for="row in displayRows" :key="row.key">
                   <!-- 项目分组头（空行占位） -->
                   <div v-if="row.type === 'project-header'" class="relative h-8 border-b border-gray-100 dark:border-zinc-800/50 bg-gray-100/30 dark:bg-zinc-800/30"></div>
                   <!-- 任务条 -->
                   <div v-else-if="row.type === 'task'" class="relative h-10 border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors z-10">
                       <div 
                           v-if="getTaskPosition(row.task!)"
                           class="absolute top-2 h-6 rounded-md px-2 flex items-center shadow-sm cursor-pointer hover:brightness-95 transition-all text-xs font-medium text-white overflow-hidden whitespace-nowrap"
                           :class="getBarColor(row.task!.priority)"
                           :style="getTaskPosition(row.task!)"
                           @click="openTask(row.task!.id)"
                       >
                           {{ row.task!.title }}
                       </div>
                   </div>
                 </template>
             </div>
          </div>
      </div>
    </div>

    <!-- 底部未规划区域 -->
    <div class="flex-1 overflow-hidden flex flex-col bg-gray-50/50 dark:bg-zinc-900/50">
      <div class="p-3 border-b border-gray-200 dark:border-zinc-800 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
        <ListIcon :size="14" />
        {{ $t('task.unplanned') || 'Unplanned Tasks' }}
        <span class="ml-auto text-[10px] px-1.5 py-0.5 bg-gray-200 dark:bg-zinc-800 rounded-full">{{ totalUnassignedCount }}</span>
      </div>
      <div class="flex-1 overflow-y-auto p-2">
        <div v-if="totalUnassignedCount === 0" class="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
           {{ $t('common.noTasks') }}
        </div>
        <template v-else>
          <!-- 按项目分组 -->
          <div v-for="group in unassignedGroups" :key="group.projectId" class="mb-3">
            <div class="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <span class="w-2 h-2 rounded-full" :class="getProjectColorClass(group.projectId)"></span>
              {{ group.projectName }}
              <span class="text-gray-300">·</span>
              <span class="text-gray-400 font-normal">{{ group.tasks.length }}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
               <div 
                v-for="task in group.tasks" 
                :key="task.id"
                @click="openTask(task.id)"
                class="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group"
                :style="{ paddingLeft: (getTaskLevel(task) * 16 + 12) + 'px' }"
               >
                  <div class="w-1.5 h-6 rounded-full" :class="getPriorityColor(task.priority)"></div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{{ task.title }}</div>
                    <div class="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                       <span v-if="task.dueDate" class="flex items-center gap-1">
                          <Calendar :size="10" /> {{ task.dueDate.split('T')[0] }}
                       </span>
                    </div>
                  </div>
                  <ArrowRight :size="14" class="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
               </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTaskStore, Task } from '@/stores/task';
import { useProjectStore } from '@/stores/project';
import { useTaskModal } from '@/composables/useTaskModal';
import { getLocalDateISOString } from '@/utils/date';
import { TaskPriority, PRIORITY_CONFIG, COLOR_BG_MAP } from '@/constants/resources';
import { ChevronRight, List as ListIcon, Calendar, ArrowRight } from 'lucide-vue-next';

const route = useRoute();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const { openTask } = useTaskModal();

const headerContainer = ref<HTMLElement | null>(null);
const leftContainer = ref<HTMLElement | null>(null);
const rightContainer = ref<HTMLElement | null>(null);

// 项目展开状态
const expandedProjects = ref<Set<string>>(new Set());

function toggleProjectExpand(projectId: string) {
    if (expandedProjects.value.has(projectId)) {
        expandedProjects.value.delete(projectId);
    } else {
        expandedProjects.value.add(projectId);
    }
    // 触发响应式更新
    expandedProjects.value = new Set(expandedProjects.value);
}

function isProjectExpanded(projectId: string) {
    return expandedProjects.value.has(projectId);
}

function onRightScroll() {
    if (rightContainer.value) {
        const { scrollTop, scrollLeft } = rightContainer.value;
        if (leftContainer.value) leftContainer.value.scrollTop = scrollTop;
        if (headerContainer.value) headerContainer.value.scrollLeft = scrollLeft;
    }
}

function onLeftWheel(e: WheelEvent) {
    if (rightContainer.value) {
        if (e.shiftKey) {
            // Shift + 滚轮 → 横向滚动
            e.preventDefault();
            rightContainer.value.scrollLeft += e.deltaY;
        } else {
            rightContainer.value.scrollTop += e.deltaY;
        }
    }
}

function onRightWheel(e: WheelEvent) {
    if (e.shiftKey && rightContainer.value) {
        // Shift + 滚轮 → 横向滚动
        e.preventDefault();
        rightContainer.value.scrollLeft += e.deltaY;
    }
}

function toggleExpand(taskId: string) {
    taskStore.toggleSubtaskExpansion(taskId);
}

function isExpanded(taskId: string) {
    return taskStore.isSubtaskExpanded(taskId);
}

function hasSubtasks(taskId: string) {
    return taskStore.tasks.some(t => t.parentId === taskId && t.startDate);
}

// 时间轴配置
const cellWidth = 40;
const PADDING_DAYS = 5; // 前后延长天数

// 动态计算时间轴范围：基于所有有日期任务的最早/最晚日期
const timelineRange = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const projectId = route.params.id as string;
    const allTasks = projectId
        ? taskStore.tasks.filter(t => t.projectId === projectId && !t.isTrashed)
        : taskStore.tasks.filter(t => !t.isTrashed);

    let earliest: Date | null = null;
    let latest: Date | null = null;

    for (const task of allTasks) {
        if (task.startDate) {
            const parts = task.startDate.split('T')[0].split('-');
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            if (!earliest || d < earliest) earliest = d;
            if (!latest || d > latest) latest = d;
        }
        if (task.dueDate) {
            const parts = task.dueDate.split('T')[0].split('-');
            const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            if (!earliest || d < earliest) earliest = d;
            if (!latest || d > latest) latest = d;
        }
    }

    // 无任务时回退到今天 ± 15 天
    if (!earliest || !latest) {
        const start = new Date(today);
        start.setDate(start.getDate() - PADDING_DAYS);
        return { start, totalDays: PADDING_DAYS * 2 + 30 };
    }

    // 确保范围始终包含今天：取最早日期与今天的最小值，最晚日期与今天的最大值
    const rangeStart = earliest < today ? earliest : today;
    const rangeEnd = latest > today ? latest : today;

    // 前后各延 5 天
    const start = new Date(rangeStart);
    start.setDate(start.getDate() - PADDING_DAYS);

    const end = new Date(rangeEnd);
    end.setDate(end.getDate() + PADDING_DAYS);

    const diffMs = end.getTime() - start.getTime();
    const totalDays = Math.max(30, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);

    return { start, totalDays };
});

const days = computed(() => {
    const { start, totalDays } = timelineRange.value;
    const arr = [];
    const d = new Date(start);
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

const totalWidth = computed(() => timelineRange.value.totalDays * cellWidth);

// 显示行数据结构
interface DisplayRow {
    key: string;
    type: 'project-header' | 'task';
    projectId?: string;
    label?: string;
    count?: number;
    task?: Task;
    level?: number;
}

// 按项目分组的显示行
const displayRows = computed<DisplayRow[]>(() => {
    const projectId = route.params.id as string;
    const allTasks = projectId 
        ? taskStore.tasks.filter(t => t.projectId === projectId && !t.isTrashed) 
        : taskStore.tasks.filter(t => !t.isTrashed);

    // 初始化时展开所有项目
    if (expandedProjects.value.size === 0 && !projectId) {
        projectStore.projects.forEach(p => expandedProjects.value.add(p.id));
    }

    const rows: DisplayRow[] = [];
    
    // 如果是单项目下（从项目视图进入），不做项目分组
    if (projectId) {
        const topLevel = allTasks.filter(t => !t.parentId && t.startDate);
        topLevel.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        buildTaskRows(rows, topLevel, allTasks, 0);
        return rows;
    }

    // 按项目分组
    const projects = projectStore.projects;
    for (const project of projects) {
        const projectTasks = allTasks.filter(t => t.projectId === project.id);
        const topWithDate = projectTasks.filter(t => !t.parentId && t.startDate);
        
        if (topWithDate.length === 0) continue; // 此项目无有日期的一级任务
        
        rows.push({
            key: `project-${project.id}`,
            type: 'project-header',
            projectId: project.id,
            label: project.name,
            count: topWithDate.length,
        });

        if (isProjectExpanded(project.id)) {
            topWithDate.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            buildTaskRows(rows, topWithDate, projectTasks, 0);
        }
    }

    // 无项目的任务
    const noProjectTasks = allTasks.filter(t => !t.projectId && !t.parentId && t.startDate);
    if (noProjectTasks.length > 0) {
        rows.push({
            key: 'project-none',
            type: 'project-header',
            projectId: '__none__',
            label: 'No Project',
            count: noProjectTasks.length,
        });
        if (isProjectExpanded('__none__')) {
            noProjectTasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            buildTaskRows(rows, noProjectTasks, allTasks, 0);
        }
    }

    return rows;
});

function buildTaskRows(rows: DisplayRow[], tasks: Task[], allTasks: Task[], level: number) {
    for (const task of tasks) {
        rows.push({
            key: `task-${task.id}`,
            type: 'task',
            task,
            level,
        });
        if (isExpanded(task.id)) {
            const subtasks = allTasks.filter(t => t.parentId === task.id && t.startDate);
            if (subtasks.length > 0) {
                subtasks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                buildTaskRows(rows, subtasks, allTasks, level + 1);
            }
        }
    }
}

// 底部未规划任务：按项目分组
interface UnassignedGroup {
    projectId: string;
    projectName: string;
    tasks: Task[];
}

const unassignedGroups = computed<UnassignedGroup[]>(() => {
    const projectId = route.params.id as string;
    const allTasks = projectId 
        ? taskStore.tasks.filter(t => t.projectId === projectId) 
        : taskStore.tasks;
    
    const unplanned = allTasks.filter(t => !t.startDate && !t.isTrashed);
    
    const groups: Map<string, UnassignedGroup> = new Map();
    for (const task of unplanned) {
        const pid = task.projectId || '__none__';
        if (!groups.has(pid)) {
            const project = projectStore.projects.find(p => p.id === pid);
            groups.set(pid, {
                projectId: pid,
                projectName: project?.name || 'No Project',
                tasks: [],
            });
        }
        groups.get(pid)!.tasks.push(task);
    }
    return Array.from(groups.values());
});

const totalUnassignedCount = computed(() => 
    unassignedGroups.value.reduce((sum, g) => sum + g.tasks.length, 0)
);

function getTaskLevel(task: Task): number {
    let level = 0;
    let current = task;
    while (current.parentId) {
        level++;
        const parent = taskStore.tasks.find(t => t.id === current.parentId);
        if (!parent) break;
        current = parent;
    }
    return level;
}



function getProjectColorClass(projectId: string) {
    const project = projectStore.projects.find(p => p.id === projectId);
    if (!project) return 'bg-gray-400';
    return COLOR_BG_MAP[project.color] || 'bg-gray-400';
}

function getPriorityColor(priority?: string) {
    const config = PRIORITY_CONFIG[priority as TaskPriority];
    return config ? config.hex : '#3B82F6';
}

function getBarColor(priority?: string) {
    const config = PRIORITY_CONFIG[priority as TaskPriority];
    return config ? config.barClass : 'bg-blue-500/80 border border-blue-600';
}

function getTaskPosition(task: Task) {
    if (!task.startDate) return null;
    
    const startParts = task.startDate.split('T')[0].split('-');
    const start = new Date(Number(startParts[0]), Number(startParts[1]) - 1, Number(startParts[2]));
    
    const { start: tlStart, totalDays } = timelineRange.value;
    const timelineStart = new Date(tlStart);
    
    const diffTime = start.getTime() - timelineStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
    
    let duration = 1;
    if (task.dueDate) {
        const dueParts = task.dueDate.split('T')[0].split('-');
        const due = new Date(Number(dueParts[0]), Number(dueParts[1]) - 1, Number(dueParts[2]));
        const durationTime = due.getTime() - start.getTime();
        duration = Math.max(1, Math.ceil(durationTime / (1000 * 60 * 60 * 24)));
    }
    
    if (diffDays + duration < 0 || diffDays >= totalDays) return null;
    
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
.custom-scrollbar-x::-webkit-scrollbar-corner {
  background: transparent;
}
.custom-scrollbar-x::-webkit-scrollbar:vertical {
  width: 6px;
}
</style>
