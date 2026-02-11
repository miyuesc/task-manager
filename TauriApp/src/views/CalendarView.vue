<template>
  <div class="flex flex-col h-full bg-white dark:bg-zinc-900 select-none">
    <!-- 工具栏 -->
    <div class="px-6 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-4">
        <div class="flex items-center bg-white dark:bg-zinc-800 rounded-md border border-gray-200 dark:border-zinc-700 p-0.5 shadow-sm">
          <button @click="prevMonth" class="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded text-gray-500 dark:text-gray-400">
            <ChevronLeft class="w-5 h-5" />
          </button>
          <button @click="nextMonth" class="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded text-gray-500 dark:text-gray-400">
             <ChevronRight class="w-5 h-5" />
          </button>
        </div>
        <h2 class="text-lg font-bold text-gray-800 dark:text-gray-200">{{ currentMonthName }} {{ currentYear }}</h2>
        <button @click="goToToday" class="px-3 py-1 text-xs font-semibold bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
            {{ $t('common.today') }}
        </button>
      </div>
    </div>

    <!-- 表头 -->
    <div class="grid grid-cols-7 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <div v-for="(day, i) in localizedWeekDays" :key="i" class="py-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            {{ day }}
        </div>
    </div>

    <!-- 日历网格 -->
    <div class="flex-1 flex flex-col divide-y divide-gray-200 dark:divide-zinc-800 overflow-hidden">
        <div v-for="(week, weekIndex) in calendarWeeks" :key="weekIndex" class="flex-1 flex min-h-[120px] relative">
            <!-- 背景网格 -->
            <div class="absolute inset-0 grid grid-cols-7 divide-x divide-gray-200 dark:divide-zinc-800">
                <div v-for="(date, dayIndex) in week" :key="dayIndex" 
                    @dblclick="handleDblClick(date)"
                    class="h-full group hover:bg-gray-50 dark:hover:bg-zinc-800/30 transition-colors relative"
                    :class="[
                        isSameMonth(date) ? '' : 'bg-gray-50/50 dark:bg-zinc-900/50',
                        isTodayDate(date) ? 'bg-blue-50/20 dark:bg-blue-900/5' : ''
                    ]"
                >
                    <div class="p-2 text-right">
                        <span class="text-sm font-medium" 
                            :class="[
                                isTodayDate(date) ? 'inline-flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded-full' : 
                                isSameMonth(date) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-zinc-600'
                            ]">
                            {{ date.getDate() }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- 任务层 -->
            <div class="absolute inset-0 grid grid-cols-7 pointer-events-none pt-10 px-0.5">
                <div v-for="layout in getWeekTaskLayout(week)" :key="layout.task.id"
                    class="absolute pointer-events-auto cursor-pointer mb-1 px-0.5"
                    :style="{
                        left: `${(layout.start / 7) * 100}%`,
                        width: `${(layout.span / 7) * 100}%`,
                        top: `${layout.row * 24 + 40}px`,
                        zIndex: 10
                    }"
                    @click.stop="openTask(layout.task.id)"
                >
                    <div 
                        class="px-2 py-0.5 rounded text-[11px] font-medium truncate shadow-sm border transition-all"
                        :class="[
                            getTaskColorClass(layout.task),
                            layout.isStart ? 'rounded-l' : 'rounded-l-none border-l-0',
                            layout.isEnd ? 'rounded-r' : 'rounded-r-none border-r-0'
                        ]"
                    >
                        {{ layout.showTitle ? layout.task.title : '&nbsp;' }}
                    </div>
                </div>
            </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import { useTaskStore, Task } from '@/stores/task';
import { useTaskModal } from '@/composables/useTaskModal';
import { getLocalDateISOString } from '@/utils/date';
import { useI18n } from 'vue-i18n';
import { TaskPriority, PRIORITY_CONFIG } from '@/constants/resources';

const { locale } = useI18n();
const route = useRoute();
const taskStore = useTaskStore();
const { openTask, openNewTask } = useTaskModal();

const currentDate = ref(new Date());

// 国际化的星期几
const localizedWeekDays = computed(() => {
    const loc = locale.value === 'zh' ? 'zh-CN' : 'en-US';
    const days = [];
    // 从周一开始
    for (let i = 1; i <= 7; i++) {
        // 2024-01-01 是周一
        const d = new Date(2024, 0, i);
        days.push(d.toLocaleString(loc, { weekday: 'short' }));
    }
    return days;
});

const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth());

// 国际化的月份名
const currentMonthName = computed(() => {
    const loc = locale.value === 'zh' ? 'zh-CN' : 'en-US';
    return currentDate.value.toLocaleString(loc, { month: 'long' });
});

// 计算日历中显示的所有日期，按周分组
const calendarWeeks = computed(() => {
    const year = currentYear.value;
    const month = currentMonth.value;
    
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - diff);
    
    const weeks = [];
    let currentIterDate = new Date(startDate);
    
    for (let w = 0; w < 6; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            week.push(new Date(currentIterDate));
            currentIterDate.setDate(currentIterDate.getDate() + 1);
        }
        weeks.push(week);
    }
    return weeks;
});

function prevMonth() {
    currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
}

function nextMonth() {
    currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
}

function goToToday() {
    currentDate.value = new Date();
}

function isTodayDate(date: Date) {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
}

function isSameMonth(date: Date) {
    return date.getMonth() === currentMonth.value;
}

function handleDblClick(date: Date) {
    const dateStr = getLocalDateISOString(date);
    const projectId = route.params.id as string;
    
    openNewTask({
        startDate: dateStr,
        projectId: projectId || ''
    });
}

// 获取在指定日期范围内的任务
function getTasksForRange(start: Date, end: Date) {
    const projectId = route.params.id as string;
    const startStr = getLocalDateISOString(start);
    const endStr = getLocalDateISOString(end);
    
    return taskStore.tasks.filter(t => {
        if (projectId && t.projectId !== projectId) return false;
        if (t.isTrashed) return false;

        const taskStart = t.startDate || t.dueDate || '';
        const taskEnd = t.dueDate || t.startDate || '';
        
        if (!taskStart) return false;
        
        return taskStart <= endStr && taskEnd >= startStr;
    });
}

// 计算某一周的任务布局
interface TaskLayout {
    task: Task;
    start: number;
    span: number;
    row: number;
    isStart: boolean;
    isEnd: boolean;
    showTitle: boolean;
}

function getWeekTaskLayout(week: Date[]): TaskLayout[] {
    const weekStart = week[0];
    const weekEnd = week[6];
    const weekStartStr = getLocalDateISOString(weekStart);
    const weekEndStr = getLocalDateISOString(weekEnd);
    
    const tasks = getTasksForRange(weekStart, weekEnd);
    
    const sortedTasks = [...tasks].sort((a, b) => {
        const aStart = a.startDate || a.dueDate || '';
        const aEnd = a.dueDate || a.startDate || '';
        const bStart = b.startDate || b.dueDate || '';
        const bEnd = b.dueDate || b.startDate || '';
        
        const aSpan = new Date(aEnd).getTime() - new Date(aStart).getTime();
        const bSpan = new Date(bEnd).getTime() - new Date(bStart).getTime();
        
        if (aSpan !== bSpan) return bSpan - aSpan;
        return aStart.localeCompare(bStart);
    });

    const layouts: TaskLayout[] = [];
    const rows: (string | null)[][] = [];

    sortedTasks.forEach(task => {
        const taskStart = task.startDate || task.dueDate || '';
        const taskEnd = task.dueDate || task.startDate || '';
        
        let startIdx = 0;
        let endIdx = 6;
        
        if (taskStart > weekStartStr) {
            startIdx = week.findIndex(d => getLocalDateISOString(d) === taskStart);
        }
        if (taskEnd < weekEndStr) {
            endIdx = week.findIndex(d => getLocalDateISOString(d) === taskEnd);
        }
        
        if (startIdx === -1) startIdx = 0;
        if (endIdx === -1) endIdx = 6;
        
        const span = endIdx - startIdx + 1;
        
        let rowIndex = 0;
        while (true) {
            if (!rows[rowIndex]) rows[rowIndex] = Array(7).fill(null);
            
            let isAvailable = true;
            for (let i = startIdx; i <= endIdx; i++) {
                if (rows[rowIndex][i]) {
                    isAvailable = false;
                    break;
                }
            }
            
            if (isAvailable) {
                for (let i = startIdx; i <= endIdx; i++) {
                    rows[rowIndex][i] = task.id;
                }
                
                layouts.push({
                    task,
                    start: startIdx,
                    span,
                    row: rowIndex,
                    isStart: taskStart >= weekStartStr,
                    isEnd: taskEnd <= weekEndStr,
                    showTitle: startIdx === 0 || taskStart >= weekStartStr
                });
                break;
            }
            rowIndex++;
        }
    });
    
    return layouts;
}

function getTaskColorClass(task: Task) {
    if (task.completed) {
         return 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-zinc-800 dark:text-gray-500 dark:border-zinc-700 line-through';
    }
    
    const config = PRIORITY_CONFIG[task.priority as TaskPriority];
    return config ? config.calendarClass : 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/50';
}
</script>

<style scoped>
.flex-1 {
    min-height: 0;
}
</style>
