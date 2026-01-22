<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      Pieces
      <v-spacer />
      <v-btn variant="outlined" @click="load">Reload</v-btn>
    </v-card-title>

    <v-card-text>
      <v-alert v-if="error" type="error" class="mb-3">{{ error }}</v-alert>

      <v-progress-linear v-if="loading" indeterminate />

      <v-list v-else>
        <v-list-item
          v-for="p in pieces"
          :key="p.id"
          :to="`/pieces/${p.id}`"
        >
          <v-list-item-title>{{ p.title }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ p.author?.displayName || p.author?.email || "Unknown author" }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <div v-if="!loading && pieces.length === 0">No pieces yet.</div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from "vue";
import http from "../api/http";

const pieces = ref([]);
const loading = ref(false);
const error = ref("");

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await http.get("/piece");
    pieces.value = res.data;
  } catch (e) {
    error.value = e?.normalizedMessage || "Failed to load pieces";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
