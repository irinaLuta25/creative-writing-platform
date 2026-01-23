<template>
  <v-app>
    <v-app-bar
      elevation="2"
      height="64"
      class="app-bar"
    >
      <v-container class="d-flex align-center">
        <div class="brand" @click="$router.push('/pieces')">
          InkWell
        </div>

        <v-btn variant="text" to="/pieces" class="nav-btn">
          Pieces
        </v-btn>
        <v-btn variant="text" to="/challenges" class="nav-btn">
          Challenges
        </v-btn>

        <v-spacer />

        <template v-if="auth.isLoggedIn">
          <v-chip
            size="small"
            class="mr-3 user-chip"
            variant="outlined"
          >
            {{ auth.email }}
          </v-chip>

          <v-btn
            v-if="auth.isAdmin"
            variant="outlined"
            class="nav-btn"
            to="/challenges"
          >
            Admin
          </v-btn>

          <v-btn variant="text" class="nav-btn" @click="onLogout">
            Logout
          </v-btn>
        </template>

        <template v-else>
          <v-btn variant="text" class="nav-btn" to="/login">
            Login
          </v-btn>
          <v-btn
            variant="outlined"
            class="nav-btn register-btn"
            to="/register"
          >
            Register
          </v-btn>
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

<style scoped>
.app-bar {
  background: linear-gradient(
    90deg,
    #5e35b1,
    #7e57c2
  );
  color: white;
}

.brand {
  font-weight: 700;
  font-size: 1.2rem;
  margin-right: 24px;
  cursor: pointer;
  letter-spacing: 0.4px;
}

.nav-btn {
  color: white;
  text-transform: none;
  font-weight: 500;
}

.nav-btn:hover {
  background-color: rgba(255, 255, 255, 0.12);
}

.user-chip {
  color: white;
  border-color: rgba(255, 255, 255, 0.6);
}

.register-btn {
  border-color: white;
}
</style>
