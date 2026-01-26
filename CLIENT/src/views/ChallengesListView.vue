<template>
  <div class="page">
    <v-card class="shell" elevation="2">
      <v-card-title class="d-flex align-center">
        Challenges
      </v-card-title>


      <v-card-text>
        <div class="controls">
          <v-text-field v-model="search" label="Search by title or prompt" prepend-inner-icon="mdi-magnify" clearable
            hide-details />

          <v-select v-model="language" :items="languageOptions" label="Language" clearable hide-details />

          <v-select v-model="tag" :items="tagOptions" label="Tag" clearable hide-details />

          <v-select v-model="sort" :items="sortOptions" label="Sort" hide-details />
        </div>

        <v-alert v-if="error" type="error" class="mb-3">
          {{ error }}
        </v-alert>

        <v-progress-linear v-if="loading" indeterminate />

        <v-row v-else>
          <v-col v-for="c in filteredChallenges" :key="c.id" cols="12">
            <v-card class="item-card" elevation="3" @click="openChallenge(c.id)">
              <v-card-title class="d-flex align-center">
                <div class="title">{{ c.title }}</div>
                <v-spacer />
                <v-chip v-if="c.prompt?.constraints?.language" size="small" variant="outlined"
                  color="deep-purple-lighten-2">
                  {{ c.prompt.constraints.language }}
                </v-chip>
              </v-card-title>

              <v-card-subtitle class="subtitle">
                <span>{{ formatDateEn(c.metadata?.createdAt) }}</span>
                <span class="dot">•</span>
                <span>{{ c.prompt?.constraints?.maxWords || 0 }} words max</span>
              </v-card-subtitle>

              <v-card-text>
                <div class="prompt">
                  {{ c.prompt?.text || "" }}
                </div>

                <div class="tags" v-if="(c.prompt?.tags || []).length">
                  <v-chip v-for="t in c.prompt.tags" :key="t" size="x-small" variant="outlined"
                    color="deep-purple-accent-2" class="mr-1 mb-1">
                    #{{ t }}
                  </v-chip>
                </div>
              </v-card-text>

              <v-divider />

              <v-card-actions>
                <v-spacer />
                <v-btn variant="text" color="deep-purple-accent-4" @click.stop="openChallenge(c.id)">
                  View
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <div v-if="!loading && filteredChallenges.length === 0" class="mt-3">
          No challenges match your filters.
        </div>
      </v-card-text>
    </v-card>

    <v-btn v-if="auth.isAdmin" class="fab" color="deep-purple-accent-4" size="large" icon elevation="10"
      aria-label="Create challenge" @click="goNew">
      <v-icon icon="mdi-plus" />
    </v-btn>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import http from "../api/http";
import { useAuthStore } from "../stores/auth";
import { formatDateEn, toMillis } from "../utils/date";

const router = useRouter();
const auth = useAuthStore();

const challenges = ref([]);
const loading = ref(false);
const error = ref("");

const search = ref("");
const language = ref(null);
const tag = ref(null);
const sort = ref("newest");

const sortOptions = [
  { title: "Newest first", value: "newest" },
  { title: "Oldest first", value: "oldest" }
];
const languageOptions = ["en", "ro"];

function openChallenge(id) {
  router.push(`/challenges/${id}`);
}

function goNew() {
  router.push("/challenges/new");
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const res = await http.get("/challenge");
    challenges.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    error.value = e?.normalizedMessage || "Failed to load challenges";
  } finally {
    loading.value = false;
  }
}

const tagOptions = computed(() => {
  const set = new Set();
  for (const c of challenges.value) {
    for (const t of c.prompt?.tags || []) set.add(t);
  }
  return Array.from(set).sort();
});

const filteredChallenges = computed(() => {
  let list = [...challenges.value];

  if (language.value) {
    list = list.filter((c) => c.prompt?.constraints?.language === language.value);
  }

  if (tag.value) {
    list = list.filter((c) => (c.prompt?.tags || []).includes(tag.value));
  }

  const q = search.value.trim().toLowerCase();
  if (q) {
    list = list.filter((c) => {
      const title = (c.title || "").toLowerCase();
      const prompt = (c.prompt?.text || "").toLowerCase();
      return title.includes(q) || prompt.includes(q);
    });
  }

  list.sort((a, b) => {
    const da = toMillis(a.metadata?.createdAt);
    const db = toMillis(b.metadata?.createdAt);
    return sort.value === "newest" ? db - da : da - db;
  });

  return list;
});

onMounted(load);
</script>

<style scoped>
.page {
  position: relative;
}

.shell {
  border-radius: 18px;
}

.controls {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 18px;
}

@media (max-width: 900px) {
  .controls {
    grid-template-columns: 1fr;
  }
}

.item-card {
  border-radius: 20px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.item-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 22px rgba(103, 58, 183, 0.22);
}

.title {
  font-weight: 650;
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
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.tags {
  display: flex;
  flex-wrap: wrap;
}

.fab {
  position: fixed;
  right: 20px;
  bottom: 20px;
  border-radius: 999px;
  z-index: 3000;
}
</style>
