import { createRouter, createWebHistory } from "vue-router";
import { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/smart/today",
  },
  {
    path: "/smart/:id",
    name: "SmartView",
    component: () => import("../views/ListView.vue"), // Smart views are lists
  },
  {
    path: "/project/:id",
    redirect: (to) => `/project/${to.params.id}/board`,
    children: [
      {
        path: "board",
        name: "BoardView",
        component: () => import("../views/BoardView.vue"),
      },
      {
        path: "list",
        name: "ListView",
        component: () => import("../views/ListView.vue"),
      },
      {
        path: "calendar",
        name: "CalendarView",
        component: () => import("../views/CalendarView.vue"),
      },
      {
        path: "timeline",
        name: "TimelineView",
        component: () => import("../views/TimelineView.vue"),
      },
    ],
  },
  {
    path: "/label/:id",
    name: "LabelView",
    component: () => import("../views/ListView.vue"), // Label views are lists
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
