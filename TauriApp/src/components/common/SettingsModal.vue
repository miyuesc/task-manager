<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" @click="close">
      <div 
        class="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 flex flex-col max-h-[85vh]"
        @click.stop
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ t('settings.title') }}</h2>
          <button 
            @click="close"
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Content -->
        <div class="flex flex-1 overflow-hidden">
          <!-- Sidebar -->
          <div class="w-48 border-r border-gray-100 dark:border-zinc-800 p-2 space-y-1 bg-gray-50/50 dark:bg-zinc-900/30 overflow-y-auto">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="w-full px-3 py-2 text-sm font-medium rounded-lg text-left flex items-center gap-2 transition-colors"
              :class="activeTab === tab.id 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'"
            >
              <component :is="tab.icon" class="w-4 h-4" />
              {{ t(tab.labelKey) }}
            </button>
          </div>

          <!-- Main Panel -->
          <div class="flex-1 overflow-y-auto p-6 space-y-8">
            <!-- General Settings -->
            <section v-if="activeTab === 'general'" class="space-y-6">
              <!-- Theme -->
              <div class="space-y-3">
                <label class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ t('settings.theme') }}</label>
                <div class="grid grid-cols-3 gap-3">
                  <button 
                    v-for="opt in themeOptions" 
                    :key="opt.value"
                    @click="settingsStore.setTheme(opt.value)"
                    class="px-4 py-3 rounded-xl border flex flex-col items-center gap-2 transition-all"
                    :class="settingsStore.theme === opt.value 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500' 
                      : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400'"
                  >
                    <component :is="opt.icon" class="w-5 h-5" />
                    <span class="text-xs font-medium">{{ t(opt.labelKey) }}</span>
                  </button>
                </div>
              </div>

              <!-- Language -->
              <div class="space-y-3">
                <label class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ t('settings.language') }}</label>
                <select 
                  v-model="settingsStore.locale"
                  class="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="en">English (US)</option>
                  <option value="zh">简体中文</option>
                </select>
              </div>
              
              <!-- Zoom -->
               <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ t('settings.zoom') }}</label>
                  <span class="text-sm text-gray-500">{{ Math.round(settingsStore.zoomLevel * 100) }}%</span>
                </div>
                <div class="flex items-center gap-4">
                  <button 
                    @click="adjustZoom(-0.1)"
                    class="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500"
                  >
                    <Minus class="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    :value="settingsStore.zoomLevel"
                    @input="e => updateZoom(e)"
                    class="flex-1 h-2 bg-gray-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                   <button 
                    @click="adjustZoom(0.1)"
                    class="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500"
                  >
                    <Plus class="w-4 h-4" />
                  </button>
                  <button 
                    @click="resetZoom"
                    class="text-xs text-blue-500 hover:text-blue-600 font-medium px-2"
                  >
                    {{ t('common.reset') }}
                  </button>
                </div>
              </div>
            </section>

             <!-- Profile Settings -->
             <section v-if="activeTab === 'profile'" class="space-y-6">
               <div class="space-y-3">
                  <label class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ t('settings.user_name') }}</label>
                  <input 
                    v-model="settingsStore.userName"
                    type="text"
                    class="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
               </div>
               <!-- Avatar Color Picker (Simple for now) -->
               <!-- Could expand to image upload later -->
             </section>

            <!-- Data Management -->
            <section v-if="activeTab === 'data'" class="space-y-6">
              <div class="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-xl">
                <div class="flex items-start gap-3">
                  <AlertTriangle class="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div class="text-sm">
                    <h4 class="font-medium text-orange-800 dark:text-orange-200">{{ t('settings.data_warning_title') }}</h4>
                    <p class="text-orange-600 dark:text-orange-300 mt-1 leading-relaxed">{{ t('settings.data_warning_desc') }}</p>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 border border-gray-100 dark:border-zinc-800 rounded-xl">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">{{ t('settings.export_data') }}</h4>
                    <p class="text-xs text-gray-500 mt-1">{{ t('settings.export_desc') }}</p>
                  </div>
                  <button 
                    @click="exportData"
                    class="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                  >
                    <Download class="w-4 h-4" />
                    {{ t('common.export') }}
                  </button>
                </div>

                <div class="flex items-center justify-between p-4 border border-gray-100 dark:border-zinc-800 rounded-xl">
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-white">{{ t('settings.import_data') }}</h4>
                    <p class="text-xs text-gray-500 mt-1">{{ t('settings.import_desc') }}</p>
                  </div>
                  <label 
                    class="px-4 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 cursor-pointer relative"
                  >
                    <Upload class="w-4 h-4" />
                    {{ t('common.import') }}
                    <input 
                      type="file" 
                      accept=".json" 
                      class="absolute inset-0 opacity-0 cursor-pointer"
                      @change="importData"
                    />
                  </label>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  X, 
  Monitor, 
  Moon, 
  Sun, 
  Laptop, 
  User, 
  Database, 
  Download, 
  Upload, 
  AlertTriangle,
  Minus,
  Plus
} from 'lucide-vue-next';
import { useSettingsStore, Theme } from '@/stores/settings';
import { useTaskStore } from '@/stores/task';
import { useProjectStore } from '@/stores/project';
import { useColumnStore } from '@/stores/column';
import { useLabelStore } from '@/stores/label';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();
const settingsStore = useSettingsStore();
const taskStore = useTaskStore();
const projectStore = useProjectStore();
const columnStore = useColumnStore();
const labelStore = useLabelStore();

// Tabs
const activeTab = ref('general');
const tabs = [
  { id: 'general', labelKey: 'settings.general', icon: Laptop },
  { id: 'profile', labelKey: 'settings.profile', icon: User },
  { id: 'data', labelKey: 'settings.data', icon: Database },
];

function close() {
  emit('close');
}

// Theme
const themeOptions = [
  { value: 'light' as Theme, labelKey: 'settings.theme_light', icon: Sun },
  { value: 'dark' as Theme, labelKey: 'settings.theme_dark', icon: Moon },
  { value: 'auto' as Theme, labelKey: 'settings.theme_auto', icon: Monitor },
];

// Zoom
function updateZoom(e: Event) {
  const target = e.target as HTMLInputElement;
  settingsStore.setZoom(parseFloat(target.value));
}

function adjustZoom(delta: number) {
  const newZoom = Math.max(0.5, Math.min(1.5, settingsStore.zoomLevel + delta));
  settingsStore.setZoom(newZoom);
}

function resetZoom() {
  settingsStore.setZoom(1);
}

// Data Export
function exportData() {
  const data = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    tasks: taskStore.tasks,
    projects: projectStore.projects,
    columns: columnStore.columns,
    progressingColumnIds: columnStore.progressingColumnIds,
    completedColumnId: columnStore.completedColumnId,
    labels: labelStore.labels,
    settings: {
      theme: settingsStore.theme,
      locale: settingsStore.locale,
      zoomLevel: settingsStore.zoomLevel,
    }
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `task-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Data Import
async function importData(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate (Simple check)
    if (!data.tasks || !data.projects || !data.columns) {
      alert(t('settings.invalid_file'));
      return;
    }

    if (!confirm(t('settings.confirm_import'))) {
      return;
    }

    // Restore Data
    // Note: We are replacing the arrays directly. Pinia reactivity handles this.
    // However, for complex stores, we might need actions. 
    // Since we used `ref` in `defineStore`, `.value = ...` works.
    
    // We should probably use public actions or direct state manipulation if allowed.
    // Accessing state directly via store.$state or stored refs.
    
    taskStore.tasks = data.tasks;
    projectStore.projects = data.projects;
    columnStore.columns = data.columns;
    if (data.progressingColumnIds) columnStore.progressingColumnIds = data.progressingColumnIds;
    if (data.completedColumnId) columnStore.completedColumnId = data.completedColumnId;
    labelStore.labels = data.labels;

    if (data.settings) {
       if (data.settings.theme) settingsStore.setTheme(data.settings.theme);
       if (data.settings.locale) settingsStore.setLocale(data.settings.locale);
       if (data.settings.zoomLevel) settingsStore.setZoom(data.settings.zoomLevel);
    }
    
    alert(t('settings.import_success'));
    close();
    // Maybe reload to ensure fresh state usage
    window.location.reload(); 

  } catch (err) {
    console.error(err);
    alert(t('settings.import_error'));
  } finally {
    // Reset input
    target.value = '';
  }
}

</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
