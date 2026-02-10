import { defineStore } from "pinia";
import { ref } from "vue";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "info" | "warning" | "error" | "success"; // 用于控制图标或颜色
  isAlert?: boolean; // 如果是 true，则只显示确认按钮（替代 alert）
}

export const useConfirmStore = defineStore("confirm", () => {
  const isVisible = ref(false);
  const options = ref<ConfirmOptions>({
    message: "",
    title: "",
    type: "warning",
  });

  // 存储 Promise 的 resolve 函数
  const resolvePromise = ref<((value: boolean) => void) | null>(null);

  function show(opts: ConfirmOptions): Promise<boolean> {
    options.value = {
      title: "确认", // 默认标题
      confirmText: "确定",
      cancelText: "取消",
      type: "warning",
      isAlert: false,
      ...opts,
    };
    isVisible.value = true;

    return new Promise((resolve) => {
      resolvePromise.value = resolve;
    });
  }

  function confirm() {
    isVisible.value = false;
    if (resolvePromise.value) {
      resolvePromise.value(true);
      resolvePromise.value = null;
    }
  }

  function cancel() {
    isVisible.value = false;
    if (resolvePromise.value) {
      resolvePromise.value(false);
      resolvePromise.value = null;
    }
  }

  return {
    isVisible,
    options,
    show,
    confirm,
    cancel,
  };
});
