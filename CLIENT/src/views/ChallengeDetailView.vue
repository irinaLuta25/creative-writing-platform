<template>
  <v-card class="shell" elevation="2">
    <v-card-title class="header">
      <div class="header-left">
        <div class="text-h6">{{ challenge?.title }}</div>

        <div class="subtitle" v-if="challenge">
          <span>{{ formatDateEn(challenge.metadata?.createdAt) }}</span>
          <span class="dot">•</span>
          <span>{{ challenge.prompt?.constraints?.maxWords || 0 }} words max</span>
          <span class="dot">•</span>
          <span>{{ challenge.prompt?.constraints?.language || "" }}</span>
        </div>

        <div class="subtitle mt-1" v-if="challenge">
          <v-chip size="x-small" variant="outlined" color="deep-purple-accent-2" class="mr-2">
            {{ isOpen ? "Open" : "Closed" }}
          </v-chip>

          <span v-if="startsAtLabel">Starts: {{ startsAtLabel }}</span>

          <span v-if="endsAtLabel">
            <span class="dot">•</span>
            Ends: {{ endsAtLabel }}
          </span>
        </div>
      </div>

      <div class="header-actions">
        <template v-if="auth.isLoggedIn && isOpen">
          <v-btn color="deep-purple-accent-4" variant="outlined" class="write-btn" @click="writeForChallenge">
            Write for this challenge
          </v-btn>
        </template>

        <template v-if="auth.isAdmin">
          <v-btn variant="outlined" class="admin-btn" :to="`/challenges/${id}/edit`">
            Edit
          </v-btn>
          <v-btn color="error" variant="outlined" class="admin-btn" @click="confirmDelete = true">
            Delete
          </v-btn>
        </template>
      </div>
    </v-card-title>


    <v-card-text>
      <v-progress-linear v-if="loading" indeterminate class="mb-4" />
      <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

      <div v-if="challenge">
        <div class="prompt">
          {{ challenge.prompt?.text || "" }}
        </div>

        <div class="tags" v-if="(challenge.prompt?.tags || []).length">
          <v-chip v-for="t in challenge.prompt.tags" :key="t" size="x-small" variant="outlined"
            color="deep-purple-accent-2" class="mr-1 mb-1">
            #{{ t }}
          </v-chip>
        </div>

        <v-divider class="my-6" />

        <div class="d-flex align-center mb-3">
          <div class="text-h6">Submissions</div>
          <v-spacer />
          <v-btn variant="text" color="deep-purple-accent-4" @click="loadPieces">
            Reload
          </v-btn>
        </div>

        <v-progress-linear v-if="loadingPieces" indeterminate class="mb-3" />
        <v-alert v-if="piecesError" type="error" class="mb-3">
          {{ piecesError }}
        </v-alert>

        <v-row v-if="!loadingPieces && submissions.length">
          <v-col cols="12" v-for="p in submissions" :key="p.id">
            <v-card class="piece-card" elevation="3" @click="openPiece(p.id)">
              <v-card-title class="d-flex align-center">
                <div class="title">{{ p.title }}</div>
                <v-spacer />
                <v-chip v-if="p.classification?.genre?.name" size="small" variant="outlined"
                  color="deep-purple-lighten-2">
                  {{ p.classification.genre.name }}
                </v-chip>
              </v-card-title>

              <v-card-subtitle class="subtitle">
                <span>{{ p.author?.displayName || p.author?.email || "Unknown author" }}</span>
                <span class="dot">•</span>
                <span>{{ formatDateEn(p.metadata?.createdAt) }}</span>
                <span class="dot">•</span>
                <span>{{ p.content?.readingTimeMin || 1 }} min read</span>
              </v-card-subtitle>

              <v-card-text>
                <div class="excerpt">{{ p.content?.excerpt || "" }}</div>

                <div class="tags" v-if="(p.classification?.tags || []).length">
                  <v-chip v-for="t in p.classification.tags" :key="t" size="x-small" variant="outlined"
                    color="deep-purple-accent-2" class="mr-1 mb-1">
                    #{{ t }}
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <div v-if="!loadingPieces && submissions.length === 0" class="text-caption">
          No submissions yet.
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
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "../api/http";
import { useAuthStore } from "../stores/auth";
import { formatDateEn, toMillis } from "../utils/date";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const id = route.params.id;

const challenge = ref(null);
const loading = ref(false);
const error = ref("");

const submissions = ref([]);
const loadingPieces = ref(false);
const piecesError = ref("");

const confirmDelete = ref(false);
const deleting = ref(false);

const startsAtLabel = computed(() =>
  formatDateEn(challenge.value?.availability?.schedule?.startsAt)
);

const endsAtLabel = computed(() =>
  formatDateEn(challenge.value?.availability?.schedule?.endsAt)
);

const isOpen = computed(() => {
  const c = challenge.value;
  if (!c) return false;
  if (c?.availability?.isActive === false) return false;

  const now = Date.now();
  const start = toMillis(c?.availability?.schedule?.startsAt) || 0;
  const end = toMillis(c?.availability?.schedule?.endsAt) || 0;

  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
});

function openPiece(pieceId) {
  router.push(`/pieces/${pieceId}`);
}

function writeForChallenge() {
  router.push(`/pieces/new?challengeId=${id}`);
}

async function loadChallenge() {
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

async function loadPieces() {
  loadingPieces.value = true;
  piecesError.value = "";
  try {
    const res = await http.get(`/challenge/${id}/pieces`);
    submissions.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    piecesError.value = e?.normalizedMessage || "Failed to load submissions";
  } finally {
    loadingPieces.value = false;
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

async function load() {
  await loadChallenge();
  await loadPieces();
}

onMounted(load);
</script>

<style scoped>
.shell {
  border-radius: 18px;
}

.subtitle {
  display: flex;
  flex-wrap: wrap;
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

.piece-card {
  border-radius: 20px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.piece-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 22px rgba(103, 58, 183, 0.22);
}

.title {
  font-weight: 650;
}

.excerpt {
  font-size: 0.95rem;
  line-height: 1.6;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  min-width: 0;
  flex: 1 1 260px;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  flex: 0 1 auto;
}

@media (max-width: 600px) {
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .write-btn {
    width: 100%;
  }
}

.admin-btn {
  white-space: nowrap;
}
</style>
