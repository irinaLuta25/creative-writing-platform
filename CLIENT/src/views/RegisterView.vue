<template>
  <div class="center-page">
    <v-card max-width="520" width="100%">
      <v-card-title>Register</v-card-title>

      <v-card-text>
        <v-form @submit.prevent="onSubmit">
          <v-text-field
            v-model="displayName"
            label="Display name"
            :error-messages="errors.displayName"
            required
          />

          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            :error-messages="errors.email"
            required
          />

          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            :error-messages="errors.password"
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
            Register
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

const displayName = ref("");
const email = ref("");
const password = ref("");

const errors = reactive({
  displayName: [],
  email: [],
  password: []
});

function clearErrors() {
  errors.displayName = [];
  errors.email = [];
  errors.password = [];
}

function validate() {
  clearErrors();

  const dn = displayName.value.trim();
  if (!dn) errors.displayName = ["Display name is required"];
  else if (dn.length < 2 || dn.length > 40)
    errors.displayName = ["Display name must be between 2 and 40 characters"];

  const em = email.value.trim();
  if (!em) errors.email = ["Email is required"];
  else if (!/^\S+@\S+\.\S+$/.test(em)) errors.email = ["Please enter a valid email"];

  const pw = password.value;
  if (!pw) errors.password = ["Password is required"];
  else if (pw.length < 8) errors.password = ["Password must be at least 8 characters"];

  return (
    errors.displayName.length === 0 &&
    errors.email.length === 0 &&
    errors.password.length === 0
  );
}

async function onSubmit() {
  if (!validate()) return;

  auth.clearError();
  await auth.register({
    email: email.value.trim(),
    password: password.value,
    displayName: displayName.value.trim()
  });

  if (!auth.error) {
    router.push("/pieces");
  }
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
