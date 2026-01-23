<template>
  <v-card>
    <v-card-title>Create Piece</v-card-title>
    <v-card-text>
      <PieceForm
        :genres="genres"
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
import PieceForm from "../components/PieceForm.vue";

const router = useRouter();
const loading = ref(false);
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
  router.push("/pieces");
}

async function create(payload) {
  loading.value = true;
  serverError.value = "";
  try {
    const res = await http.post("/piece", payload);
    const id = res.data?.id || res.data?.pieceId;
    router.push(id ? `/pieces/${id}` : "/pieces");
  } catch (e) {
    serverError.value = e?.normalizedMessage || "Failed to create piece";
  } finally {
    loading.value = false;
  }
}
</script>
