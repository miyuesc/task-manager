<template>
  <div class="relative" ref="dropdownRef">
    <!-- 触发器 -->
    <button
      @click="toggle"
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
      :class="[
        triggerClass,
        isOpen ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
      ]"
    >
      <slot name="trigger">
        <span class="text-sm text-gray-700 dark:text-gray-300">{{ displayText }}</span>
        <ChevronDown class="w-3.5 h-3.5 text-gray-400" />
      </slot>
    </button>

    <!-- 下拉菜单 -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute z-50 mt-2 py-2 px-4 flex flex-col gap-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-700 min-w-[200px]"
        :class="[alignClass, widthClass]"
      >
        <slot name="menu">
          <button
            v-for="option in options"
            :key="option.value"
            @click="select(option)"
            class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left rounded-xl transition-all duration-150"
            :class="isSelected(option) 
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'"
          >
            <!-- 颜色圆点 -->
            <span
              v-if="option.color"
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :style="{ backgroundColor: option.color }"
            ></span>
            <!-- 图标 -->
            <component
              v-if="option.icon"
              :is="option.icon"
              class="w-4 h-4 shrink-0"
              :class="option.iconClass || 'text-gray-500'"
            />
            <!-- 标签 -->
            <span class="flex-1">{{ option.label }}</span>
            <!-- 选中标记 -->
            <Check v-if="isSelected(option)" class="w-4 h-4 text-blue-500" />
          </button>
        </slot>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, type Component } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';

export interface DropdownOption {
  value: string;
  label: string;
  color?: string;
  icon?: Component;
  iconClass?: string;
}

interface Props {
  modelValue?: string | string[];
  options?: DropdownOption[];
  placeholder?: string;
  multiple?: boolean;
  align?: 'left' | 'right';
  width?: 'auto' | 'full' | 'trigger';
  triggerClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  placeholder: '请选择',
  multiple: false,
  align: 'left',
  width: 'auto',
  triggerClass: '',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | string[]): void;
  (e: 'update:modelValue', value: string): void;
  (e: 'change', option: DropdownOption): void;
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const displayText = computed(() => {
  const val = props.modelValue;
  if (props.multiple && Array.isArray(val)) {
    if (val.length === 0) return props.placeholder;
    const selected = props.options.filter(o => val.includes(o.value));
    return selected.map(o => o.label).join(', ');
  }
  const selected = props.options.find(o => o.value === val);
  return selected?.label || props.placeholder;
});

const alignClass = computed(() => props.align === 'right' ? 'right-0' : 'left-0');
const widthClass = computed(() => {
  if (props.width === 'full') return 'w-full';
  if (props.width === 'trigger') return 'min-w-full';
  return '';
});

function toggle() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

function isSelected(option: DropdownOption): boolean {
  if (props.multiple && Array.isArray(props.modelValue)) {
    return props.modelValue.includes(option.value);
  }
  return props.modelValue === option.value;
}

function select(option: DropdownOption) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const index = current.indexOf(option.value);
    if (index === -1) {
      current.push(option.value);
    } else {
      current.splice(index, 1);
    }
    emit('update:modelValue', current);
  } else {
    emit('update:modelValue', option.value);
    close();
  }
  emit('change', option);
}

function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    close();
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
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
