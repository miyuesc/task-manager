import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile, exists } from "@tauri-apps/plugin-fs";
import { useTaskStore } from "./task";
import { useProjectStore } from "./project";
import { useColumnStore } from "./column";
import { useLabelStore } from "./label";

export const useSyncStore = defineStore(
  "sync",
  () => {
    const syncPath = ref<string | null>(null);
    const lastSyncTime = ref<string | null>(null);
    const isSyncing = ref(false);
    const syncError = ref<string | null>(null);

    // Stores references
    const taskStore = useTaskStore();
    const projectStore = useProjectStore();
    const columnStore = useColumnStore();
    const labelStore = useLabelStore();

    // Select Sync Folder
    async function selectSyncFolder() {
      try {
        const selected = await open({
          directory: true,
          multiple: false,
          title: "Select Cloud Sync Folder (iCloud/OneDrive/etc)",
        });

        if (selected && typeof selected === "string") {
          syncPath.value = selected;
          // Try to load existing data or save current data
          await initSync();
        }
      } catch (error) {
        console.error("Failed to select sync folder:", error);
        syncError.value = String(error);
      }
    }

    // Initialize Sync
    async function initSync() {
      if (!syncPath.value) return;

      const dataFile = `${syncPath.value}/task-manager-data.json`;

      try {
        // Check if file exists
        // Note: exists() might need scope permissions
        const fileExists = await exists(dataFile);

        if (fileExists) {
          // Read and potentially load
          const content = await readTextFile(dataFile);
          const data = JSON.parse(content);

          // Simple conflict resolution: if remote is newer (by timestamp?), load it.
          // For MVP, we'll ask user or auto-load if local is empty-ish?
          // Let's just load it for now to sync state.
          loadData(data);
        } else {
          // Save current data to initialize file
          await syncData();
        }
      } catch (e) {
        console.error("Sync Init Error:", e);
        // If read failed, maybe it doesn't exist or permission denied.
        // Try writing.
        await syncData();
      }

      // Start watching for changes
      startAutoSync();
    }

    // Load Data into Stores
    function loadData(data: any) {
      if (!data) return;

      // We might want to be more careful here and merge, but replacing is safer for consistency
      if (data.tasks) taskStore.tasks = data.tasks;
      if (data.projects) projectStore.projects = data.projects;
      if (data.columns) {
        columnStore.columns = data.columns;
        if (data.progressingColumnIds)
          columnStore.progressingColumnIds = data.progressingColumnIds;
        if (data.completedColumnId)
          columnStore.completedColumnId = data.completedColumnId;
      }
      if (data.labels) labelStore.labels = data.labels;
      // Settings - optional to sync
      // if (data.settings) ...

      lastSyncTime.value = new Date().toISOString();
    }

    // Gather Data
    function getAllData() {
      return {
        timestamp: new Date().toISOString(),
        tasks: taskStore.tasks,
        projects: projectStore.projects,
        columns: columnStore.columns,
        progressingColumnIds: columnStore.progressingColumnIds,
        completedColumnId: columnStore.completedColumnId,
        labels: labelStore.labels,
        // settings: ...
      };
    }

    // Write Data to File
    async function syncData() {
      if (!syncPath.value || isSyncing.value) return;

      isSyncing.value = true;
      syncError.value = null;

      try {
        const data = getAllData();
        const content = JSON.stringify(data, null, 2);
        const dataFile = `${syncPath.value}/task-manager-data.json`;

        await writeTextFile(dataFile, content);
        lastSyncTime.value = data.timestamp;
      } catch (e) {
        console.error("Sync Write Error:", e);
        syncError.value = "Failed to write sync file";
      } finally {
        isSyncing.value = false;
      }
    }

    // Auto Sync Watcher
    let watcher: any = null;
    function startAutoSync() {
      if (watcher) return;

      watcher = watch(
        [
          () => taskStore.tasks,
          () => projectStore.projects,
          () => columnStore.columns,
          () => labelStore.labels,
        ],
        () => {
          // Debounce logic could be added here
          syncData();
        },
        { deep: true },
      );
    }

    // Manual Trigger
    function forceSync() {
      syncData();
    }

    // Stop Sync (e.g. invalid path)
    function stopSync() {
      if (watcher) {
        watcher(); // unwatch
        watcher = null;
      }
      syncPath.value = null;
    }

    return {
      syncPath,
      lastSyncTime,
      isSyncing,
      syncError,
      selectSyncFolder,
      initSync,
      forceSync,
      stopSync,
    };
  },
  {
    persist: true,
  },
);
