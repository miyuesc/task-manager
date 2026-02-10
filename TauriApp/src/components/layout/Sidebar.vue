<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Sortable from 'sortablejs';
import { 
  CheckSquare, Calendar, Clock, 
  Settings, Plus, Tag, ChevronLeft, ChevronRight,
  Pencil, Palette, Trash2,
  Inbox, CheckCircle
} from 'lucide-vue-next';
import { useProjectStore } from '@/stores/project';
import { useLabelStore } from '@/stores/label';
import { useSettingsStore } from '@/stores/settings';
import { useConfirm } from '@/composables/useConfirm';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const projectStore = useProjectStore();
const labelStore = useLabelStore();
const settingsStore = useSettingsStore();
const { confirm, alert } = useConfirm();

const isCollapsed = ref(false);
const projectsListRef = ref<HTMLElement | null>(null);
const labelsListRef = ref<HTMLElement | null>(null);

// Navigation
const navItems = [
  { name: 'progressing', path: '/smart/progressing', icon: Inbox, iconColor: 'text-blue-500' },
  { name: 'today', path: '/smart/today', icon: Calendar, iconColor: 'text-green-500' },
  { name: 'upcoming', path: '/smart/upcoming', icon: Clock, iconColor: 'text-purple-500' },
  { name: 'completed', path: '/smart/completed', icon: CheckCircle, iconColor: 'text-gray-500' },
  { name: 'trash', path: '/smart/trash', icon: Trash2, iconColor: 'text-red-500' },
];

const visibleNavItems = computed(() => {
  if (isCollapsed.value) {
    return navItems.filter(item => ['progressing', 'today', 'upcoming'].includes(item.name));
  }
  return navItems;
});

function isActive(path: string) {
  return route.path === path;
}

function getNavCount(_name: string) {
  // TODO: Implement real counts from taskStore
  return 0;
}

// Project Logic
const isAddingProject = ref(false);
const newItemName = ref('');
const newItemInput = ref<HTMLInputElement | null>(null);
const editingProjectId = ref<string | null>(null);
const editingName = ref('');
const editInput = ref<HTMLInputElement | null>(null);

const activeProjectView = computed(() => {
    const parts = route.path.split('/');
    if (parts.includes('project') && parts.length >= 4) {
        return parts[3]; 
    }
    return 'board'; 
});

function isProjectActive(id: string) {
    return route.path.includes(`/project/${id}`);
}

function startAddProject() {
    isAddingProject.value = true;
    newItemName.value = '';
    nextTick(() => newItemInput.value?.focus());
}

function cancelAddProject() {
    isAddingProject.value = false;
    newItemName.value = '';
}

async function confirmAddProject() {
    const name = newItemName.value.trim();
    if (!name) {
        cancelAddProject();
        return;
    }
    
    if (projectStore.projects.some(p => p.name === name)) {
        await alert(t('common.name_exists'), undefined, 'warning');
        return;
    }

    // Default color blue
    projectStore.addProject(name, 'blue');
    cancelAddProject();
}

function startEditProject(project: any) {
    editingProjectId.value = project.id;
    editingName.value = project.name;
    nextTick(() => editInput.value?.focus());
}

function saveProjectName() {
    if (editingProjectId.value && editingName.value.trim()) {
        projectStore.updateProject(editingProjectId.value, { name: editingName.value.trim() });
    }
    editingProjectId.value = null;
}

// Label Logic
const isAddingLabel = ref(false);
const editingLabelId = ref<string | null>(null);

function isLabelActive(id: string) {
    return route.path.includes(`/label/${id}`);
}

function startAddLabel() {
    isAddingLabel.value = true;
    newItemName.value = '';
    nextTick(() => newItemInput.value?.focus());
}

function cancelAddLabel() {
    isAddingLabel.value = false;
    newItemName.value = '';
}

// 确认添加标签
async function confirmAddLabel() {
  const name = newItemName.value.trim();
  if (!name) {
    cancelAddLabel();
    return;
  }

  if (labelStore.labels.some(l => l.name === name)) {
    await alert(t('common.name_exists'), undefined, 'warning');
    return;
  }

  labelStore.addLabel(name, 'gray');
  cancelAddLabel();
}

function startEditLabel(label: any) {
    editingLabelId.value = label.id;
    editingName.value = label.name;
    nextTick(() => editInput.value?.focus());
}

function saveLabelName() {
    if (editingLabelId.value && editingName.value.trim()) {
        labelStore.updateLabel(editingLabelId.value, { name: editingName.value.trim() });
    }
    editingLabelId.value = null;
}

// Context Menu
const contextMenu = ref<{x: number, y: number, type: 'project'|'label', id: string} | null>(null);

function showContextMenu(e: MouseEvent, type: 'project'|'label', id: string) {
    e.preventDefault();
    contextMenu.value = {
        x: e.clientX,
        y: e.clientY,
        type,
        id
    };
}

function handleGlobalClick() {
    contextMenu.value = null;
    showColorPicker.value = false;
}

async function handleContextAction(action: string) {
    if (!contextMenu.value) return;
    const { type, id } = contextMenu.value;

    if (action === 'rename') {
        if (type === 'project') {
             const proj = projectStore.projects.find(p => p.id === id);
             if (proj) startEditProject(proj);
        } else {
             const lbl = labelStore.labels.find(l => l.id === id);
             if (lbl) startEditLabel(lbl);
        }
    } else if (action === 'color') {
        colorPickerTarget.value = { type, id };
        showColorPicker.value = true;
    } else if (action === 'delete') {
        const msg = type === 'project' ? t('common.confirm_delete_project') : t('common.confirm_delete_label');
        if (await confirm(msg, undefined, 'error')) {
            if (type === 'project') projectStore.deleteProject(id);
            else labelStore.deleteLabel(id);
            if (route.path.includes(id)) router.push('/');
        }
    }
    contextMenu.value = null;
}

// Color Picker
const showColorPicker = ref(false);
const colorPickerTarget = ref<{type: 'project'|'label', id: string} | null>(null);
const colors = [
    { name: 'red', bg: 'bg-red-500' },
    { name: 'orange', bg: 'bg-orange-500' },
    { name: 'yellow', bg: 'bg-amber-500' },
    { name: 'green', bg: 'bg-green-500' },
    { name: 'blue', bg: 'bg-blue-500' },
    { name: 'purple', bg: 'bg-purple-500' },
    { name: 'pink', bg: 'bg-pink-500' },
    { name: 'gray', bg: 'bg-gray-500' },
];

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

function getColorClass(color: string, type: 'bg' | 'text') {
    const prefix = type === 'bg' ? 'bg' : 'text';
    const shade = '500';
    return `${prefix}-${color}-${shade}`;
}

function toggleCollapse() {
    isCollapsed.value = !isCollapsed.value;
}

// 侧边栏宽度类
const sidebarWidth = computed(() => isCollapsed.value ? 'w-16' : 'w-60');

// 拖拽排序 (SortableJS)
onMounted(() => {
  if (projectsListRef.value) {
    Sortable.create(projectsListRef.value, {
      animation: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      ghostClass: 'bg-gray-100',
      draggable: '[data-id]', // Only drag items with data-id
      handle: '.group', // Allow dragging anywhere on the item
      forceFallback: true, // 强制使用 HTML5 DnD fallback，修复 macOS WebKit 兼容性
      fallbackOnBody: true, // 确保拖拽时元素层级脱离容器，防止被遮挡
      onEnd: () => {
        if (!projectsListRef.value) return;
        const newOrderIds = Array.from(projectsListRef.value.children)
          .map((el) => (el as HTMLElement).getAttribute('data-id'))
          .filter((id): id is string => !!id);
        
        projectStore.reorderProjects(newOrderIds);
      }
    });
  }

  if (labelsListRef.value) {
    Sortable.create(labelsListRef.value, {
      animation: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      ghostClass: 'bg-gray-100',
      draggable: '[data-id]',
      handle: '.group',
      forceFallback: true, // 强制使用 HTML5 DnD fallback，修复 macOS WebKit 兼容性
      fallbackOnBody: true, // 确保拖拽时元素层级脱离容器，防止被遮挡
      onEnd: () => {
        if (!labelsListRef.value) return;
        const newOrderIds = Array.from(labelsListRef.value.children)
          .map((el) => (el as HTMLElement).getAttribute('data-id'))
          .filter((id): id is string => !!id);
        
        labelStore.reorderLabels(newOrderIds);
      }
    });
  }
});
</script>

<template>
  <aside 
    :class="[sidebarWidth, 'h-full bg-white dark:bg-zinc-950 border-r border-gray-100 dark:border-zinc-800 flex flex-col transition-all duration-300 ease-in-out relative group/sidebar']"
    @click="handleGlobalClick"
  >
    <!-- Divider Line Control (Toggle Button) -->
    <div 
      class="absolute -right-3 top-1/2 -translate-y-1/2 z-50 opacity-0 group-hover/sidebar:opacity-100 transition-opacity delay-100"
      @click.stop="toggleCollapse"
    >
      <div class="flex items-center justify-center w-6 h-12 cursor-pointer group/toggle">
        <!-- Vertical Line Part -->
        <div class="absolute h-full w-0.5 bg-transparent group-hover/toggle:bg-blue-500/50 transition-colors rounded-full"></div>
        
        <!-- Icon Bubble -->
        <div class="relative w-6 h-6 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full flex items-center justify-center shadow-sm text-gray-400 group-hover/toggle:text-blue-500 group-hover/toggle:border-blue-200 dark:group-hover/toggle:border-blue-800 transition-all transform scale-90 group-hover/toggle:scale-100">
             <ChevronRight v-if="isCollapsed" class="w-3.5 h-3.5" />
             <ChevronLeft v-else class="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
    <!-- Logo Area -->
    <div class="h-14 flex items-center px-4 shrink-0" data-tauri-drag-region>
      <div class="flex items-center gap-2.5 cursor-pointer transition-opacity hover:opacity-80" @click="router.push('/')">
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
        <template v-for="item in visibleNavItems" :key="item.name">
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
        <div class="space-y-0.5" ref="projectsListRef">
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
            <div v-else :data-id="project.id">
              <router-link 
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
            </div>
          </template>

          <!-- 新增项目输入框 (Moved to bottom) -->
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
        <div class="space-y-0.5" ref="labelsListRef">
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
            <div v-else :data-id="label.id">
              <router-link 
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
            </div>
          </template>

          <!-- 新增标签输入框 (Moved to bottom) -->
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
    <div class="border-t border-gray-100 dark:border-zinc-800 shrink-0 p-2">
      <!-- 展开状态：显示完整设置按钮 -->
      <div v-if="!isCollapsed">
        <button 
          @click="settingsStore.openSettings()"
          class="flex items-center gap-2 w-full px-2 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          :title="t('common.preferences')"
        >
          <Settings class="w-4 h-4 shrink-0" />
          <span>{{ t('common.preferences') }}</span>
        </button>
      </div>
      <!-- 收起状态：显示图标 -->
      <div v-else class="flex justify-center">
        <button 
          @click="settingsStore.openSettings()"
          class="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          :title="t('common.preferences')"
        >
          <Settings class="w-5 h-5" />
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
