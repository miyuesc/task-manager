import { marked } from "marked";
import hljs from "highlight.js";

/**
 * 配置并返回 marked 实例
 * 包含代码高亮 (highlight.js) 和 GFM 支持
 */
export function configureMarked() {
  // 配置 marked 使用代码高亮
  marked.use({
    breaks: true,
    gfm: true,
  });

  // 自定义 Renderer 以支持 highlight.js
  const renderer = new marked.Renderer();
  renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
    const language = lang || "";
    const validLang = hljs.getLanguage(language) ? language : "plaintext";
    const highlighted = hljs.highlight(text, { language: validLang }).value;
    return `<pre><code class="hljs language-${validLang}">${highlighted}</code></pre>`;
  };

  marked.use({ renderer });

  return marked;
}

// 导出单例或直接导出 marked
export const markdownParser = configureMarked();
