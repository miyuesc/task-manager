import { defineStore } from "pinia";
import { ref } from "vue";
import { SYSTEM_COLORS } from "@/constants/resources";

export interface Label {
  id: string;
  name: string;
  color: string;
}

const COLORS = SYSTEM_COLORS.map((c) => c.id);

export const useLabelStore = defineStore(
  "labels",
  () => {
    const labels = ref<Label[]>([]);

    function addLabel(name: string, color?: string) {
      const id = `label-${Date.now()}`;
      const labelColor = color || COLORS[labels.value.length % COLORS.length];
      labels.value.push({
        id,
        name,
        color: labelColor,
      });
      return id;
    }

    function updateLabel(id: string, updates: Partial<Label>) {
      const index = labels.value.findIndex((l) => l.id === id);
      if (index !== -1) {
        labels.value[index] = { ...labels.value[index], ...updates };
      }
    }

    function deleteLabel(id: string) {
      const index = labels.value.findIndex((l) => l.id === id);
      if (index !== -1) {
        labels.value.splice(index, 1);
      }
    }

    function getLabel(id: string) {
      return labels.value.find((l) => l.id === id);
    }

    function reorderLabels(newOrderIds: string[]) {
      const reordered = newOrderIds
        .map((id) => labels.value.find((l) => l.id === id))
        .filter((l): l is Label => !!l);
      if (reordered.length === labels.value.length) {
        labels.value = reordered;
      }
    }

    return {
      labels,
      addLabel,
      updateLabel,
      deleteLabel,
      getLabel,
      reorderLabels,
    };
  },
  {
    persist: true,
  },
);
