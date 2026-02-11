# Task Flow

一款现代化、隐私优先的个人任务管理应用，基于 **Tauri v2** 和 **Vue 3** 构建。

[English](./README.en.md) | 中文

---

## ✨ 核心特性

### 📊 多视图支持

- **看板视图 (Board)**: 流畅的拖拽操作，支持自定义列和任务卡片
- **列表视图 (List)**: 树状结构展示任务层级关系
- **日历视图 (Calendar)**: 按日期组织任务，支持跨天任务显示
- **时间轴视图 (Timeline)**: 甘特图风格，可视化任务时间规划
- **总览视图 (Overview)**: 跨项目查看所有任务
- **已完成 (Completed)**: 归档已完成的任务
- **回收站 (Trash)**: 安全删除机制，支持恢复

### 🎯 任务管理

- **层级任务**: 支持无限层级的子任务嵌套
- **优先级系统**: 5 个优先级（紧急、高、中、低、可忽略），配色直观
- **智能标签**: 自定义颜色标签，快速分类任务
- **项目归类**: 多项目管理，支持拖拽排序
- **日期管理**: 开始日期、截止日期，支持跨天任务
- **富文本描述**: 基于 Markdown，支持代码高亮、列表、链接等
- **地理位置**: 支持添加任务位置信息

### 🎨 用户体验

- **拖拽交互**: 基于 SortableJS，支持任务、列、项目、标签的拖拽排序
- **右键菜单**: 快捷操作（设置优先级、移动到回收站、彻底删除）
- **全局快捷键**:
  - `Cmd/Ctrl + +/-/0`: 界面缩放/重置
  - `Cmd/Ctrl + K`: 全局搜索（支持模糊搜索）
- **暗色模式**: 自动适配系统主题
- **国际化 (i18n)**: 完整支持简体中文和 English
- **原生体验**:
  - macOS 原生窗口控制
  - 毛玻璃效果 (Blur)
  - 系统级集成

### 🔒 隐私与数据

- **本地优先**: 数据存储在本地，完全离线可用
- **云同步 (可选)**: 支持自定义云存储文件夹同步（iCloud、Dropbox 等）
- **数据导入/导出**: JSON 格式，方便备份和迁移
- **无追踪**: 不收集任何用户数据

### ⚡ 性能与技术

- **极速启动**: 基于 Rust (Tauri)，启动时间 < 1s
- **低内存占用**: 相比 Electron 减少 70% 内存使用
- **热重载**: 开发模式下支持实时预览
- **类型安全**: 全栈 TypeScript

---

## 🛠️ 技术栈

### 核心框架

- **[Tauri v2](https://tauri.app/)**: Rust 后端，提供原生性能和安全性
- **[Vue 3](https://vuejs.org/)**: 前端框架，使用 Composition API (Script Setup)
- **[Vite](https://vitejs.dev/)**: 极速构建工具

### 状态管理与路由

- **[Pinia](https://pinia.vuejs.org/)**: 轻量级状态管理
- **[pinia-plugin-persistedstate](https://github.com/prazdevs/pinia-plugin-persistedstate)**: 本地持久化
- **[Vue Router](https://router.vuejs.org/)**: 单页应用路由

### UI 与样式

- **[Tailwind CSS v4](https://tailwindcss.com/)**: 原子化 CSS 框架
- **[Lucide Vue Next](https://lucide.dev/)**: 现代化图标库
- **[SortableJS](https://sortablejs.github.io/Sortable/)**: 拖拽库（自定义封装兼容 macOS WebView）

### 功能增强

- **[vue-i18n](https://kazupon.github.io/vue-i18n/)**: 国际化
- **[markdown-it](https://github.com/markdown-it/markdown-it)**: Markdown 渲染
- **[highlight.js](https://highlightjs.org/)**: 代码高亮

---

## 📦 快速开始

### 前置要求

- **Node.js**: v18 或更高版本
- **Rust**: stable 版本 ([安装指南](https://www.rust-lang.org/tools/install))
- **pnpm**: 推荐使用 pnpm ([安装指南](https://pnpm.io/installation))

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/miyuesc/task-manager.git
cd task-manager/TauriApp

# 安装依赖
pnpm install
```

### 开发模式

启动带有热重载的开发环境：

```bash
pnpm tauri dev
```

应用将自动打开，修改代码后会实时刷新。

### 生产构建

构建优化后的应用程序安装包：

```bash
pnpm tauri build
```

构建产物位置：

- **macOS**: `src-tauri/target/release/bundle/dmg/Task Flow_2.0.0_aarch64.dmg`
- **Windows**: `src-tauri/target/release/bundle/msi/Task Flow_2.0.0_x64_en-US.msi`
- **Linux**: `src-tauri/target/release/bundle/appimage/task-flow_2.0.0_amd64.AppImage`

---

## 📂 项目结构

```
TauriApp/
├── src/                      # Vue 前端源码
│   ├── components/           # 组件
│   │   ├── board/           # 看板相关组件
│   │   ├── common/          # 通用组件
│   │   ├── layout/          # 布局组件
│   │   ├── task/            # 任务相关组件
│   │   └── ui/              # UI 基础组件
│   ├── composables/         # 组合式函数
│   ├── constants/           # 常量定义
│   ├── i18n/                # 国际化配置
│   ├── layouts/             # 页面布局
│   ├── router/              # 路由配置
│   ├── stores/              # Pinia 状态管理
│   │   ├── column.ts        # 看板列
│   │   ├── confirm.ts       # 确认对话框
│   │   ├── label.ts         # 标签
│   │   ├── project.ts       # 项目
│   │   ├── settings.ts      # 设置
│   │   ├── sync.ts          # 云同步
│   │   └── task.ts          # 任务
│   ├── utils/               # 工具函数
│   ├── views/               # 页面视图
│   │   ├── BoardView.vue    # 看板视图
│   │   ├── CalendarView.vue # 日历视图
│   │   ├── ListView.vue     # 列表视图
│   │   ├── OverviewView.vue # 总览视图
│   │   └── TimelineView.vue # 时间轴视图
│   ├── App.vue              # 根组件
│   ├── main.ts              # 入口文件
│   └── style.css            # 全局样式
├── src-tauri/               # Tauri 后端源码
│   ├── src/                 # Rust 源码
│   ├── icons/               # 应用图标
│   ├── Cargo.toml           # Rust 依赖配置
│   └── tauri.conf.json      # Tauri 配置
├── public/                  # 静态资源
├── index.html               # HTML 模板
├── package.json             # Node.js 依赖配置
├── tsconfig.json            # TypeScript 配置
├── vite.config.ts           # Vite 配置
└── versions.md              # 版本更新日志
```

---

## 🎯 核心功能详解

### 1. 看板视图 (Board View)

- **自定义列**: 创建、编辑、删除看板列
- **拖拽排序**: 任务在列之间拖拽移动
- **进度绑定**:
  - "Progressing" 视图可绑定多个看板列
  - "Completed" 视图可绑定一个看板列
  - 拖拽到绑定列自动更新任务状态
- **子任务拖拽**: 子任务可拖拽成为顶级任务
- **任务拖拽嵌套**: 任务拖拽到其他任务上可成为子任务

### 2. 列表视图 (List View)

- **树状结构**: 清晰展示任务层级关系
- **展开/折叠**: 支持任务树的展开和折叠
- **智能视图**:
  - **Today**: 今天到期的任务
  - **Upcoming**: 未来 7 天的任务
  - **Progressing**: 进行中的任务
  - **Completed**: 已完成的任务
  - **Trash**: 回收站

### 3. 日历视图 (Calendar View)

- **月视图**: 按月展示任务
- **跨天任务**: 支持开始日期和截止日期的任务显示为连续条
- **项目分组**: 按项目分组显示任务
- **子任务展开**: 支持展开查看子任务

### 4. 时间轴视图 (Timeline View)

- **甘特图**: 可视化任务时间规划
- **项目分组**: 按项目分组显示
- **子任务展开**: 支持展开查看有日期的子任务
- **横向滚动**: 使用 Shift + 滚轮横向滚动日期区域
- **未设置日期任务**: 底部显示所有未设置日期的任务

### 5. 云同步

- **自定义文件夹**: 选择任意云存储文件夹（iCloud、Dropbox、OneDrive 等）
- **自动同步**: 数据变更时自动保存到云文件夹
- **冲突处理**: 提供导入/覆盖选项
- **隐私保护**: 数据完全由用户控制

---

## 🌍 国际化

应用完整支持简体中文和 English，可在设置中切换。

### 添加新语言

1. 在 `src/i18n/locales/` 下创建新的语言文件（如 `ja.ts`）
2. 参考 `zh.ts` 或 `en.ts` 的结构翻译所有 key
3. 在 `src/i18n/index.ts` 中导入并注册新语言
4. 在 `src/stores/settings.ts` 中添加语言选项

---

## 🎨 自定义主题

应用使用 Tailwind CSS v4，支持自定义主题。

### 修改颜色

编辑 `src/style.css` 中的 CSS 变量：

```css
@theme {
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  /* ... */
}
```

### 暗色模式

应用自动适配系统主题，也可在设置中手动切换。

---

## 🚀 版本历史

### v2.0.0 (当前版本)

**重构**:

- 增加项目总览界面：支持四种视图模式（甘特图、看板、列表、时间轴）
- 重构原项目界面，只支持看板模式与列表模式
- 重构时间轴/甘特图页面：按项目分组，支持子任务展开
- 重构日历页面：按项目分组，支持子任务展开

**优化**:

- 减少任务详情卡片 header 的高度
- 优化下拉选择框宽度
- 优化 markdown 编辑器样式，支持插入本地文件引用
- Sidebar 增加横线分割线，支持收起/展开
- 增加全局 tooltip 组件
- 暗色模式下优化文字颜色
- 优先级增加"紧急"和"可忽略"状态

### v1.0.0

**优化**:

- 看板模式任务卡片记住子任务展开状态
- Sidebar 项目和标签支持拖拽排序
- 任务描述优化列表样式渲染、代码块高亮
- 甘特图视图下调整滚动条位置

**修复**:

- 任务卡片中进入子任务时无法选择日期
- 新建任务时无法同时创建子任务
- 阻止系统默认右键菜单
- 云同步文件写入错误
- 甘特图视图日期刻度时区问题

查看完整更新日志：[versions.md](./TauriApp/versions.md)

---

## 🤝 贡献指南

欢迎贡献代码、报告 Bug 或提出新功能建议！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m '新增: 某个很棒的功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### Commit 规范

使用中文提交信息，格式：`类型: 简短描述`

- `新增`: 新功能
- `修复`: Bug 修复
- `优化`: 性能或体验优化
- `重构`: 代码重构
- `移除`: 删除功能或代码

示例：

- ✅ `新增: 封面生成配置功能`
- ✅ `修复: 登录积分未到账`
- ✅ `优化: AI 测试页模型列表`

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情。

---

## 🙏 致谢

本项目使用了以下优秀的开源项目：

- [Tauri](https://tauri.app/) - 构建跨平台桌面应用
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Pinia](https://pinia.vuejs.org/) - Vue 状态管理
- [Lucide](https://lucide.dev/) - 精美的图标库
- [SortableJS](https://sortablejs.github.io/Sortable/) - 拖拽库

---

## 📮 联系方式

- **作者**: miyuefe
- **GitHub**: [@miyuesc](https://github.com/miyuesc)
- **项目地址**: [task-manager](https://github.com/miyuesc/task-manager)

---

<div align="center">
  <p>用 ❤️ 打造 | Powered by Tauri & Vue</p>
</div>
