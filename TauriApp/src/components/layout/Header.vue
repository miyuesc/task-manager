<template>
  <header class="h-14 bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between px-5 transition-colors duration-200 shrink-0">
    <!-- Left: Search Bar -->
    <GlobalSearch />

    <!-- Right: Actions -->
    <div class="flex items-center gap-2">
      <!-- Language Switcher -->
      <div 
        class="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" 
        :title="t('common.language')"
      >
        <Languages class="w-5 h-5" />
        <select v-model="locale" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
            <option value="en">English</option>
            <option value="zh">中文</option>
        </select>
      </div>
      <!-- Theme Switcher -->
      <button 
        @click="toggleTheme" 
        class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
      >
        <Sun v-if="isDark" class="w-5 h-5" />
        <Moon v-else class="w-5 h-5" />
      </button>

      <!-- Settings -->
      <button class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
        <Settings class="w-5 h-5" />
      </button>

      <!-- User Avatar -->
      <button class="ml-1">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center overflow-hidden ring-2 ring-white dark:ring-zinc-800">
          <span class="text-white text-xs font-medium">M</span>
        </div>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { 
  Settings, 
  Sun,
  Moon,
  Languages
} from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';
import GlobalSearch from './GlobalSearch.vue';

const { t, locale } = useI18n();

const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true;
    document.documentElement.classList.add('dark');
  } else {
    isDark.value = false;
    document.documentElement.classList.remove('dark');
  }
});
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
