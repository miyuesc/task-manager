<template>
  <div class="flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 transition-colors duration-200 shrink-0">
    <!-- Left: Project Title & Description -->
    <div class="flex flex-col gap-0.5">
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-50">{{ projectTitle }}</h1>
      <p v-if="projectDescription" class="text-sm text-gray-500 dark:text-gray-400">{{ projectDescription }}</p>
    </div>

    <!-- Right: View Switcher + New Task Button -->
    <div class="flex items-center gap-3">
      <!-- View Switcher - 分段控制器 -->
      <div v-if="showViewSwitcher" class="flex h-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-zinc-800 p-1">
        <button 
          v-for="view in currentViews" 
          :key="view.name"
          @click="switchView(view.name)"
          class="flex cursor-pointer h-full items-center justify-center rounded px-3 transition-all text-xs font-medium leading-normal gap-2"
          :class="activeView === view.name 
            ? 'bg-white dark:bg-zinc-700 shadow-sm text-slate-900 dark:text-gray-50' 
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-zinc-700/50'"
        >
          <component :is="view.icon" class="w-[16px] h-[16px]" />
          <span class="hidden md:inline">{{ view.label }}</span>
        </button>
      </div>

      <!-- New Task Button -->
      <button 
        v-if="!smartViewId || !['completed', 'trash'].includes(smartViewId)"
        @click="handleNewTask"
        class="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
      >
        <Plus class="w-[18px] h-[18px]" />
        <span>{{ t('task.new_task') }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Plus, LayoutGrid, List, GanttChartSquare, Calendar } from 'lucide-vue-next';
import { useProjectStore } from '@/stores/project';
import { useColumnStore } from '@/stores/column';
import { useTaskModal } from '@/composables/useTaskModal';
import { useI18n } from 'vue-i18n';
import { getLocalDateISOString } from '@/utils/date';

const { t } = useI18n();

type ViewType = 'board' | 'list' | 'timeline' | 'calendar';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const columnStore = useColumnStore();
const { openNewTask } = useTaskModal();

const isProjectView = computed(() => route.path.includes('/project/'));
const isOverviewView = computed(() => route.path.startsWith('/overview'));
const smartViewId = computed(() => route.path.includes('/smart/') ? route.params.id as string : null);

// 是否显示视图切换器
const showViewSwitcher = computed(() => isProjectView.value || isOverviewView.value);

const currentProject = computed(() => {
  const projectId = route.params.id as string;
  return projectStore.projects.find(p => p.id === projectId);
});

const projectTitle = computed(() => {
  if (currentProject.value) {
    return currentProject.value.name;
  }
  if (isOverviewView.value) {
    return t('sidebar.overview');
  }
  if (smartViewId.value) {
    switch (smartViewId.value) {
      case 'progressing': return t('sidebar.progressing');
      case 'today': return t('sidebar.today');
      case 'upcoming': return t('sidebar.upcoming');
      case 'completed': return t('sidebar.completed');
      case 'trash': return t('sidebar.trash');
      default: return smartViewId.value.charAt(0).toUpperCase() + smartViewId.value.slice(1);
    }
  }
  return t('sidebar.dashboard');
});

const projectDescription = computed(() => {
  if (smartViewId.value) {
    switch (smartViewId.value) {
      case 'progressing': return t('view.in_progress_desc');
      case 'today': return t('view.today_desc');
      case 'upcoming': return t('view.upcoming_desc');
      case 'completed': return t('view.completed_desc');
      case 'trash': return t('view.trash_desc');
      default: return '';
    }
  }
  return '';
});

const activeView = computed<ViewType>(() => {
  if (isOverviewView.value) {
    const view = route.params.view as string;
    if (['board', 'list', 'timeline', 'calendar'].includes(view)) return view as ViewType;
    return 'board';
  }
  if (route.path.includes('/board')) return 'board';
  if (route.path.includes('/list')) return 'list';
  if (route.path.includes('/timeline')) return 'timeline';
  if (route.path.includes('/calendar')) return 'calendar';
  return 'board';
});

// 项目视图只显示 board + list；总览视图显示全部 4 种
const allViews = computed(() => [
  { name: 'board' as ViewType, label: t('view.board'), icon: LayoutGrid },
  { name: 'list' as ViewType, label: t('view.list'), icon: List },
  { name: 'timeline' as ViewType, label: t('view.timeline'), icon: GanttChartSquare },
  { name: 'calendar' as ViewType, label: t('view.calendar'), icon: Calendar }, 
]);

const currentViews = computed(() => {
  if (isOverviewView.value) return allViews.value;
  // 项目视图仅看板 + 列表
  return allViews.value.slice(0, 2);
});

function switchView(viewName: ViewType) {
  if (isOverviewView.value) {
    router.push(`/overview/${viewName}`);
  } else if (isProjectView.value) {
    router.push(`/project/${route.params.id}/${viewName}`);
  }
}

// 处理新建任务按钮点击
function handleNewTask() {
  const defaults: any = {};

  if (isProjectView.value && currentProject.value) {
    defaults.projectId = currentProject.value.id;
    defaults.columnId = columnStore.columns[0]?.id || 'todo';
  } else if (smartViewId.value) {
    switch (smartViewId.value) {
      case 'today':
        defaults.startDate = getLocalDateISOString();
        break;
      case 'upcoming': {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        defaults.startDate = getLocalDateISOString(tomorrow);
        break;
      }
      case 'progressing': {
        const firstProgressingCol = columnStore.progressingColumnIds[0];
        if (firstProgressingCol) {
          defaults.columnId = firstProgressingCol;
        }
        break;
      }
    }
  } else if (route.path.includes('/label/')) {
    const labelId = route.params.id as string;
    if (labelId) {
      defaults.labels = [labelId];
    }
  }

  openNewTask(defaults);
}
</script>

<style scoped>
/* 不再需要模态框动画样式 */
</style>
