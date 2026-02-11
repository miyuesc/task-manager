# Task Flow

A modern, privacy-first personal task management application built with **Tauri v2** and **Vue 3**.

English | [中文](./README.md)

---

## ✨ Key Features

### 📊 Multiple Views

- **Board View**: Smooth drag-and-drop operations with custom columns and task cards
- **List View**: Tree structure displaying task hierarchy
- **Calendar View**: Organize tasks by date with multi-day task support
- **Timeline View**: Gantt chart style for visualizing task schedules
- **Overview View**: Cross-project task viewing
- **Completed**: Archive completed tasks
- **Trash**: Safe deletion mechanism with restore support

### 🎯 Task Management

- **Hierarchical Tasks**: Support for unlimited levels of subtask nesting
- **Priority System**: 5 priority levels (Urgent, High, Medium, Low, Ignorable) with intuitive colors
- **Smart Labels**: Custom color labels for quick task categorization
- **Project Organization**: Multi-project management with drag-and-drop sorting
- **Date Management**: Start date, due date, and multi-day task support
- **Rich Text Description**: Markdown-based with code highlighting, lists, links, etc.
- **Geolocation**: Support for adding task location information

### 🎨 User Experience

- **Drag & Drop**: Based on SortableJS, supports dragging tasks, columns, projects, and labels
- **Context Menu**: Quick actions (set priority, move to trash, permanent delete)
- **Global Shortcuts**:
  - `Cmd/Ctrl + +/-/0`: Zoom in/out/reset interface
  - `Cmd/Ctrl + K`: Global search (fuzzy search support)
- **Dark Mode**: Auto-adapts to system theme
- **Internationalization (i18n)**: Full support for Simplified Chinese and English
- **Native Experience**:
  - macOS native window controls
  - Blur effects
  - System-level integration

### 🔒 Privacy & Data

- **Local First**: Data stored locally, fully offline capable
- **Cloud Sync (Optional)**: Support for custom cloud storage folder sync (iCloud, Dropbox, etc.)
- **Data Import/Export**: JSON format for easy backup and migration
- **No Tracking**: No user data collection

### ⚡ Performance & Technology

- **Lightning Fast**: Built on Rust (Tauri), startup time < 1s
- **Low Memory**: 70% less memory usage compared to Electron
- **Hot Reload**: Real-time preview in development mode
- **Type Safe**: Full-stack TypeScript

---

## 🛠️ Tech Stack

### Core Framework

- **[Tauri v2](https://tauri.app/)**: Rust backend for native performance and security
- **[Vue 3](https://vuejs.org/)**: Frontend framework using Composition API (Script Setup)
- **[Vite](https://vitejs.dev/)**: Lightning-fast build tool

### State Management & Routing

- **[Pinia](https://pinia.vuejs.org/)**: Lightweight state management
- **[pinia-plugin-persistedstate](https://github.com/prazdevs/pinia-plugin-persistedstate)**: Local persistence
- **[Vue Router](https://router.vuejs.org/)**: Single-page application routing

### UI & Styling

- **[Tailwind CSS v4](https://tailwindcss.com/)**: Utility-first CSS framework
- **[Lucide Vue Next](https://lucide.dev/)**: Modern icon library
- **[SortableJS](https://sortablejs.github.io/Sortable/)**: Drag-and-drop library (custom wrapper for macOS WebView compatibility)

### Feature Enhancements

- **[vue-i18n](https://kazupon.github.io/vue-i18n/)**: Internationalization
- **[markdown-it](https://github.com/markdown-it/markdown-it)**: Markdown rendering
- **[highlight.js](https://highlightjs.org/)**: Code syntax highlighting

---

## 📦 Quick Start

### Prerequisites

- **Node.js**: v18 or higher
- **Rust**: stable version ([Installation Guide](https://www.rust-lang.org/tools/install))
- **pnpm**: Recommended ([Installation Guide](https://pnpm.io/installation))

### Install Dependencies

```bash
# Clone the repository
git clone https://github.com/miyuesc/task-manager.git
cd task-manager/TauriApp

# Install dependencies
pnpm install
```

### Development Mode

Start the development environment with hot reload:

```bash
pnpm tauri dev
```

The app will open automatically and refresh on code changes.

### Production Build

Build the optimized application bundle:

```bash
pnpm tauri build
```

Build artifacts location:

- **macOS**: `src-tauri/target/release/bundle/dmg/Task Flow_2.0.0_aarch64.dmg`
- **Windows**: `src-tauri/target/release/bundle/msi/Task Flow_2.0.0_x64_en-US.msi`
- **Linux**: `src-tauri/target/release/bundle/appimage/task-flow_2.0.0_amd64.AppImage`

---

## 📂 Project Structure

```
TauriApp/
├── src/                      # Vue frontend source
│   ├── components/           # Components
│   │   ├── board/           # Board-related components
│   │   ├── common/          # Common components
│   │   ├── layout/          # Layout components
│   │   ├── task/            # Task-related components
│   │   └── ui/              # UI base components
│   ├── composables/         # Composable functions
│   ├── constants/           # Constant definitions
│   ├── i18n/                # Internationalization config
│   ├── layouts/             # Page layouts
│   ├── router/              # Router configuration
│   ├── stores/              # Pinia state management
│   │   ├── column.ts        # Board columns
│   │   ├── confirm.ts       # Confirmation dialogs
│   │   ├── label.ts         # Labels
│   │   ├── project.ts       # Projects
│   │   ├── settings.ts      # Settings
│   │   ├── sync.ts          # Cloud sync
│   │   └── task.ts          # Tasks
│   ├── utils/               # Utility functions
│   ├── views/               # Page views
│   │   ├── BoardView.vue    # Board view
│   │   ├── CalendarView.vue # Calendar view
│   │   ├── ListView.vue     # List view
│   │   ├── OverviewView.vue # Overview view
│   │   └── TimelineView.vue # Timeline view
│   ├── App.vue              # Root component
│   ├── main.ts              # Entry file
│   └── style.css            # Global styles
├── src-tauri/               # Tauri backend source
│   ├── src/                 # Rust source
│   ├── icons/               # App icons
│   ├── Cargo.toml           # Rust dependencies
│   └── tauri.conf.json      # Tauri configuration
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Node.js dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── versions.md              # Version changelog
```

---

## 🎯 Core Features Explained

### 1. Board View

- **Custom Columns**: Create, edit, and delete board columns
- **Drag & Drop**: Move tasks between columns
- **Progress Binding**:
  - "Progressing" view can bind to multiple board columns
  - "Completed" view can bind to one board column
  - Dragging to bound columns auto-updates task status
- **Subtask Dragging**: Subtasks can be dragged to become top-level tasks
- **Task Nesting**: Drag tasks onto other tasks to create subtasks

### 2. List View

- **Tree Structure**: Clear display of task hierarchy
- **Expand/Collapse**: Support for expanding and collapsing task trees
- **Smart Views**:
  - **Today**: Tasks due today
  - **Upcoming**: Tasks due in the next 7 days
  - **Progressing**: Tasks in progress
  - **Completed**: Completed tasks
  - **Trash**: Recycle bin

### 3. Calendar View

- **Month View**: Display tasks by month
- **Multi-day Tasks**: Tasks with start and due dates shown as continuous bars
- **Project Grouping**: Display tasks grouped by project
- **Subtask Expansion**: Support for expanding to view subtasks

### 4. Timeline View

- **Gantt Chart**: Visualize task schedules
- **Project Grouping**: Display grouped by project
- **Subtask Expansion**: Support for expanding to view subtasks with dates
- **Horizontal Scrolling**: Use Shift + scroll wheel to scroll date region horizontally
- **Undated Tasks**: Display all undated tasks at the bottom

### 5. Cloud Sync

- **Custom Folder**: Choose any cloud storage folder (iCloud, Dropbox, OneDrive, etc.)
- **Auto Sync**: Automatically save to cloud folder on data changes
- **Conflict Handling**: Provides import/overwrite options
- **Privacy Protection**: Data fully controlled by user

---

## 🌍 Internationalization

The app fully supports Simplified Chinese and English, switchable in settings.

### Adding a New Language

1. Create a new language file in `src/i18n/locales/` (e.g., `ja.ts`)
2. Translate all keys following the structure of `zh.ts` or `en.ts`
3. Import and register the new language in `src/i18n/index.ts`
4. Add language option in `src/stores/settings.ts`

---

## 🎨 Custom Themes

The app uses Tailwind CSS v4 and supports custom themes.

### Modify Colors

Edit CSS variables in `src/style.css`:

```css
@theme {
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  /* ... */
}
```

### Dark Mode

The app auto-adapts to system theme, or you can manually switch in settings.

---

## 🚀 Version History

### v2.0.0 (Current)

**Refactoring**:

- Added project overview interface: supports four view modes (Gantt, Board, List, Timeline)
- Refactored original project interface to support only Board and List modes
- Refactored Timeline/Gantt page: grouped by project, supports subtask expansion
- Refactored Calendar page: grouped by project, supports subtask expansion

**Optimizations**:

- Reduced task detail card header height
- Optimized dropdown width
- Optimized markdown editor styles, supports local file reference insertion
- Added horizontal dividers in Sidebar with expand/collapse support
- Added global tooltip component
- Optimized text colors in dark mode
- Added "Urgent" and "Ignorable" priority states

### v1.0.0

**Optimizations**:

- Board mode task cards remember subtask expansion state
- Sidebar projects and labels support drag-and-drop sorting
- Task description optimized with list style rendering and code highlighting
- Adjusted scrollbar position in Gantt view

**Fixes**:

- Cannot select dates when entering subtasks in task cards
- Cannot create subtasks simultaneously when creating new tasks
- Prevent system default context menu
- Cloud sync file write error
- Gantt view date scale timezone issue

View full changelog: [versions.md](./TauriApp/versions.md)

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!

### Development Workflow

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add: Some amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Submit a Pull Request

### Commit Convention

Use descriptive commit messages in the format: `Type: Brief description`

- `Add`: New feature
- `Fix`: Bug fix
- `Optimize`: Performance or UX optimization
- `Refactor`: Code refactoring
- `Remove`: Remove feature or code

Examples:

- ✅ `Add: Cover generation config feature`
- ✅ `Fix: Login points not credited`
- ✅ `Optimize: AI test page model list`

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

This project uses the following excellent open-source projects:

- [Tauri](https://tauri.app/) - Build cross-platform desktop apps
- [Vue.js](https://vuejs.org/) - Progressive JavaScript framework
- [Vite](https://vitejs.dev/) - Next-generation frontend build tool
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Pinia](https://pinia.vuejs.org/) - Vue state management
- [Lucide](https://lucide.dev/) - Beautiful icon library
- [SortableJS](https://sortablejs.github.io/Sortable/) - Drag-and-drop library

---

## 📮 Contact

- **Author**: miyuefe
- **GitHub**: [@miyuesc](https://github.com/miyuesc)
- **Project**: [task-manager](https://github.com/miyuesc/task-manager)

---

<div align="center">
  <p>Built with ❤️ | Powered by Tauri & Vue</p>
</div>
