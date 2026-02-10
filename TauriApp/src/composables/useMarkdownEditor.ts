import { type Ref, nextTick } from "vue";

/**
 * Markdown 编辑器核心逻辑 Hook
 * 负责处理文本插入、快捷键截获以及光标定位
 *
 * @param textareaRef - textarea DOM 元素的引用
 * @param emit - Vue 组件的 emit 函数，用于更新 v-model
 * @param props - 组件 props，主要用于获取当前 modelValue
 */
export function useMarkdownEditor(
  textareaRef: Ref<HTMLTextAreaElement | null>,
  emit: (event: "update:modelValue", ...args: any[]) => void,
  props: { modelValue: string },
) {
  /**
   * 插入格式化文本（通用方法）
   * @param type - 格式类型: 'bold' | 'italic' | 'heading' | 'link' | 'code' | 'list'
   */
  function insertFormat(type: string) {
    const textarea = textareaRef.value;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = props.modelValue || "";
    const selected = text.substring(start, end);

    let insert = "";
    let cursorOffset = 0;

    switch (type) {
      case "bold":
        insert = `**${selected || "粗体文本"}**`;
        cursorOffset = selected ? insert.length : 2;
        break;
      case "italic":
        insert = `*${selected || "斜体文本"}*`;
        cursorOffset = selected ? insert.length : 1;
        break;
      case "heading":
        insert = `\n## ${selected || "标题"}\n`;
        cursorOffset = selected ? insert.length : 4;
        break;
      case "link":
        insert = `[${selected || "链接文本"}](url)`;
        cursorOffset = selected ? insert.length : 1;
        break;
      case "code":
        insert = selected.includes("\n")
          ? `\n\`\`\`\n${selected || "代码"}\n\`\`\`\n`
          : `\`${selected || "代码"}\``;
        cursorOffset = selected ? insert.length : 1;
        break;
      case "list":
        insert = `\n- ${selected || "列表项"}`;
        cursorOffset = insert.length;
        break;
    }

    const newText = text.substring(0, start) + insert + text.substring(end);
    emit("update:modelValue", newText);

    // 恢复焦点并定位光标
    nextTick(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    });
  }

  /**
   * 插入图片逻辑
   * 会创建一个隐藏的 file input 来选择图片
   */
  function insertImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const url = URL.createObjectURL(file);
        const insert = `![${file.name}](${url})`;
        const textarea = textareaRef.value;
        if (textarea) {
          const start = textarea.selectionStart;
          const text = props.modelValue || "";
          const newText =
            text.substring(0, start) + insert + text.substring(start);
          emit("update:modelValue", newText);
        }
      }
    };
    input.click();
  }

  /**
   * 处理键盘快捷键
   * 支持 Ctrl/Cmd + B (粗体), I (斜体), K (链接)
   */
  function handleKeydown(e: KeyboardEvent) {
    const isMod = e.metaKey || e.ctrlKey;

    if (isMod) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault();
          insertFormat("bold");
          break;
        case "i":
          e.preventDefault();
          insertFormat("italic");
          break;
        case "k":
          e.preventDefault();
          insertFormat("link");
          break;
      }
    }
  }

  // 暴露配置完毕的 marked 实例供预览使用
  // 注意：这里仅返回配置，如果在多个组件使用可能会重复配置
  // 建议在 main.ts 或独立文件中配置 marked，这里仅作为 fallback

  return {
    insertFormat,
    insertImage,
    handleKeydown,
  };
}
