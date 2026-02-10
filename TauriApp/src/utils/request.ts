/**
 * 请求工具类
 *
 * 包含可配置错误处理的网络请求包装器。
 */

interface RequestConfig extends RequestInit {
  showError?: boolean;
}

// 全局配置
export const requestConfig = {
  showError: true, // 默认：显示错误状态码的弹窗
};

/**
 * 带有错误处理和可选弹窗的基础 fetch 包装器
 * @param url 请求 URL
 * @param config 继承自 fetch RequestInit 的请求配置
 * @returns 响应 JSON 或 原始响应
 */
export async function request(url: string, config: RequestConfig = {}) {
  // 合并默认配置
  const { showError = requestConfig.showError, ...fetchConfig } = config;

  try {
    const response = await fetch(url, fetchConfig);

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      const errorMsg = `HTTP Error ${response.status}: ${errorText}`;

      if (showError) {
        // 使用 window.alert 弹窗
        alert(errorMsg);
      }

      throw new Error(errorMsg);
    }

    // 尝试解析 JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return response;
  } catch (err: any) {
    if (showError) {
      alert(`Network Error: ${err.message || "Unknown Error"}`);
    }
    throw err;
  }
}

/**
 * 更新全局请求配置
 * @param config 新的配置选项
 */
export function setRequestConfig(config: Partial<typeof requestConfig>) {
  Object.assign(requestConfig, config);
}
