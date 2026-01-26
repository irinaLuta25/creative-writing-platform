<template>
  <v-card>
    <v-card-title>Create Piece</v-card-title>
    <v-card-text>
      <PieceForm
        :genres="genres"
        :loading="loading"
        :serverError="serverError"
        :challenge="challenge"
        submitText="Create"
        @submit="create"
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
import { apiGetChallengeById } from "../api/challenges";

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const serverError = ref("");

const challenge = ref(null);
const challengeId = ref(null);

const genres = [
  { id: "genre_general", name: "General" },
  { id: "genre_fantasy", name: "Fantasy" },
  { id: "genre_scifi", name: "Sci-Fi" },
  { id: "genre_romance", name: "Romance" },
  { id: "genre_horror", name: "Horror" },
  { id: "genre_poetry", name: "Poetry" },
  { id: "genre_drama", name: "Drama" },
  { id: "genre_mystery", name: "Mystery" },
];

function goBack() {
  router.push("/pieces");
}

async function loadChallengeIfAny() {
  const q = route.query?.challengeId;
  if (!q) return;

  challengeId.value = String(q);
  try {
    const res = await apiGetChallengeById(challengeId.value);
    challenge.value = res.data;
  } catch (e) {
    serverError.value = e?.normalizedMessage || "Failed to load challenge";
    challenge.value = null;
    challengeId.value = null;
  }
}

async function create(payload) {
  loading.value = true;
  serverError.value = "";

  try {
    const finalPayload = {
      ...payload,
      ...(challengeId.value ? { challengeId: challengeId.value } : {}),
    };

    const res = await http.post("/piece", finalPayload);
    const id = res.data?.id || res.data?.pieceId;
    router.push(id ? `/pieces/${id}` : "/pieces");
  } catch (e) {
    serverError.value = e?.normalizedMessage || "Failed to create piece";
  } finally {
    loading.value = false;
  }
}

onMounted(loadChallengeIfAny);
</script>
