import { defineStore } from "pinia";
import { ref } from "vue";

export interface Column {
  id: string;
  name: string;
  order: number;
}

export const useColumnStore = defineStore(
  "columns",
  () => {
    const columns = ref<Column[]>([]);

    // Progressing 视图关联的状态列 ID
    const progressingColumnIds = ref<string[]>([]);

    // 已完成视图关联的状态列 ID (单选)
    const completedColumnId = ref<string>("done");

    function addColumn(name: string) {
      const id = `col-${Date.now()}`;
      const maxOrder = columns.value.reduce(
        (max, c) => Math.max(max, c.order),
        -1,
      );
      columns.value.push({
        id,
        name,
        order: maxOrder + 1,
      });
      return id;
    }

    function updateColumn(id: string, updates: Partial<Column>) {
      const index = columns.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        columns.value[index] = { ...columns.value[index], ...updates };
      }
    }

    function deleteColumn(id: string) {
      const index = columns.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        columns.value.splice(index, 1);
        // 从 Progressing 关联中移除
        const pIndex = progressingColumnIds.value.indexOf(id);
        if (pIndex !== -1) {
          progressingColumnIds.value.splice(pIndex, 1);
        }
      }
    }

    function reorderColumns(columnIds: string[]) {
      columnIds.forEach((id, index) => {
        const column = columns.value.find((c) => c.id === id);
        if (column) {
          column.order = index;
        }
      });
      // 按 order 排序
      columns.value.sort((a, b) => a.order - b.order);
    }

    function setProgressingColumns(columnIds: string[]) {
      progressingColumnIds.value = columnIds;
    }

    function toggleProgressingColumn(columnId: string) {
      // 如果该列是已完成列，禁止设为进行中
      if (columnId === completedColumnId.value) return;

      const index = progressingColumnIds.value.indexOf(columnId);
      if (index !== -1) {
        progressingColumnIds.value.splice(index, 1);
      } else {
        progressingColumnIds.value.push(columnId);
      }
    }

    function setCompletedColumnId(id: string) {
      if (completedColumnId.value === id) return;

      completedColumnId.value = id;
      // 如果该列在进行中，移除它
      const pIndex = progressingColumnIds.value.indexOf(id);
      if (pIndex !== -1) {
        progressingColumnIds.value.splice(pIndex, 1);
      }
    }

    return {
      columns,
      progressingColumnIds,
      completedColumnId,
      addColumn,
      updateColumn,
      deleteColumn,
      reorderColumns,
      setProgressingColumns,
      toggleProgressingColumn,
      setCompletedColumnId,
    };
  },
  {
    persist: true,
  },
);
