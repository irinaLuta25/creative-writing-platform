import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import PiecesListView from "../views/PiecesListView.vue";
import PieceCreateView from "../views/PieceCreateView.vue";
import PieceEditView from "../views/PieceEditView.vue";
import PieceDetailView from "../views/PieceDetailView.vue";
import ChallengesView from "../views/ChallengesView.vue";

const routes = [
  { path: "/", redirect: "/pieces" },

  { path: "/login", component: LoginView, meta: { guestOnly: true } },
  { path: "/register", component: RegisterView, meta: { guestOnly: true } },

  { path: "/pieces", component: PiecesListView },
  { path: "/pieces/new", component: PieceCreateView, meta: { requiresAuth: true } },
  { path: "/pieces/:id", component: PieceDetailView, props: true },
  { path: "/pieces/:id/edit", component: PieceEditView, meta: { requiresAuth: true }, props: true },

  { path: "/challenges", component: ChallengesView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.guestOnly && auth.isLoggedIn) {
    return "/pieces";
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return "/login";
  }

  if (to.meta.adminOnly && !auth.isAdmin) {
    return "/pieces";
  }
});

export default router;
