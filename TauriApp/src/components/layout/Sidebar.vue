<script setup lang="ts">
import { ref, nextTick, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  CheckSquare,
  Columns,
  Calendar, 
  Plus, 
  Tag,
  Settings,
  CalendarDays,
  Trash2,
  Palette,
  ChevronLeft,
  ChevronRight,
  Pencil
} from 'lucide-vue-next';
import { useProjectStore } from '@/stores/project';
import { useLabelStore } from '@/stores/label';
import { useTaskStore } from '@/stores/task';
import { useSettingsStore } from '@/stores/settings';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const labelStore = useLabelStore();
const taskStore = useTaskStore();
const settingsStore = useSettingsStore();

// 获取当前激活的项目视图模式 (默认为 board)
const activeProjectView = computed(() => {
  const path = route.path;
  if (path.includes('/list')) return 'list';
  if (path.includes('/timeline')) return 'timeline';
  if (path.includes('/calendar')) return 'calendar';
  return 'board';
});

// 侧边栏折叠状态
const isCollapsed = ref(false);

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

// 编辑状态
const editingProjectId = ref<string | null>(null);
const editingLabelId = ref<string | null>(null);
const editingName = ref('');
const editInput = ref<HTMLInputElement | null>(null);

// 右键菜单
const contextMenu = ref<{ type: 'project' | 'label', id: string, x: number, y: number } | null>(null);

// 新增项目/标签
const isAddingProject = ref(false);
const isAddingLabel = ref(false);
const newItemName = ref('');
const newItemInput = ref<HTMLInputElement | null>(null);

// 颜色选择
const showColorPicker = ref(false);
const colorPickerTarget = ref<{ type: 'project' | 'label', id: string } | null>(null);

const colors = [
  { name: 'blue', bg: 'bg-blue-500', text: 'text-blue-500' },
  { name: 'red', bg: 'bg-red-500', text: 'text-red-500' },
  { name: 'green', bg: 'bg-emerald-500', text: 'text-emerald-500' },
  { name: 'orange', bg: 'bg-orange-500', text: 'text-orange-500' },
  { name: 'purple', bg: 'bg-purple-500', text: 'text-purple-500' },
  { name: 'pink', bg: 'bg-pink-500', text: 'text-pink-500' },
  { name: 'yellow', bg: 'bg-amber-500', text: 'text-amber-500' },
  { name: 'gray', bg: 'bg-gray-400', text: 'text-gray-400' },
];

const navItems = [
  { name: 'progressing', label: 'Progressing', icon: Columns, path: '/smart/progressing', iconColor: 'text-blue-500' },
  { name: 'today', label: 'Today', icon: CalendarDays, path: '/smart/today', iconColor: 'text-emerald-500' },
  { name: 'upcoming', label: 'Upcoming', icon: Calendar, path: '/smart/upcoming', iconColor: 'text-indigo-500' },
  { name: 'completed', label: 'Completed', icon: CheckSquare, path: '/smart/completed', iconColor: 'text-green-500' },
  { name: 'trash', label: 'Trash', icon: Trash2, path: '/smart/trash', iconColor: 'text-gray-500' },
];

// 实时计算导航项的任务数量（不包含子任务）
const navCounts = computed(() => ({
  progressing: taskStore.progressingTasks.length,
  today: taskStore.todayTasks.length,
  upcoming: taskStore.upcomingTasks.length,
  completed: taskStore.completedTasks.length,
  trash: taskStore.trashedTasks.length,
}));

function getNavCount(name: string): number {
  return navCounts.value[name as keyof typeof navCounts.value] || 0;
}

function isActive(path: string) {
  return route.path === path;
}

function isProjectActive(id: string) {
  return route.path.startsWith(`/project/${id}`);
}

function isLabelActive(id: string) {
  return route.path === `/label/${id}`;
}

function getColorClass(color: string, type: 'bg' | 'text' = 'bg') {
  const colorMap: Record<string, { bg: string, text: string }> = {
    'blue': { bg: 'bg-blue-500', text: 'text-blue-500' },
    'red': { bg: 'bg-red-500', text: 'text-red-500' },
    'green': { bg: 'bg-emerald-500', text: 'text-emerald-500' },
    'orange': { bg: 'bg-orange-500', text: 'text-orange-500' },
    'purple': { bg: 'bg-purple-500', text: 'text-purple-500' },
    'pink': { bg: 'bg-pink-500', text: 'text-pink-500' },
    'yellow': { bg: 'bg-amber-500', text: 'text-amber-500' },
    'gray': { bg: 'bg-gray-400', text: 'text-gray-400' },
    'cyan': { bg: 'bg-cyan-500', text: 'text-cyan-500' },
    'indigo': { bg: 'bg-indigo-500', text: 'text-indigo-500' },
  };
  return colorMap[color]?.[type] || (type === 'bg' ? 'bg-gray-400' : 'text-gray-400');
}

// 双击编辑项目 - 选中所有文本
function startEditProject(project: { id: string, name: string }) {
  if (isCollapsed.value) return; // 折叠时不允许编辑
  editingProjectId.value = project.id;
  editingName.value = project.name;
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus();
      editInput.value.select();
    }
  });
}

function saveProjectName() {
  if (editingProjectId.value && editingName.value.trim()) {
    projectStore.updateProject(editingProjectId.value, { name: editingName.value.trim() });
  }
  editingProjectId.value = null;
}

// 双击编辑标签 - 选中所有文本
function startEditLabel(label: { id: string, name: string }) {
  if (isCollapsed.value) return;
  editingLabelId.value = label.id;
  editingName.value = label.name;
  nextTick(() => {
    if (editInput.value) {
      editInput.value.focus();
      editInput.value.select();
    }
  });
}

function saveLabelName() {
  if (editingLabelId.value && editingName.value.trim()) {
    labelStore.updateLabel(editingLabelId.value, { name: editingName.value.trim() });
  }
  editingLabelId.value = null;
}

// 右键菜单
function showContextMenu(event: MouseEvent, type: 'project' | 'label', id: string) {
  event.preventDefault();
  contextMenu.value = { type, id, x: event.clientX, y: event.clientY };
}

function closeContextMenu() {
  contextMenu.value = null;
  showColorPicker.value = false;
}

function handleContextAction(action: 'rename' | 'color' | 'delete') {
  if (!contextMenu.value) return;
  
  const { type, id } = contextMenu.value;
  
  if (action === 'rename') {
    if (type === 'project') {
      const project = projectStore.projects.find(p => p.id === id);
      if (project) startEditProject(project);
    } else {
      const label = labelStore.labels.find(l => l.id === id);
      if (label) startEditLabel(label);
    }
  } else if (action === 'color') {
    colorPickerTarget.value = { type, id };
    showColorPicker.value = true;
  } else if (action === 'delete') {
    if (type === 'project') {
      projectStore.deleteProject(id);
    } else {
      labelStore.deleteLabel(id);
    }
  }
  
  contextMenu.value = null;
}

function selectColor(color: string) {
  if (!colorPickerTarget.value) return;
  
  const { type, id } = colorPickerTarget.value;
  if (type === 'project') {
    projectStore.updateProject(id, { color });
  } else {
    labelStore.updateLabel(id, { color });
  }
  
  showColorPicker.value = false;
  colorPickerTarget.value = null;
}

// 新增项目 - 选中所有文本
function startAddProject() {
  if (isCollapsed.value) {
    isCollapsed.value = false;
    nextTick(() => startAddProject());
    return;
  }
  isAddingProject.value = true;
  newItemName.value = 'New Project';
  nextTick(() => {
    if (newItemInput.value) {
      newItemInput.value.focus();
      newItemInput.value.select();
    }
  });
}

function confirmAddProject() {
  if (newItemName.value.trim()) {
    projectStore.addProject(newItemName.value.trim());
  }
  isAddingProject.value = false;
  newItemName.value = '';
}

function cancelAddProject() {
  isAddingProject.value = false;
  newItemName.value = '';
}

// 新增标签 - 选中所有文本
function startAddLabel() {
  if (isCollapsed.value) {
    isCollapsed.value = false;
    nextTick(() => startAddLabel());
    return;
  }
  isAddingLabel.value = true;
  newItemName.value = 'New Label';
  nextTick(() => {
    if (newItemInput.value) {
      newItemInput.value.focus();
      newItemInput.value.select();
    }
  });
}

function confirmAddLabel() {
  if (newItemName.value.trim()) {
    labelStore.addLabel(newItemName.value.trim());
  }
  isAddingLabel.value = false;
  newItemName.value = '';
}

function cancelAddLabel() {
  isAddingLabel.value = false;
  newItemName.value = '';
}

// 点击其他区域关闭菜单
function handleGlobalClick() {
  closeContextMenu();
}

// 侧边栏宽度类
const sidebarWidth = computed(() => isCollapsed.value ? 'w-16' : 'w-60');
</script>

<template>
  <aside 
    :class="[sidebarWidth, 'h-full bg-white dark:bg-zinc-950 border-r border-gray-100 dark:border-zinc-800 flex flex-col transition-all duration-300 ease-in-out']"
    @click="handleGlobalClick"
  >
    <!-- Logo Area -->
    <div class="h-14 flex items-center px-4 cursor-pointer shrink-0" @click="router.push('/')">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
          <CheckSquare class="w-4 h-4 text-white" />
        </div>
        <span v-if="!isCollapsed" class="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">TaskFlow</span>
      </div>
    </div>

    <!-- Main Navigation -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-6">
      <!-- Standard Views -->
      <div class="space-y-0.5">
        <template v-for="item in navItems" :key="item.name">
          <router-link 
            :to="item.path" 
            class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="isActive(item.path) 
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'"
            :title="isCollapsed ? t('sidebar.' + item.name) : undefined"
          >
            <component :is="item.icon" class="w-5 h-5 shrink-0" :class="isActive(item.path) ? 'text-blue-600 dark:text-blue-400' : item.iconColor" />
            <span v-if="!isCollapsed" class="truncate">{{ t('sidebar.' + item.name) }}</span>
            <span v-if="!isCollapsed && getNavCount(item.name) > 0" class="ml-auto text-xs text-gray-400">{{ getNavCount(item.name) }}</span>
          </router-link>
        </template>
      </div>

      <!-- Projects -->
      <div v-if="!isCollapsed">
        <div class="flex items-center justify-between px-3 mb-2">
          <h3 class="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{{ t('sidebar.projects') }}</h3>
          <button 
            @click.stop="startAddProject"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -mr-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>
        <div class="space-y-0.5">
          <!-- 新增项目输入框 -->
          <div v-if="isAddingProject" class="flex items-center gap-3 px-3 h-9">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
            <input 
              ref="newItemInput"
              v-model="newItemName"
              @keydown.enter="confirmAddProject"
              @keydown.escape="cancelAddProject"
              @blur="confirmAddProject"
              class="flex-1 min-w-0 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded px-2 h-7 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <template v-for="project in projectStore.projects" :key="project.id">
            <!-- 编辑模式 -->
            <div 
              v-if="editingProjectId === project.id"
              class="flex items-center gap-3 px-3 h-9"
            >
              <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="getColorClass(project.color, 'bg')"></span>
              <input 
                ref="editInput"
                v-model="editingName"
                @keydown.enter="saveProjectName"
                @keydown.escape="editingProjectId = null"
                @blur="saveProjectName"
                class="flex-1 min-w-0 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded px-2 h-7 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <!-- 正常显示 -->
            <router-link 
              v-else
              :to="`/project/${project.id}/${activeProjectView}`"
              @dblclick="startEditProject(project)"
              @contextmenu="showContextMenu($event, 'project', project.id)"
              class="flex items-center gap-3 px-3 h-9 text-sm font-medium rounded-lg transition-all group"
              :class="isProjectActive(project.id) 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'"
            >
              <span class="w-2.5 h-2.5 rounded-full shrink-0 transition-transform group-hover:scale-110" :class="getColorClass(project.color, 'bg')"></span>
              <span class="truncate">{{ project.name }}</span>
            </router-link>
          </template>
        </div>
      </div>

      <!-- Collapsed Projects -->
      <div v-else class="space-y-1">
        <template v-for="project in projectStore.projects" :key="project.id">
          <router-link 
            :to="`/project/${project.id}/${activeProjectView}`"
            class="flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-all"
            :class="isProjectActive(project.id) 
              ? 'bg-blue-50 dark:bg-blue-900/20' 
              : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'"
            :title="project.name"
          >
            <span class="w-3 h-3 rounded-full" :class="getColorClass(project.color, 'bg')"></span>
          </router-link>
        </template>
      </div>

      <!-- Labels -->
      <div v-if="!isCollapsed">
        <div class="flex items-center justify-between px-3 mb-2">
          <h3 class="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{{ t('sidebar.labels') }}</h3>
          <button 
            @click.stop="startAddLabel"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -mr-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>
        <div class="space-y-0.5">
          <!-- 新增标签输入框 -->
          <div v-if="isAddingLabel" class="flex items-center gap-3 px-3 h-9">
            <Tag class="w-4 h-4 text-gray-400 shrink-0" />
            <input 
              ref="newItemInput"
              v-model="newItemName"
              @keydown.enter="confirmAddLabel"
              @keydown.escape="cancelAddLabel"
              @blur="confirmAddLabel"
              class="flex-1 min-w-0 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded px-2 h-7 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <template v-for="label in labelStore.labels" :key="label.id">
            <!-- 编辑模式 -->
            <div 
              v-if="editingLabelId === label.id"
              class="flex items-center gap-3 px-3 h-9"
            >
              <Tag class="w-4 h-4 shrink-0" :class="getColorClass(label.color, 'text')" />
              <input 
                ref="editInput"
                v-model="editingName"
                @keydown.enter="saveLabelName"
                @keydown.escape="editingLabelId = null"
                @blur="saveLabelName"
                class="flex-1 min-w-0 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded px-2 h-7 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <!-- 正常显示 -->
            <router-link 
              v-else
              :to="`/label/${label.id}`"
              @dblclick="startEditLabel(label)"
              @contextmenu="showContextMenu($event, 'label', label.id)"
              class="flex items-center gap-3 px-3 h-9 text-sm font-medium rounded-lg transition-all group"
              :class="isLabelActive(label.id) 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'"
            >
              <Tag class="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" :class="getColorClass(label.color, 'text')" />
              <span class="truncate">{{ label.name }}</span>
            </router-link>
          </template>
        </div>
      </div>

      <!-- Collapsed Labels -->
      <div v-else class="space-y-1">
        <template v-for="label in labelStore.labels" :key="label.id">
          <router-link 
            :to="`/label/${label.id}`"
            class="flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-all"
            :class="isLabelActive(label.id) 
              ? 'bg-blue-50 dark:bg-blue-900/20' 
              : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'"
            :title="label.name"
          >
            <Tag class="w-4 h-4" :class="getColorClass(label.color, 'text')" />
          </router-link>
        </template>
      </div>
    </nav>

    <!-- Bottom Actions -->
    <!-- Bottom Actions -->
    <div class="border-t border-gray-100 dark:border-zinc-800 shrink-0">
      <!-- 展开状态：水平布局 -->
      <div v-if="!isCollapsed" class="flex items-center h-12 px-2">
        <!-- 展开/收起按钮（左侧） -->
        <button 
          @click="toggleCollapse"
          class="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          :title="t('common.toggle_sidebar')"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>
        <!-- 分割线 -->
        <div class="w-px h-5 bg-gray-200 dark:bg-zinc-700 mx-2"></div>
        


        <!-- 设置按钮（右侧） -->
        <button 
          @click="settingsStore.openSettings()"
          class="flex items-center gap-2 flex-1 px-2 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          :title="t('common.preferences')"
        >
          <Settings class="w-4 h-4 shrink-0" />
          <span>{{ t('common.preferences') }}</span>
        </button>
      </div>
      <!-- 收起状态：显示展开按钮 -->
      <div v-else class="flex flex-col items-center justify-center py-2 gap-2">
        <button 
          @click="toggleCollapse"
          class="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          :title="t('common.toggle_sidebar')"
        >
          <ChevronRight class="w-5 h-5" />
        </button>


      </div>
    </div>
  </aside>

  <!-- Context Menu -->
  <Teleport to="body">
    <div 
      v-if="contextMenu"
      class="fixed z-50 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 py-1.5 min-w-[160px]"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop
    >
      <button 
        @click="handleContextAction('rename')"
        class="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
      >
        <Pencil class="w-4 h-4" />
        {{ t('common.rename') }}
      </button>
      <button 
        @click="handleContextAction('color')"
        class="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2 transition-colors"
      >
        <Palette class="w-4 h-4" /> {{ t('common.change_color') }}
      </button>
      <div class="h-px bg-gray-100 dark:bg-zinc-700 my-1"></div>
      <button 
        @click="handleContextAction('delete')"
        class="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
      >
        <Trash2 class="w-4 h-4" /> {{ t('common.delete') }}
      </button>
    </div>
  </Teleport>

  <!-- Color Picker Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showColorPicker" class="fixed inset-0 z-50 flex items-center justify-center bg-black/20" @click="showColorPicker = false">
        <div class="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-5 border border-gray-200 dark:border-zinc-700" @click.stop>
          <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{{ t('common.choose_color') }}</h3>
          <div class="grid grid-cols-4 gap-3">
            <button 
              v-for="color in colors" 
              :key="color.name"
              @click="selectColor(color.name)"
              class="w-9 h-9 rounded-full transition-all hover:scale-110 hover:shadow-lg"
              :class="color.bg"
            ></button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
