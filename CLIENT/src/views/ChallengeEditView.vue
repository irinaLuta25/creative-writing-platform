<template>
  <v-card class="shell">
    <v-card-title>Edit Challenge</v-card-title>
    <v-card-text>
      <v-progress-linear v-if="loadingChallenge" indeterminate class="mb-4" />
      <v-alert v-if="loadError" type="error" class="mb-4">{{ loadError }}</v-alert>

      <ChallengeForm
        v-if="challenge"
        :modelValue="challenge"
        :loading="saving"
        :serverError="saveError"
        submitText="Save"
        @submit="save"
        @cancel="goBack"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "../api/http";
import ChallengeForm from "../components/ChallengeForm.vue";

const router = useRouter();
const route = useRoute();
const id = route.params.id;

const challenge = ref(null);
const loadingChallenge = ref(false);
const loadError = ref("");

const saving = ref(false);
const saveError = ref("");

function goBack() {
  router.push(`/challenges/${id}`);
}

async function load() {
  loadingChallenge.value = true;
  loadError.value = "";
  try {
    const res = await http.get(`/challenge/${id}`);
    challenge.value = res.data;
  } catch (e) {
    loadError.value = e?.normalizedMessage || "Failed to load challenge";
  } finally {
    loadingChallenge.value = false;
  }
}

async function save(payload) {
  saving.value = true;
  saveError.value = "";
  try {
    await http.put(`/challenge/${id}`, payload);
    router.push(`/challenges/${id}`);
  } catch (e) {
    saveError.value = e?.normalizedMessage || "Failed to save challenge";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.shell {
  border-radius: 18px;
}
</style>
