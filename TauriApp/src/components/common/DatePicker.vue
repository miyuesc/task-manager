<template>
  <div class="relative" ref="containerRef">
    <button 
      @click="togglePicker"
      class="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
    >
      <CalendarDays class="w-4 h-4 text-gray-400" />
      <span :class="modelValue ? 'text-gray-900 dark:text-white' : 'text-gray-400'">
        {{ displayValue }}
      </span>
    </button>

    <!-- Dropdown -->
    <Teleport to="body">
      <Transition name="fade-scale">
        <div 
          v-if="isOpen"
          class="fixed z-[100] bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 p-5 min-w-[300px]"
          :style="dropdownStyle"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between mb-4">
            <button @click="prevYear" class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <ChevronsLeft class="w-5 h-5" />
            </button>
            <button @click="prevMonth" class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <ChevronLeft class="w-5 h-5" />
            </button>
            <span class="text-base font-semibold text-gray-900 dark:text-white">
              {{ monthHeading }}
            </span>
            <button @click="nextMonth" class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <ChevronRight class="w-5 h-5" />
            </button>
            <button @click="nextYear" class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <ChevronsRight class="w-5 h-5" />
            </button>
          </div>

          <!-- Weekday Headers -->
          <div class="grid grid-cols-7 mb-2">
            <div v-for="day in weekDays" :key="day" class="text-center text-sm font-medium text-gray-400 dark:text-gray-500 py-1">
              {{ day }}
            </div>
          </div>

          <!-- Calendar Grid -->
          <div class="grid grid-cols-7 gap-1">
            <div 
              v-for="(day, index) in calendarDays" 
              :key="index"
              class="relative"
            >
              <button 
                v-if="day"
                @click="selectDate(day)"
                class="w-full aspect-square flex items-center justify-center text-sm rounded-xl transition-all"
                :class="getDayClass(day)"
              >
                {{ day }}
                <span 
                  v-if="isToday(day)"
                  class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500"
                ></span>
              </button>
              <div v-else class="w-full aspect-square"></div>
            </div>
          </div>

          <!-- Today Button -->
          <div class="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800">
            <button 
              @click="goToToday"
              class="w-full text-center text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors py-1"
            >
              {{ t('common.today') }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next';
import { getLocalDateISOString } from '@/utils/date';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});

const today = new Date();
const currentMonth = ref(today.getMonth());
const currentYear = ref(today.getFullYear());

// 动态生成本土地化的周几名称
const weekDays = computed(() => {
  const baseDate = new Date(2021, 0, 3); // 2021-01-03 是周日
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    return date.toLocaleDateString(locale.value, { weekday: 'narrow' });
  });
});

const displayValue = computed(() => {
  if (!props.modelValue) return props.placeholder || t('task.set_due_date');
  const [year, month, day] = props.modelValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale.value, { month: 'short', day: 'numeric', year: 'numeric' });
});

// 计算本土化的月份标题
const monthHeading = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, 1);
  return date.toLocaleDateString(locale.value, { year: 'numeric', month: 'long' });
});

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1);
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0);
  const days: (number | null)[] = [];
  
  // 填充月份开头的空白
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }
  
  // 填充日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(i);
  }
  
  return days;
});

function togglePicker() {
  isOpen.value = !isOpen.value;
  
  if (isOpen.value) {
    updateDropdownPosition();
    // 如果有选中日期，跳转到该月份
    if (props.modelValue) {
      const date = new Date(props.modelValue);
      currentMonth.value = date.getMonth();
      currentYear.value = date.getFullYear();
    }
  }
}

function updateDropdownPosition() {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  dropdownStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`,
  };
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

function prevYear() {
  currentYear.value--;
}

function nextYear() {
  currentYear.value++;
}

function selectDate(day: number) {
  const date = new Date(currentYear.value, currentMonth.value, day);
  const dateStr = getLocalDateISOString(date);
  emit('update:modelValue', dateStr);
  isOpen.value = false;
}

function goToToday() {
  currentMonth.value = today.getMonth();
  currentYear.value = today.getFullYear();
  selectDate(today.getDate());
}

function isToday(day: number): boolean {
  return today.getDate() === day && 
         today.getMonth() === currentMonth.value && 
         today.getFullYear() === currentYear.value;
}

function isSelected(day: number): boolean {
  if (!props.modelValue) return false;
  const selected = new Date(props.modelValue);
  return selected.getDate() === day && 
         selected.getMonth() === currentMonth.value && 
         selected.getFullYear() === currentYear.value;
}

function getDayClass(day: number): string {
  if (isSelected(day)) {
    return 'bg-blue-500 text-white hover:bg-blue-600';
  }
  if (isToday(day)) {
    return 'text-gray-900 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800';
  }
  return 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800';
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.15s ease;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
