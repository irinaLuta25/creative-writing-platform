<template>
  <v-app>
    <v-app-bar elevation="2" height="64" class="app-bar" color="transparent">
      <v-container class="d-flex align-center navbar">
        <div class="brand" @click="$router.push('/pieces')">
          InkWell
        </div>

        <div class="desktop-nav">
          <v-btn variant="text" to="/pieces" class="nav-btn">Pieces</v-btn>
          <v-btn variant="text" to="/challenges" class="nav-btn">Challenges</v-btn>

          <v-spacer />

          <template v-if="auth.isLoggedIn">
            <v-chip size="small" class="mr-3 user-chip" variant="outlined">
              {{ auth.email }}
            </v-chip>
            <v-btn variant="text" class="nav-btn" @click="onLogout">Logout</v-btn>
          </template>

          <template v-else>
            <v-btn variant="text" class="nav-btn" to="/login">Login</v-btn>
            <v-btn
              variant="outlined"
              class="nav-btn register-btn ml-2"
              to="/register"
            >
              Register
            </v-btn>
          </template>
        </div>

        <div class="mobile-nav">
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text" class="nav-btn">
                <v-icon>mdi-dots-vertical</v-icon>
              </v-btn>
            </template>

            <v-list density="compact" class="menu-list">
              <v-list-item title="Pieces" to="/pieces" />
              <v-list-item title="Challenges" to="/challenges" />

              <v-divider class="my-1" />

              <template v-if="auth.isLoggedIn">
                <v-list-item class="email-item" :ripple="false">
                  <v-list-item-title class="email-text">
                    {{ auth.email }}
                  </v-list-item-title>
                </v-list-item>

                <v-list-item title="Logout" @click="onLogout" />
              </template>

              <template v-else>
                <v-list-item title="Login" to="/login" />
                <v-list-item title="Register" to="/register" />
              </template>
            </v-list>
          </v-menu>
        </div>
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
  background: linear-gradient(90deg, #5e35b1, #7e57c2) !important;
  color: white;
}

.navbar {
  padding-left: 12px;
  padding-right: 12px;
}

.brand {
  font-weight: 700;
  font-size: 1.2rem;
  cursor: pointer;
  letter-spacing: 0.4px;
  margin-right: 24px;
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

.desktop-nav {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.mobile-nav {
  display: none;
}

.menu-list {
  min-width: 200px;
}

.email-item {
  cursor: default;
  opacity: 0.8;
}

.email-text {
  font-size: 0.9rem;
}

@media (max-width: 600px) {
  .desktop-nav {
    display: none;
  }
  .mobile-nav {
    display: inline-flex;
    margin-left: auto;
  }
  .brand {
    margin-right: 0;
    font-size: 1.05rem;
  }
}
</style>
