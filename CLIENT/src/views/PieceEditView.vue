<template>
  <v-card>
    <v-card-title>Edit Piece</v-card-title>

    <v-card-text>
      <v-progress-linear v-if="loadingPiece" indeterminate class="mb-4" />

      <v-alert v-if="loadError" type="error" class="mb-4">
        {{ loadError }}
      </v-alert>

      <PieceForm
        v-if="piece"
        :genres="genres"
        :modelValue="piece"
        :loading="saving"
        :serverError="serverError"
        submitText="Update"
        @submit="update"
        @cancel="goBack"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "../api/http";
import PieceForm from "../components/PieceForm.vue";

const route = useRoute();
const router = useRouter();
const id = route.params.id;

const piece = ref(null);
const loadingPiece = ref(false);
const loadError = ref("");
const saving = ref(false);
const serverError = ref("");

const genres = [
  { id: "genre_general", name: "General" },
  { id: "genre_fantasy", name: "Fantasy" },
  { id: "genre_scifi", name: "Sci-Fi" },
  { id: "genre_romance", name: "Romance" },
  { id: "genre_horror", name: "Horror" },
  { id: "genre_poetry", name: "Poetry" },
  { id: "genre_drama", name: "Drama" },
  { id: "genre_mystery", name: "Mystery" }
];

function goBack() {
  router.push(`/pieces/${id}`);
}

async function load() {
  loadingPiece.value = true;
  loadError.value = "";
  try {
    const res = await http.get(`/piece/${id}`);
    piece.value = res.data;
  } catch (e) {
    loadError.value = e?.normalizedMessage || "Failed to load piece";
  } finally {
    loadingPiece.value = false;
  }
}

async function update(payload) {
  saving.value = true;
  serverError.value = "";
  try {
    const res = await http.put(`/piece/${id}`, payload);
    router.push(`/pieces/${res.data?.id || id}`);
  } catch (e) {
    serverError.value = e?.normalizedMessage || "Failed to update piece";
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
