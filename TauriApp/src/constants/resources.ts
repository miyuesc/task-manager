/**
 * 任务优先级枚举定义
 */
export enum TaskPriority {
  NEGLIGIBLE = "negligible",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

/**
 * 系统颜色 ID 枚举
 */
export enum SystemColor {
  RED = "red",
  ORANGE = "orange",
  YELLOW = "yellow",
  GREEN = "green",
  BLUE = "blue",
  INDIGO = "indigo",
  PURPLE = "purple",
  PINK = "pink",
  GRAY = "gray",
  CYAN = "cyan",
  TEAL = "teal",
  AMBER = "amber",
}

/**
 * 优先级对应的颜色与样式配置
 */
export const PRIORITY_CONFIG = {
  [TaskPriority.NEGLIGIBLE]: {
    hex: "#94A3B8",
    bgClass:
      "bg-slate-100 text-slate-500 dark:bg-slate-900/30 dark:text-slate-400",
    barClass: "bg-slate-400/80 border border-slate-500",
    calendarClass:
      "bg-slate-500/10 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800/50",
    labelKey: "priority.negligible",
  },
  [TaskPriority.LOW]: {
    hex: "#10B981",
    bgClass:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    barClass: "bg-green-500/80 border border-green-600",
    calendarClass:
      "bg-green-500/10 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800/50",
    labelKey: "priority.low",
  },
  [TaskPriority.MEDIUM]: {
    hex: "#3B82F6",
    bgClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    barClass: "bg-blue-500/80 border border-blue-600",
    calendarClass:
      "bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/50",
    labelKey: "priority.medium",
  },
  [TaskPriority.HIGH]: {
    hex: "#EF4444",
    bgClass: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    barClass: "bg-red-500/80 border border-red-600",
    calendarClass:
      "bg-red-500/10 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/50",
    labelKey: "priority.high",
  },
  [TaskPriority.URGENT]: {
    hex: "#F97316",
    bgClass:
      "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    barClass: "bg-orange-500/80 border border-orange-600",
    calendarClass:
      "bg-orange-500/10 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800/50",
    labelKey: "priority.urgent",
  },
} as const;

/**
 * 项目与标签可用的系统颜色
 */
export const SYSTEM_COLORS = [
  { id: SystemColor.RED, hex: "#EF4444", bgClass: "bg-red-500" },
  { id: SystemColor.ORANGE, hex: "#F97316", bgClass: "bg-orange-500" },
  { id: SystemColor.AMBER, hex: "#F59E0B", bgClass: "bg-amber-500" },
  { id: SystemColor.YELLOW, hex: "#EAB308", bgClass: "bg-yellow-500" },
  { id: SystemColor.GREEN, hex: "#10B981", bgClass: "bg-emerald-500" },
  { id: SystemColor.TEAL, hex: "#14B8A6", bgClass: "bg-teal-500" },
  { id: SystemColor.CYAN, hex: "#06B6D4", bgClass: "bg-cyan-500" },
  { id: SystemColor.BLUE, hex: "#3B82F6", bgClass: "bg-blue-500" },
  { id: SystemColor.INDIGO, hex: "#6366F1", bgClass: "bg-indigo-500" },
  { id: SystemColor.PURPLE, hex: "#A855F7", bgClass: "bg-purple-500" },
  { id: SystemColor.PINK, hex: "#EC4899", bgClass: "bg-pink-500" },
  { id: SystemColor.GRAY, hex: "#6B7280", bgClass: "bg-gray-500" },
] as const;

/**
 * 颜色 ID 到 16 进制色的映射
 */
export const COLOR_MAP = SYSTEM_COLORS.reduce(
  (acc, current) => {
    acc[current.id] = current.hex;
    return acc;
  },
  {} as Record<string, string>,
);

/**
 * 颜色 ID 到 背景类名的映射
 */
export const COLOR_BG_MAP = SYSTEM_COLORS.reduce(
  (acc, current) => {
    acc[current.id] = current.bgClass;
    return acc;
  },
  {} as Record<string, string>,
);
