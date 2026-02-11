<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import Sortable from "sortablejs";
import {
  CheckSquare,
  Calendar,
  Clock,
  Settings,
  Plus,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Pencil,
  Palette,
  Trash2,
  Inbox,
  CheckCircle,
  LayoutGrid,
} from "lucide-vue-next";
import { useTaskStore } from "@/stores/task";
import { useProjectStore } from "@/stores/project";
import { useLabelStore } from "@/stores/label";
import { useSettingsStore } from "@/stores/settings";
import { useConfirm } from "@/composables/useConfirm";
import Tooltip from "@/components/ui/Tooltip.vue";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const taskStore = useTaskStore();
const projectStore = useProjectStore();
const labelStore = useLabelStore();
const settingsStore = useSettingsStore();
const { confirm, alert } = useConfirm();

const isCollapsed = computed({
  get: () => settingsStore.sidebarCollapsed,
  set: (v) => (settingsStore.sidebarCollapsed = v),
});
const projectsListRef = ref<HTMLElement | null>(null);
const labelsListRef = ref<HTMLElement | null>(null);

// 收起/展开状态（持久化到 settingsStore）
const isViewsExpanded = computed({
  get: () => settingsStore.sidebarViewsExpanded,
  set: (v) => (settingsStore.sidebarViewsExpanded = v),
});
const isProjectsExpanded = computed({
  get: () => settingsStore.sidebarProjectsExpanded,
  set: (v) => (settingsStore.sidebarProjectsExpanded = v),
});
const isLabelsExpanded = computed({
  get: () => settingsStore.sidebarLabelsExpanded,
  set: (v) => (settingsStore.sidebarLabelsExpanded = v),
});

// Navigation
const navItems = [
  {
    name: "progressing",
    path: "/smart/progressing",
    icon: Inbox,
    iconColor: "text-blue-500",
  },
  {
    name: "today",
    path: "/smart/today",
    icon: Calendar,
    iconColor: "text-green-500",
  },
  {
    name: "upcoming",
    path: "/smart/upcoming",
    icon: Clock,
    iconColor: "text-purple-500",
  },
  {
    name: "completed",
    path: "/smart/completed",
    icon: CheckCircle,
    iconColor: "text-gray-500",
  },
  {
    name: "trash",
    path: "/smart/trash",
    icon: Trash2,
    iconColor: "text-red-500",
  },
];

// 收起时只显示前 3 个视图
const visibleNavItems = computed(() => {
  if (isViewsExpanded.value) return navItems;
  return navItems.slice(0, 3);
});

// 项目列表：超过 3 个时支持收起/展开
const visibleProjects = computed(() => {
  if (isProjectsExpanded.value || projectStore.projects.length <= 3)
    return projectStore.projects;
  return projectStore.projects.slice(0, 3);
});

// 标签列表：超过 3 个时支持收起/展开
const visibleLabels = computed(() => {
  if (isLabelsExpanded.value || labelStore.labels.length <= 3)
    return labelStore.labels;
  return labelStore.labels.slice(0, 3);
});

function isActive(path: string) {
  return route.path === path;
}

function getNavCount(name: string) {
  switch (name) {
    case "progressing":
      return taskStore.progressingTasks.length;
    case "today":
      return taskStore.todayTasks.length;
    case "upcoming":
      return taskStore.upcomingTasks.length;
    case "completed":
      return taskStore.completedTasks.length;
    case "trash":
      return taskStore.trashedTasks.length;
    default:
      return 0;
  }
}

// Project Logic
const isAddingProject = ref(false);
const newItemName = ref("");
const newItemInput = ref<HTMLInputElement | null>(null);
const editingProjectId = ref<string | null>(null);
const editingName = ref("");
const editInput = ref<HTMLInputElement | null>(null);

const activeProjectView = computed(() => {
  const parts = route.path.split("/");
  if (parts.includes("project") && parts.length >= 4) {
    return parts[3];
  }
  return "board";
});

function isProjectActive(id: string) {
  return route.path.includes(`/project/${id}`);
}

function startAddProject() {
  isAddingProject.value = true;
  newItemName.value = "";
  nextTick(() => newItemInput.value?.focus());
}

function cancelAddProject() {
  isAddingProject.value = false;
  newItemName.value = "";
}

async function confirmAddProject() {
  const name = newItemName.value.trim();
  if (!name) {
    cancelAddProject();
    return;
  }

  if (projectStore.projects.some((p) => p.name === name)) {
    await alert(t("common.name_exists"), undefined, "warning");
    return;
  }

  // Default color blue
  projectStore.addProject(name, "blue");
  cancelAddProject();
}

function startEditProject(project: any) {
  editingProjectId.value = project.id;
  editingName.value = project.name;
  nextTick(() => editInput.value?.focus());
}

function saveProjectName() {
  if (editingProjectId.value && editingName.value.trim()) {
    projectStore.updateProject(editingProjectId.value, {
      name: editingName.value.trim(),
    });
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
  newItemName.value = "";
  nextTick(() => newItemInput.value?.focus());
}

function cancelAddLabel() {
  isAddingLabel.value = false;
  newItemName.value = "";
}

// 确认添加标签
async function confirmAddLabel() {
  const name = newItemName.value.trim();
  if (!name) {
    cancelAddLabel();
    return;
  }

  if (labelStore.labels.some((l) => l.name === name)) {
    await alert(t("common.name_exists"), undefined, "warning");
    return;
  }

  labelStore.addLabel(name, "gray");
  cancelAddLabel();
}

function startEditLabel(label: any) {
  editingLabelId.value = label.id;
  editingName.value = label.name;
  nextTick(() => editInput.value?.focus());
}

function saveLabelName() {
  if (editingLabelId.value && editingName.value.trim()) {
    labelStore.updateLabel(editingLabelId.value, {
      name: editingName.value.trim(),
    });
  }
  editingLabelId.value = null;
}

// Context Menu
const contextMenu = ref<{
  x: number;
  y: number;
  type: "project" | "label";
  id: string;
} | null>(null);

function showContextMenu(e: MouseEvent, type: "project" | "label", id: string) {
  e.preventDefault();
  contextMenu.value = {
    x: e.clientX,
    y: e.clientY,
    type,
    id,
  };
}

function handleGlobalClick() {
  contextMenu.value = null;
  showColorPicker.value = false;
}

async function handleContextAction(action: string) {
  if (!contextMenu.value) return;
  const { type, id } = contextMenu.value;

  if (action === "rename") {
    if (type === "project") {
      const proj = projectStore.projects.find((p) => p.id === id);
      if (proj) startEditProject(proj);
    } else {
      const lbl = labelStore.labels.find((l) => l.id === id);
      if (lbl) startEditLabel(lbl);
    }
  } else if (action === "color") {
    colorPickerTarget.value = { type, id };
    showColorPicker.value = true;
  } else if (action === "delete") {
    const msg =
      type === "project"
        ? t("common.confirm_delete_project")
        : t("common.confirm_delete_label");
    if (await confirm(msg, undefined, "error")) {
      if (type === "project") projectStore.deleteProject(id);
      else labelStore.deleteLabel(id);
      if (route.path.includes(id)) router.push("/");
    }
  }
  contextMenu.value = null;
}

import { SYSTEM_COLORS } from "@/constants/resources";

// Color Picker
const showColorPicker = ref(false);
const colorPickerTarget = ref<{ type: "project" | "label"; id: string } | null>(
  null,
);
const colors = SYSTEM_COLORS.map((c) => ({ name: c.id, bg: c.bgClass }));

function selectColor(color: string) {
  if (!colorPickerTarget.value) return;
  const { type, id } = colorPickerTarget.value;
  if (type === "project") {
    projectStore.updateProject(id, { color });
  } else {
    labelStore.updateLabel(id, { color });
  }
  showColorPicker.value = false;
  colorPickerTarget.value = null;
}

function getColorClass(color: string, type: "bg" | "text") {
  const prefix = type === "bg" ? "bg" : "text";
  // 优先从 SYSTEM_COLORS 匹配对应的类名，如果没有则使用默认逻辑
  const sysColor = SYSTEM_COLORS.find((c) => c.id === color);
  if (sysColor) {
    if (type === "bg") return sysColor.bgClass;
    return `text-${color}-500`; // text 类名暂时维持现状
  }
  return `${prefix}-${color}-500`;
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value;
}

// 侧边栏宽度类
const sidebarWidth = computed(() => (isCollapsed.value ? "w-16" : "w-60"));

// 拖拽排序 (SortableJS)
onMounted(() => {
  // 添加全局点击监听,关闭右键菜单和颜色选择器
  document.addEventListener("click", handleGlobalClick);

  if (projectsListRef.value) {
    Sortable.create(projectsListRef.value, {
      animation: 250,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      ghostClass: "bg-gray-100",
      draggable: "[data-id]", // Only drag items with data-id
      handle: ".group", // Allow dragging anywhere on the item
      forceFallback: true, // 强制使用 HTML5 DnD fallback，修复 macOS WebKit 兼容性
      fallbackOnBody: true, // 确保拖拽时元素层级脱离容器，防止被遮挡
      onEnd: () => {
        if (!projectsListRef.value) return;
        const newOrderIds = Array.from(projectsListRef.value.children)
          .map((el) => (el as HTMLElement).getAttribute("data-id"))
          .filter((id): id is string => !!id);

        projectStore.reorderProjects(newOrderIds);
      },
    });
  }

  if (labelsListRef.value) {
    Sortable.create(labelsListRef.value, {
      animation: 250,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      ghostClass: "bg-gray-100",
      draggable: "[data-id]",
      handle: ".group",
      forceFallback: true, // 强制使用 HTML5 DnD fallback，修复 macOS WebKit 兼容性
      fallbackOnBody: true, // 确保拖拽时元素层级脱离容器，防止被遮挡
      onEnd: () => {
        if (!labelsListRef.value) return;
        const newOrderIds = Array.from(labelsListRef.value.children)
          .map((el) => (el as HTMLElement).getAttribute("data-id"))
          .filter((id): id is string => !!id);

        labelStore.reorderLabels(newOrderIds);
      },
    });
  }
});

onUnmounted(() => {
  // 清理全局点击监听
  document.removeEventListener("click", handleGlobalClick);
});
</script>

<template>
  <aside
    :class="[
      sidebarWidth,
      'h-full bg-white dark:bg-zinc-950 border-r border-gray-100 dark:border-zinc-800 flex flex-col transition-all duration-300 ease-in-out',
    ]"
  >
    <!-- Logo Area -->
    <div class="h-14 flex items-center px-4 shrink-0" data-tauri-drag-region>
      <div
        class="flex items-center gap-2.5 cursor-pointer transition-opacity hover:opacity-80"
        @click="router.push('/')"
      >
        <div
          class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shrink-0"
        >
          <CheckSquare class="w-4 h-4 text-white" />
        </div>
        <span
          v-if="!isCollapsed"
          class="text-base font-semibold text-gray-900 dark:text-gray-50 whitespace-nowrap"
          >TaskFlow</span
        >
      </div>
    </div>

    <!-- Main Navigation -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-2">
      <!-- Standard Views -->
      <div class="space-y-0.5">
        <template v-for="item in visibleNavItems" :key="item.name">
          <Tooltip
            :text="isCollapsed ? t('sidebar.' + item.name) : undefined"
            position="right"
            :inline="false"
          >
            <router-link
              :to="item.path"
              class="flex items-center rounded-lg transition-all duration-300"
              :class="[
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50',
                isCollapsed
                  ? 'justify-center w-10 h-10 mx-auto gap-0'
                  : 'justify-start w-full px-3 h-10 gap-3',
                'text-sm',
              ]"
            >
              <component
                :is="item.icon"
                class="w-5 h-5 shrink-0 transition-all duration-300"
                :class="
                  isActive(item.path)
                    ? 'text-blue-600 dark:text-blue-400'
                    : item.iconColor
                "
              />

              <span
                class="flex items-center overflow-hidden transition-all duration-300 origin-left"
                :class="isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'"
              >
                <span class="truncate flex-1">{{
                  t("sidebar." + item.name)
                }}</span>
                <span
                  v-if="getNavCount(item.name) > 0"
                  class="ml-auto text-xs text-gray-400 shrink-0"
                  >{{ getNavCount(item.name) }}</span
                >
              </span>
            </router-link>
          </Tooltip>
        </template>
      </div>

      <!-- 视图收起/展开分割线 （5个视图，超过3个时显示） -->
      <div
        v-if="navItems.length > 3"
        class="sidebar-divider flex items-center px-1 cursor-pointer select-none"
      >
        <div class="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
        <template v-if="!isCollapsed">
          <component
            :is="isViewsExpanded ? ChevronUp : ChevronDown"
            class="w-5 h-5 mx-1 text-gray-400 shrink-0"
            @click="isViewsExpanded = !isViewsExpanded"
          />
        </template>
        <div class="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
      </div>

      <!-- Projects -->
      <div>
        <div
          class="flex items-center justify-between px-3 mb-2 transition-all duration-300 overflow-hidden"
          :class="isCollapsed ? 'opacity-0 h-0 mb-0' : 'opacity-100 h-6'"
        >
          <h3
            class="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider whitespace-nowrap"
          >
            {{ t("sidebar.projects") }}
          </h3>
          <button
            @click.stop="startAddProject"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -mr-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>

        <!-- Overview Project View -->
        <Tooltip
          :text="isCollapsed ? t('sidebar.overview') : undefined"
          position="right"
        >
          <router-link
            to="/overview"
            class="flex items-center rounded-lg transition-all duration-300 mb-0.5"
            :class="[
              isActive('/overview')
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50',
              isCollapsed
                ? 'justify-center w-10 h-9 mx-auto gap-0'
                : 'justify-start w-full px-3 h-9 gap-3',
              'text-sm',
            ]"
          >
            <LayoutGrid
              class="w-4 h-4 shrink-0"
              :class="
                isActive('/overview')
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-400'
              "
            />
            <span
              class="truncate transition-all duration-300 origin-left"
              :class="isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'"
            >
              {{ t("sidebar.overview") }}
            </span>
          </router-link>
        </Tooltip>

        <div class="space-y-0.5" ref="projectsListRef">
          <template v-for="project in visibleProjects" :key="project.id">
            <!-- Project Item Wrapper -->
            <div :data-id="project.id">
              <!-- Edit View -->
              <div
                v-if="editingProjectId === project.id && !isCollapsed"
                class="flex items-center gap-3 px-3 h-9"
              >
                <span
                  class="w-2.5 h-2.5 rounded-full shrink-0"
                  :class="getColorClass(project.color, 'bg')"
                ></span>
                <input
                  ref="editInput"
                  v-model="editingName"
                  @keydown.enter="saveProjectName"
                  @keydown.escape="editingProjectId = null"
                  @blur="saveProjectName"
                  class="flex-1 min-w-0 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded px-2 h-7 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Standard View -->
              <Tooltip
                :text="isCollapsed ? project.name : undefined"
                position="right"
              >
                <router-link
                  v-if="editingProjectId !== project.id || isCollapsed"
                  :to="`/project/${project.id}/${activeProjectView}`"
                  @dblclick="!isCollapsed && startEditProject(project)"
                  @contextmenu="showContextMenu($event, 'project', project.id)"
                  class="flex items-center rounded-lg transition-all duration-300 group"
                  :class="[
                    isProjectActive(project.id)
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50',
                    isCollapsed
                      ? 'justify-center w-10 h-9 mx-auto gap-0'
                      : 'justify-start w-full px-3 h-9 gap-3',
                    'text-sm',
                  ]"
                >
                  <span
                    class="rounded-full shrink-0 transition-all duration-300"
                    :class="[
                      getColorClass(project.color, 'bg'),
                      isCollapsed
                        ? 'w-3 h-3'
                        : 'w-2.5 h-2.5 group-hover:scale-110',
                    ]"
                  ></span>

                  <span
                    class="truncate transition-all duration-300 origin-left"
                    :class="
                      isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
                    "
                  >
                    {{ project.name }}
                  </span>
                </router-link>
              </Tooltip>
            </div>
          </template>

          <!-- Add Project Input -->
          <div
            v-if="isAddingProject && !isCollapsed"
            class="flex items-center gap-3 px-3 h-9"
          >
            <span class="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
            <input
              ref="newItemInput"
              v-model="newItemName"
              @keydown.enter="confirmAddProject"
              @keydown.escape="cancelAddProject"
              @blur="confirmAddProject"
              class="flex-1 min-w-0 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded px-2 h-7 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- 项目收起/展开分割线 -->
        <div
          v-if="projectStore.projects.length > 3"
          class="sidebar-divider flex items-center px-1 mt-1 cursor-pointer select-none"
        >
          <div class="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
          <template v-if="!isCollapsed">
            <component
              :is="isProjectsExpanded ? ChevronUp : ChevronDown"
              class="w-5 h-5 mx-1 text-gray-400 shrink-0"
              @click="isProjectsExpanded = !isProjectsExpanded"
            />
          </template>
          <div class="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
        </div>
      </div>

      <!-- Labels -->
      <div>
        <div
          class="flex items-center justify-between px-3 mb-2 transition-all duration-300 overflow-hidden"
          :class="isCollapsed ? 'opacity-0 h-0 mb-0' : 'opacity-100 h-6'"
        >
          <h3
            class="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider whitespace-nowrap"
          >
            {{ t("sidebar.labels") }}
          </h3>
          <button
            @click.stop="startAddLabel"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 -mr-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>

        <div class="space-y-0.5" ref="labelsListRef">
          <template v-for="label in visibleLabels" :key="label.id">
            <div :data-id="label.id">
              <!-- Edit View -->
              <div
                v-if="editingLabelId === label.id && !isCollapsed"
                class="flex items-center gap-3 px-3 h-9"
              >
                <Tag
                  class="w-4 h-4 shrink-0"
                  :class="getColorClass(label.color, 'text')"
                />
                <input
                  ref="editInput"
                  v-model="editingName"
                  @keydown.enter="saveLabelName"
                  @keydown.escape="editingLabelId = null"
                  @blur="saveLabelName"
                  class="flex-1 min-w-0 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded px-2 h-7 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Standard View -->
              <Tooltip
                :text="isCollapsed ? label.name : undefined"
                position="right"
              >
                <router-link
                  v-if="editingLabelId !== label.id || isCollapsed"
                  :to="`/label/${label.id}`"
                  @dblclick="!isCollapsed && startEditLabel(label)"
                  @contextmenu="showContextMenu($event, 'label', label.id)"
                  class="flex items-center rounded-lg transition-all duration-300 group"
                  :class="[
                    isLabelActive(label.id)
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50',
                    isCollapsed
                      ? 'justify-center w-10 h-9 mx-auto gap-0'
                      : 'justify-start w-full px-3 h-9 gap-3',
                    'text-sm',
                  ]"
                >
                  <Tag
                    class="shrink-0 transition-all duration-300"
                    :class="[
                      getColorClass(label.color, 'text'),
                      isCollapsed ? 'w-4 h-4' : 'w-4 h-4 group-hover:scale-110',
                    ]"
                  />

                  <span
                    class="truncate transition-all duration-300 origin-left"
                    :class="
                      isCollapsed ? 'w-0 opacity-0' : 'w-full opacity-100'
                    "
                  >
                    {{ label.name }}
                  </span>
                </router-link>
              </Tooltip>
            </div>
          </template>

          <!-- Add Label Input -->
          <div
            v-if="isAddingLabel && !isCollapsed"
            class="flex items-center gap-3 px-3 h-9"
          >
            <Tag class="w-4 h-4 text-gray-400 shrink-0" />
            <input
              ref="newItemInput"
              v-model="newItemName"
              @keydown.enter="confirmAddLabel"
              @keydown.escape="cancelAddLabel"
              @blur="confirmAddLabel"
              class="flex-1 min-w-0 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded px-2 h-7 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- 标签收起/展开分割线 -->
        <div
          v-if="labelStore.labels.length > 3"
          class="sidebar-divider flex items-center px-1 mt-1 cursor-pointer select-none"
        >
          <div class="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
          <template v-if="!isCollapsed">
            <component
              :is="isLabelsExpanded ? ChevronUp : ChevronDown"
              class="w-5 h-5 mx-1 text-gray-400 shrink-0"
              @click="isLabelsExpanded = !isLabelsExpanded"
            />
          </template>
          <div class="flex-1 h-px bg-gray-200 dark:bg-zinc-700"></div>
        </div>
      </div>
    </nav>

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
          <span>{{ t("common.preferences") }}</span>
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
        {{ t("common.rename") }}
      </button>
      <button
        @click="handleContextAction('color')"
        class="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 flex items-center gap-2 transition-colors"
      >
        <Palette class="w-4 h-4" /> {{ t("common.change_color") }}
      </button>
      <div class="h-px bg-gray-100 dark:bg-zinc-700 my-1"></div>
      <button
        @click="handleContextAction('delete')"
        class="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
      >
        <Trash2 class="w-4 h-4" /> {{ t("common.delete") }}
      </button>
    </div>
  </Teleport>

  <!-- Color Picker Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showColorPicker"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
        @click="showColorPicker = false"
      >
        <div
          class="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-5 border border-gray-200 dark:border-zinc-700"
          @click.stop
        >
          <h3
            class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4"
          >
            {{ t("common.choose_color") }}
          </h3>
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
