<template>
  <div class="flex flex-col h-full">
    <component :is="currentViewComponent" />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const BoardView = defineAsyncComponent(() => import('./BoardView.vue'));
const OverviewListView = defineAsyncComponent(() => import('./OverviewListView.vue'));
const TimelineView = defineAsyncComponent(() => import('./TimelineView.vue'));
const CalendarView = defineAsyncComponent(() => import('./CalendarView.vue'));

// 根据路由子路径决定展示哪个视图
const currentViewComponent = computed(() => {
  const viewName = route.params.view as string;
  switch (viewName) {
    case 'list': return OverviewListView;
    case 'timeline': return TimelineView;
    case 'calendar': return CalendarView;
    case 'board':
    default: return BoardView;
  }
});
</script>
