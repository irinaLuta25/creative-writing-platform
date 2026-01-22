<!-- src/components/AppShell.vue -->
<template>
  <v-app>
    <v-app-bar flat>
      <v-container class="d-flex align-center">
        <v-btn variant="text" to="/pieces">Pieces</v-btn>
        <v-btn variant="text" to="/challenges">Challenges</v-btn>

        <v-spacer />

        <template v-if="auth.isLoggedIn">
          <v-chip class="mr-3" size="small" variant="outlined">
            {{ auth.email }}
          </v-chip>

          <v-btn variant="text" to="/pieces/new">New Piece</v-btn>

          <v-btn
            v-if="auth.isAdmin"
            variant="text"
            color="primary"
            to="/challenges"
          >
            Admin
          </v-btn>

          <v-btn variant="text" @click="onLogout">Logout</v-btn>
        </template>

        <template v-else>
          <v-btn variant="text" to="/login">Login</v-btn>
          <v-btn variant="text" to="/register">Register</v-btn>
        </template>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container class="py-6">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

function onLogout() {
  auth.logout();
  router.push("/login");
}
</script>