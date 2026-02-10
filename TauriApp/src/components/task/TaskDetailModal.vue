<template>
  <!-- 遮罩层 -->
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-40 bg-black/10" @click="handleClose"></div>
  </Transition>

  <!-- 右侧抽屉堆栈 -->
  <TransitionGroup name="slide-stack">
    <!-- 如果是创建模式，显示一个 Panel -->
    <TaskDrawerPanel 
      v-if="isOpen && isCreateMode"
      key="create-mode-panel"
      :is-create-mode="true"
      :index="0"
      @close="forceClose"
    />

    <!-- 如果是普通模式，遍历 taskStack 显示 Panel -->
    <template v-else-if="isOpen">
      <TaskDrawerPanel 
        v-for="(taskId, index) in taskStack"
        :key="taskId"
        :task-id="taskId"
        :index="index"
        @close="handleClose"
        @back="popTask"
      />
    </template>
  </TransitionGroup>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useTaskModal } from '@/composables/useTaskModal';
import TaskDrawerPanel from './TaskDrawerPanel.vue';

const { 
  isOpen, 
  isCreateMode, 
  taskStack, 
  hasDraftContent,
  validateDraft,
  saveDraft,
  close: closeModal, 
  forceClose,
  popTask
} = useTaskModal();

// 关闭弹窗处理（带验证和自动保存）
function handleClose() {
  if (isCreateMode.value) {
    // 创建模式：检查是否有内容
    if (!hasDraftContent()) {
      forceClose();
      return;
    }
    
    // 验证草稿
    const validation = validateDraft();
    if (!validation.valid) {
      // Create Mode Panel needs to show error. 
      // How to pass error to child? 
      // Maybe we simply forceClose if invalid? Or user expects feedback?
      // User expects feedback inside the panel.
      // This refactoring is tricky. 
      // Ideally, the "Close" button inside CreateMode Panel calls a validateAndClose method INSIDE the panel.
      // But the Overlay click calls handleClose here.
      
      // For now, let's assume if it fails validation on overlay click, we just don't close? 
      // Or we can't easily show error without prop drilling.
      // Let's rely on the panel's own close button for validation feedback, 
      // and overlay click maybe just force closes or tries to save?
      
      return; // Do nothing if invalid?
    }
    
    // 验证通过且可以保存，自动保存任务
    if (validation.canSave) {
      const newId = saveDraft();
      if (newId) {
        closeModal();
      }
      return;
    }
    
    forceClose();
    return;
  }
  
  // 编辑模式，直接关闭
  closeModal();
}

// ESC 键退出：子任务优先返回父任务
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    e.preventDefault();
    e.stopPropagation();
    // 如果当前是子任务（栈深度>1），先返回父任务
    if (taskStack.value.length > 1) {
      popTask();
    } else {
      // 顶级任务，尝试关闭弹窗
      handleClose();
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
/* 遮罩层动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 堆栈滑动动画 */
.slide-stack-enter-active,
.slide-stack-leave-active {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}
.slide-stack-enter-from,
.slide-stack-leave-to {
  transform: translateX(100%);
}
.slide-stack-leave-active {
  /* 让离开的元素位于最上层，产生覆盖退出的效果? 
     不，slide-leave-to 也是向右移出。
     如果是 pop，顶层元素向右移除。
     Enter: 从右移入。
     这是正确的。
  */
  position: absolute; /* 确保离开动画时不会把其他元素挤下去 */
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%; /* max-w-xl is in the component */
}
</style>
