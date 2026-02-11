import { defineStore } from "pinia";
import { ref } from "vue";
import { SYSTEM_COLORS } from "@/constants/resources";

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

const COLORS = SYSTEM_COLORS.map((c) => c.id);

export const useProjectStore = defineStore(
  "projects",
  () => {
    const projects = ref<Project[]>([]);

    const activeProjectId = ref<string | null>(null);

    function addProject(name: string, color?: string) {
      const id = `proj-${Date.now()}`;
      const projectColor =
        color || COLORS[projects.value.length % COLORS.length];
      projects.value.push({
        id,
        name,
        color: projectColor,
      });
      return id;
    }

    function updateProject(id: string, updates: Partial<Project>) {
      const index = projects.value.findIndex((p) => p.id === id);
      if (index !== -1) {
        projects.value[index] = { ...projects.value[index], ...updates };
      }
    }

    function deleteProject(id: string) {
      const index = projects.value.findIndex((p) => p.id === id);
      if (index !== -1) {
        projects.value.splice(index, 1);
      }
    }

    function getProject(id: string) {
      return projects.value.find((p) => p.id === id);
    }

    function reorderProjects(newOrderIds: string[]) {
      const reordered = newOrderIds
        .map((id) => projects.value.find((p) => p.id === id))
        .filter((p): p is Project => !!p);
      if (reordered.length === projects.value.length) {
        projects.value = reordered;
      }
    }

    return {
      projects,
      activeProjectId,
      addProject,
      updateProject,
      deleteProject,
      getProject,
      reorderProjects,
    };
  },
  {
    persist: true,
  },
);
