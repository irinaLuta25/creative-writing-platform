<template>
  <v-card class="shell">
    <v-card-title>Create Challenge</v-card-title>
    <v-card-text>
      <ChallengeForm
        :loading="loading"
        :serverError="serverError"
        submitText="Create"
        @submit="create"
        @cancel="goBack"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import http from "../api/http";
import ChallengeForm from "../components/ChallengeForm.vue";

const router = useRouter();
const loading = ref(false);
const serverError = ref("");

function goBack() {
  router.push("/challenges");
}

async function create(payload) {
  loading.value = true;
  serverError.value = "";
  try {
    const res = await http.post("/challenge", payload);
    const id = res.data?.id || res.data?.challengeId;
    router.push("/challenges");
  } catch (e) {
    serverError.value = e?.normalizedMessage || "Failed to create challenge";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.shell {
  border-radius: 18px;
}
</style>
