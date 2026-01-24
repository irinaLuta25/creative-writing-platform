<template>
  <v-card class="shell" elevation="2">
    <v-card-title class="d-flex align-center">
      <div>
        <div class="text-h6">{{ challenge?.title }}</div>
        <div class="subtitle" v-if="challenge">
          <span>{{ formatDateEn(challenge.metadata?.createdAt) }}</span>
          <span class="dot">•</span>
          <span>{{ challenge.prompt?.constraints?.maxWords || 0 }} words max</span>
          <span class="dot">•</span>
          <span>{{ challenge.prompt?.constraints?.language || "" }}</span>
        </div>
      </div>

      <v-spacer />

      <template v-if="auth.isAdmin">
        <v-btn variant="outlined" class="mr-2" :to="`/challenges/${id}/edit`">
          Edit
        </v-btn>
        <v-btn color="error" variant="outlined" @click="confirmDelete = true">
          Delete
        </v-btn>
      </template>
    </v-card-title>

    <v-card-text>
      <v-progress-linear v-if="loading" indeterminate class="mb-4" />
      <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

      <div v-if="challenge">
        <div class="prompt">
          {{ challenge.prompt?.text || "" }}
        </div>

        <div class="tags" v-if="(challenge.prompt?.tags || []).length">
          <v-chip
            v-for="t in challenge.prompt.tags"
            :key="t"
            size="x-small"
            variant="outlined"
            color="deep-purple-accent-2"
            class="mr-1 mb-1"
          >
            #{{ t }}
          </v-chip>
        </div>
      </div>
    </v-card-text>
  </v-card>

  <v-dialog v-model="confirmDelete" max-width="420">
    <v-card>
      <v-card-title>Delete challenge?</v-card-title>
      <v-card-text>This cannot be undone.</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="confirmDelete = false">Cancel</v-btn>
        <v-btn color="error" :loading="deleting" @click="deleteConfirmed">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "../api/http";
import { useAuthStore } from "../stores/auth";
import { formatDateEn } from "../utils/date";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const id = route.params.id;

const challenge = ref(null);
const loading = ref(false);
const error = ref("");

const confirmDelete = ref(false);
const deleting = ref(false);

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await http.get(`/challenge/${id}`);
    challenge.value = res.data;
  } catch (e) {
    error.value = e?.normalizedMessage || "Failed to load challenge";
  } finally {
    loading.value = false;
  }
}

async function deleteConfirmed() {
  deleting.value = true;
  error.value = "";
  try {
    await http.delete(`/challenge/${id}`);
    router.push("/challenges");
  } catch (e) {
    error.value = e?.normalizedMessage || "Failed to delete challenge";
  } finally {
    deleting.value = false;
    confirmDelete.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.shell {
  border-radius: 18px;
}

.subtitle {
  display: flex;
  gap: 6px;
  font-size: 0.85rem;
  opacity: 0.75;
}

.dot {
  margin: 0 4px;
}

.prompt {
  font-size: 1rem;
  line-height: 1.7;
  white-space: pre-wrap;
  margin-bottom: 16px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
}
</style>
