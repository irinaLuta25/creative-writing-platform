<template>
  <div class="center-page">
    <v-card max-width="520" width="100%">
      <v-card-title>Login</v-card-title>

      <v-card-text>
        <v-form @submit.prevent="onSubmit">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            required
          />

          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            required
          />

          <v-alert v-if="auth.error" type="error" class="mt-3">
            {{ auth.error }}
          </v-alert>

          <v-btn
            class="mt-4"
            color="deep-purple-accent-4"
            type="submit"
            :loading="auth.loading"
            block
          >
            Login
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

const email = ref("");
const password = ref("");

async function onSubmit() {
  auth.clearError();
  await auth.login({ email: email.value, password: password.value });
  router.push("/pieces");
}
</script>

<style scoped>
.center-page {
  min-height: calc(100vh - 64px - 48px);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
