<template>
    <div class="page">
        <v-card class="shell" elevation="2">
            <v-card-title class="d-flex align-center">
                Pieces
            </v-card-title>

            <v-card-text>
                <div class="controls">
                    <v-text-field v-model="search" label="Search by title or author" prepend-inner-icon="mdi-magnify"
                        clearable hide-details />

                    <v-select v-model="genre" :items="genreOptions" label="Genre" clearable hide-details />

                    <v-select v-model="tag" :items="tagOptions" label="Tag" clearable hide-details />

                    <v-select v-model="sort" :items="sortOptions" label="Sort" hide-details />

                    <v-switch v-model="onlyMine" label="My pieces" inset hide-details :disabled="!auth.isLoggedIn" />
                </div>

                <v-alert v-if="error" type="error" class="mb-3">
                    {{ error }}
                </v-alert>

                <v-progress-linear v-if="loading" indeterminate />

                <v-row v-else>
                    <v-col v-for="p in filteredPieces" :key="p.id" cols="12">
                        <v-card class="piece-card" elevation="3" @click="openPiece(p.id)">
                            <v-card-title class="piece-header">
                                <div class="title">
                                    {{ p.title }}
                                </div>

                                <v-chip v-if="p.classification?.genre?.name" size="small" variant="outlined"
                                    color="deep-purple-lighten-2" class="genre-chip">
                                    {{ p.classification.genre.name }}
                                </v-chip>
                            </v-card-title>


                            <v-card-subtitle class="subtitle">
                                <span>{{ authorLabel(p) }}</span>
                                <span class="dot">•</span>
                                <span>{{ formatDate(p.metadata?.createdAt) }}</span>
                                <span class="dot">•</span>
                                <span>{{ p.content?.readingTimeMin || 1 }} min read</span>
                            </v-card-subtitle>

                            <v-card-text>
                                <div v-if="p.challenge?.id" class="submitted">
                                    Submitted for challenge: <span class="submitted-title">{{ p.challenge?.title ||
                                        "Challenge" }}</span>
                                </div>

                                <div class="excerpt">
                                    {{ p.content?.excerpt || "" }}
                                </div>

                                <div class="tags" v-if="(p.classification?.tags || []).length">
                                    <v-chip v-for="t in p.classification.tags" :key="t" size="x-small"
                                        variant="outlined" color="deep-purple-accent-2" class="mr-1 mb-1">
                                        #{{ t }}
                                    </v-chip>
                                </div>
                            </v-card-text>

                            <v-divider />

                            <v-card-actions>
                                <v-spacer />
                                <v-btn variant="text" color="deep-purple-accent-4" @click.stop="openPiece(p.id)">
                                    Read
                                </v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-col>
                </v-row>

                <div v-if="!loading && filteredPieces.length === 0" class="mt-3">
                    No pieces match your filters.
                </div>
            </v-card-text>
        </v-card>

        <v-btn v-if="auth.isLoggedIn" class="fab" color="deep-purple-accent-4" icon="mdi-plus" size="large"
            elevation="10" @click="goNew" />
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import http from "../api/http";
import { useAuthStore } from "../stores/auth";
import { useTagsStore } from "../stores/tags";

const router = useRouter();
const auth = useAuthStore();

const tagsStore = useTagsStore();
tagsStore.hydrate();

const pieces = ref([]);
const loading = ref(false);
const error = ref("");

const search = ref("");
const genre = ref(null);
const tag = ref(null);
const sort = ref("newest");
const onlyMine = ref(false);

const sortOptions = [
    { title: "Newest first", value: "newest" },
    { title: "Oldest first", value: "oldest" }
];

function goNew() {
    router.push("/pieces/new");
}

function openPiece(id) {
    router.push(`/pieces/${id}`);
}

function authorLabel(p) {
    return p.author?.displayName || p.author?.email || "Unknown author";
}

function formatDate(value) {
    if (!value) return "";

    let d = null;

    if (value?.toDate) d = value.toDate();
    else if (value instanceof Date) d = value;
    else if (typeof value === "string" || typeof value === "number") d = new Date(value);
    else if (value?._seconds || value?.seconds) d = new Date((value._seconds || value.seconds) * 1000);

    if (!d || Number.isNaN(d.getTime())) return "";

    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit"
    });
}

function formatTimestamp(value) {
    if (!value) return 0;
    if (value?.toDate) return value.toDate().getTime();
    if (value?._seconds || value?.seconds) return (value._seconds || value.seconds) * 1000;
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? 0 : ms;
}

async function load() {
    loading.value = true;
    error.value = "";
    try {
        const res = await http.get("/piece");
        pieces.value = Array.isArray(res.data) ? res.data : [];
        tagsStore.mergeFromPieces(pieces.value);
    } catch (e) {
        error.value = e?.normalizedMessage || "Failed to load pieces";
    } finally {
        loading.value = false;
    }
}

const genreOptions = computed(() => {
    const set = new Set();
    for (const p of pieces.value) {
        const g = p.classification?.genre?.name;
        if (g) set.add(g);
    }
    return Array.from(set).sort();
});

const tagOptions = computed(() => tagsStore.tags);

const filteredPieces = computed(() => {
    let list = [...pieces.value];

    if (onlyMine.value && auth.isLoggedIn) {
        list = list.filter(p => p.author?.id === auth.userId);
    }

    if (genre.value) {
        list = list.filter(p => p.classification?.genre?.name === genre.value);
    }

    if (tag.value) {
        list = list.filter(p => (p.classification?.tags || []).includes(tag.value));
    }

    const q = search.value.trim().toLowerCase();
    if (q) {
        list = list.filter(p => {
            const t = (p.title || "").toLowerCase();
            const a = authorLabel(p).toLowerCase();
            return t.includes(q) || a.includes(q);
        });
    }

    list.sort((a, b) => {
        const da = formatTimestamp(a.metadata?.createdAt);
        const db = formatTimestamp(b.metadata?.createdAt);
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
    grid-template-columns: 1.6fr 1fr 1fr 1fr auto;
    gap: 12px;
    margin-bottom: 18px;
}

@media (max-width: 900px) {
    .controls {
        grid-template-columns: 1fr;
    }
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

.subtitle {
    display: flex;
    gap: 6px;
    font-size: 0.85rem;
    opacity: 0.75;
}

.dot {
    margin: 0 4px;
}

.excerpt {
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 12px;
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
}

.piece-header {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    column-gap: 12px;
}

.title {
    font-weight: 650;
    line-height: 1.2;
    min-width: 0;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    white-space: normal;
    word-break: break-word;
}

.genre-chip {
    align-self: start;
    white-space: nowrap;
}

.submitted {
  font-size: 0.85rem;
  opacity: 0.85;
  margin-bottom: 10px;
  color: #5e35b1;
}

.submitted-title {
  font-weight: 600;
}
</style>
