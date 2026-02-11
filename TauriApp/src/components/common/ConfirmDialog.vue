<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="store.isVisible" class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="handleOverlayClick">
        <Transition name="bounce">
          <div 
            v-if="store.isVisible" 
            class="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-zinc-700"
            role="dialog"
            aria-modal="true"
          >
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                <component :is="iconComponent" class="w-5 h-5 flex-shrink-0" :class="iconColorClass" />
                {{ store.options.title || '提示' }}
              </h3>
              <button @click="handleCancel" class="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Content -->
            <div class="px-6 py-6">
              <p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {{ store.options.message }}
              </p>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 bg-gray-50 dark:bg-zinc-800/50 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-zinc-700">
              <button 
                v-if="!store.options.isAlert"
                @click="handleCancel"
                class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-700 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-zinc-600 rounded-lg shadow-sm transition-all active:scale-95"
              >
                {{ store.options.cancelText || '取消' }}
              </button>
              <button 
                @click="handleConfirm"
                class="px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                :class="confirmButtonClass"
              >
                <span>{{ store.options.confirmText || '确定' }}</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useConfirmStore } from '@/stores/confirm';
import { X, AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-vue-next';

const store = useConfirmStore();

function handleConfirm() {
  store.confirm();
}

function handleCancel() {
  if (store.options.isAlert) {
    store.confirm(); // Alert behavior: any close is 'ok'
  } else {
    store.cancel();
  }
}

function handleOverlayClick() {
  if (store.options.isAlert) {
      handleConfirm();
  } else {
      // Confirm dialogs should ideally require explicit choice, but often clicking outside cancels
      handleCancel();
  }
}

// Icon Logic
const iconComponent = computed(() => {
  switch (store.options.type) {
    case 'error': return AlertCircle;
    case 'success': return CheckCircle;
    case 'info': return Info;
    case 'warning': default: return AlertTriangle;
  }
});

const iconColorClass = computed(() => {
  switch (store.options.type) {
    case 'error': return 'text-red-500';
    case 'success': return 'text-emerald-500';
    case 'info': return 'text-blue-500';
    case 'warning': default: return 'text-amber-500';
  }
});

const confirmButtonClass = computed(() => {
    switch (store.options.type) {
        case 'error': return 'bg-red-500 hover:bg-red-600 focus:ring-red-500';
        case 'success': return 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500';
        case 'info': return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500';
        case 'warning': default: return 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500'; // Warning usually implies dangerous action? Or cautious? Amber is good.
    }
});
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

.bounce-enter-active {
  animation: bounce-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.bounce-leave-active {
  animation: bounce-in 0.2s reverse;
}

@keyframes bounce-in {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
