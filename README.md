# Task Flow

[English](#english) | [中文](#中文)

<a name="english"></a>

## 🚀 Task Flow (English)

**Task Flow** is a modern, privacy-first personal task management application built with **Tauri** and **Vue 3**. It offers a seamless experience on macOS (native feel), combining Kanban boards, list views, and a robust task management system.

### ✨ Features

- **Kanban Board**: Drag and drop tasks across columns with smooth animations.
- **Task Management**: Create, edit, delete, and prioritize tasks.
- **Subtasks**: Nest tasks and track progress.
- **Labels & Projects**: Organize tasks efficiently.
- **Views**: Kanban, List, Calendar (Upcoming), Timeline (Gantt - Planned), Completed, Trash.
- **Localization**: Full support for **English** and **Chinese (Simplified)**.
- **Theme**: Automatic Dark Mode support using Tailwind CSS.
- **Gestures**:
  - `Cmd/Ctrl + +/-/0`: Zoom in/out/reset interface.
  - Context Menu: Right-click on tasks for quick actions (Priority, Move to Trash, Delete Permanently).
- **Performance**: Lightweight and fast, built on Rust (Tauri).
- **Native Experience**: Native window controls, blur effects, and system integration.

### 🛠️ Tech Stack

- **Core**: [Tauri v2](https://tauri.app/) (Rust)
- **Frontend**: [Vue 3](https://vuejs.org/) (Script Setup) + [Vite](https://vitejs.dev/)
- **State Management**: [Pinia](https://pinia.vuejs.org/) + `pinia-plugin-persistedstate` (Local Persistence)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide Vue Next](https://lucide.dev/)
- **Drag & Drop**: [SortableJS](https://sortablejs.github.io/Sortable/)
- **I18n**: [vue-i18n](https://kazupon.github.io/vue-i18n/)

### 📦 Installation & Usage

#### Prerequisites

- Node.js (v18+)
- Rust (stable)
- pnpm (recommended)

#### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/task-manager.git
cd task-manager/TauriApp

# Install dependencies
pnpm install
```

#### Development

Run the app in development mode with hot reload:

```bash
pnpm tauri dev
```

#### Build for Production

Build the optimized application bundle (DMG for macOS):

```bash
pnpm tauri build
```

The output will be in `src-tauri/target/release/bundle/`.

---

<a name="中文"></a>

## 🚀 Task Flow (中文)

**Task Flow** 是一款基于 **Tauri** 和 **Vue 3** 构建的现代化、隐私优先的个人任务管理应用。它专为 macOS 设计（提供原生体验），集成了看板、列表视图以及强大的任务管理系统。

### ✨ 主要特点

- **看板视图 (Kanban)**：支持流畅的拖拽操作（基于 SortableJS），轻松在列之间移动任务。
- **任务管理**：创建、编辑、删除任务，设置优先级、截止日期和备注。
- **子任务支持**：支持任务嵌套与进度追踪。
- **标签与项目**：通过标签色彩和项目归类高效组织任务。
- **多视图支持**：包括看板、列表、日历（待办）、时间轴（规划中）、已完成和回收站视图。
- **国际化 (i18n)**：完全支持 **简体中文** 和 **English** 切换。
- **外观主题**：支持系统级暗色模式 (Dark Mode)，基于 Tailwind CSS。
- **快捷操作**：
  - `Cmd/Ctrl + +/-/0`：全局界面缩放/重置。
  - **右键菜单**：任务卡片支持右键快捷操作（设置优先级、移动到回收站、彻底删除）。
- **高性能**：基于 Rust (Tauri) 构建，轻量、极速。
- **原生体验**：深度集成的窗口控制、模糊特效与系统交互。

### 🛠️ 技术栈

- **核心框架**: [Tauri v2](https://tauri.app/) (Rust 后端)
- **前端框架**: [Vue 3](https://vuejs.org/) (Composition API) + [Vite](https://vitejs.dev/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/) + `pinia-plugin-persistedstate` (本地持久化)
- **样式方案**: [Tailwind CSS v4](https://tailwindcss.com/)
- **图标库**: [Lucide Vue Next](https://lucide.dev/)
- **拖拽库**: [SortableJS](https://sortablejs.github.io/Sortable/) (自定义封装兼容 macOS WebView)
- **国际化**: [vue-i18n](https://kazupon.github.io/vue-i18n/)

### 📦 安装与使用

#### 前置要求

- Node.js (v18+)
- Rust (stable)
- pnpm (推荐)

#### 初始化项目

```bash
# 克隆仓库
git clone https://github.com/your-username/task-manager.git
cd task-manager/TauriApp

# 安装依赖
pnpm install
```

#### 开发模式

启动带有热重载的开发环境：

```bash
pnpm tauri dev
```

#### 生产构建

构建优化后的应用程序安装包 (macOS DMG)：

```bash
pnpm tauri build
```

构建产物将生成在 `src-tauri/target/release/bundle/` 目录下。

### 📝 版本信息

当前版本：**v0.1.0**

---

This project was developed with ❤️ using Tauri & Vue.
