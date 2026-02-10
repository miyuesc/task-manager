<template>
  <div class="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
    <Sidebar />
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <Header />
      <div class="flex-1 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-zinc-900/50">
        <ContentHeader />
        <main class="flex-1 overflow-hidden">
          <slot />
        </main>
      </div>
    </div>
    <TaskDetailModal />
  </div>
</template>

<script setup lang="ts">
import Sidebar from '@/components/layout/Sidebar.vue';
import Header from '@/components/layout/Header.vue';
import ContentHeader from '@/components/layout/ContentHeader.vue';
import TaskDetailModal from '@/components/task/TaskDetailModal.vue';
</script>
