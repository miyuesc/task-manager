<template>
  <div class="space-y-3">
    <!-- Start Date -->
    <div class="flex items-center">
      <span class="text-sm text-gray-500 w-24">{{ t('task.start_date') }}</span>
      <DatePicker 
        :model-value="task.startDate" 
        @update:model-value="(val) => $emit('update', 'startDate', val)"
        :placeholder="t('task.set_start_date')" 
      />
    </div>

    <!-- Due Date -->
    <div class="flex items-center">
      <span class="text-sm text-gray-500 w-24">{{ t('task.due_date') }}</span>
      <DatePicker 
        :model-value="task.dueDate" 
        @update:model-value="(val) => $emit('update', 'dueDate', val)"
        :placeholder="t('task.set_due_date')" 
      />
    </div>

    <!-- Priority -->
    <div class="flex items-center">
      <span class="text-sm text-gray-500 w-24">{{ t('task.priority') }}</span>
      <Dropdown
        :model-value="task.priority || ''"
        :options="priorityOptions"
        :placeholder="t('task.set_priority')"
        @update:model-value="(val) => $emit('update', 'priority', val)"
      >
        <template #trigger>
          <span 
            v-if="task.priority"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full cursor-pointer"
            :class="getPriorityClass(task.priority)"
          >
            <BarChart3 class="w-3.5 h-3.5" />
            {{ getPriorityLabel(task.priority) }}
            <ChevronDown class="w-3 h-3 opacity-60" />
          </span>
          <span v-else class="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
            <Plus class="w-4 h-4" />
            {{ t('task.set_priority') }}
          </span>
        </template>
      </Dropdown>
    </div>

    <!-- Labels -->
    <div class="flex items-center">
      <span class="text-sm text-gray-500 w-24">{{ t('task.tags') }}</span>
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Selected Labels -->
        <span 
          v-for="labelId in (task.labels || [])" 
          :key="labelId"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300"
        >
          <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: getLabelColor(labelId) }"></span>
          {{ getLabelName(labelId) }}
          <button @click="removeLabel(labelId)" class="ml-0.5 opacity-60 hover:opacity-100">
            <X class="w-3 h-3" />
          </button>
        </span>
        
        <!-- Add Label Dropdown -->
        <Dropdown
          :model-value="task.labels || []"
          :options="labelOptions"
          multiple
          @update:model-value="updateLabels"
        >
          <template #trigger>
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-zinc-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-400 cursor-pointer transition-colors">
              <Plus class="w-3.5 h-3.5" />
            </span>
          </template>
        </Dropdown>
      </div>
    </div>

    <!-- Location -->
    <div class="flex items-center">
      <span class="text-sm text-gray-500 w-24">{{ t('task.location') }}</span>
      <div class="flex-1 flex items-center gap-2 group">
        <input 
          class="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm text-gray-900 dark:text-gray-300 placeholder-gray-400"
          :value="task.location"
          @change="(e) => $emit('update', 'location', (e.target as HTMLInputElement).value)"
          :placeholder="t('task.add_location')"
        />
        <button 
          @click="getCurrentLocation"
          class="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all"
          :title="t('task.location')"
        >
          <MapPin class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BarChart3, ChevronDown, Plus, X, MapPin } from 'lucide-vue-next';
import DatePicker from '@/components/common/DatePicker.vue';
import Dropdown from '@/components/ui/Dropdown.vue';
import { useLabelStore } from '@/stores/label';

const props = defineProps<{
  task: any;
}>();

const emit = defineEmits(['update']);

const { t } = useI18n();
const labelStore = useLabelStore();

// Priority Options
const priorityOptions = computed(() => [
  { value: 'low', label: t('priority.low'), color: '#10B981' },
  { value: 'medium', label: t('priority.medium'), color: '#3B82F6' },
  { value: 'high', label: t('priority.high'), color: '#EF4444' },
]);

// Label Options
const labelOptions = computed(() => labelStore.labels.map(l => ({
  value: l.id, label: l.name, color: getColorHex(l.color)
})));

// Helper Functions
function getPriorityLabel(p?: string) { return p ? t(`priority.${p}`) : p; }

function getPriorityClass(p?: string) {
    if (p === 'low') return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30';
    if (p === 'medium') return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30';
    if (p === 'high') return 'bg-red-100 text-red-600 dark:bg-red-900/30';
    return '';
}

function getLabelName(id: string) { return labelStore.labels.find(l => l.id === id)?.name || id; }

function getLabelColor(id: string) { return getColorHex(labelStore.labels.find(l => l.id === id)?.color || 'gray'); }

function getColorHex(color: string): string {
    const map: Record<string, string> = { red: '#EF4444', blue: '#3B82F6', green: '#10B981', orange: '#F97316', purple: '#A855F7', gray: '#6B7280' };
    return map[color] || color;
}

// Actions
function updateLabels(newLabels: string | string[]) {
  // Ensure it's array
  const val = Array.isArray(newLabels) ? newLabels : [newLabels];
  emit('update', 'labels', val);
}

function removeLabel(id: string) {
  const currentLabels = props.task.labels || [];
  const newLabels = currentLabels.filter((l: string) => l !== id);
  emit('update', 'labels', newLabels);
}

function getCurrentLocation() {
  if (!("geolocation" in navigator)) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
      if (response.ok) {
        const data = await response.json();
        // Prefer explicit address parts if available for shorter text, or full display_name
        // display_name is usually long. 
        // Let's try to construct a shorter one or just use display_name.
        emit('update', 'location', data.display_name);
      } else {
        emit('update', 'location', `${latitude}, ${longitude}`);
      }
    } catch (e) {
      emit('update', 'location', `${latitude}, ${longitude}`);
    }
  }, (err) => {
    console.error(err);
    alert("Unable to retrieve location");
  });
}
</script>
