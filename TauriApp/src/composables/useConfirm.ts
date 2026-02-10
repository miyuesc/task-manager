import { useConfirmStore } from "@/stores/confirm";
import { useI18n } from "vue-i18n";

export function useConfirm() {
  const store = useConfirmStore();
  const { t } = useI18n(); // 国际化

  /**
   * 显示一个确认对话框，返回 Promise<boolean>
   * @param message 确认信息
   * @param title 可选标题
   * @param type 类型
   */
  async function confirm(
    message: string,
    title?: string,
    type: "info" | "warning" | "error" | "success" = "warning",
    confirmText?: string,
    cancelText?: string,
  ): Promise<boolean> {
    return store.show({
      message,
      title: title || t("common.confirm"),
      confirmText: confirmText || t("common.confirm"),
      cancelText: cancelText || t("common.cancel"),
      isAlert: false,
      type,
    });
  }

  /**
   * 显示警告弹窗，替代 alert
   * @param message 提示信息
   * @param title 可选标题
   */
  async function alert(
    message: string,
    title?: string,
    type: "info" | "warning" | "error" | "success" = "info",
  ): Promise<void> {
    // Alert 只关心确认，不关心返回值（总是返回 true），这里只等用户点击
    await store.show({
      message,
      title: title || t("common.alert"),
      confirmText: t("common.confirm"),
      isAlert: true,
      type,
    });
  }

  return {
    confirm,
    alert,
  };
}
