<template>
    <v-card>
        <v-card-title class="d-flex align-center">
            <div>
                <div class="text-h6">{{ piece?.title }}</div>
                <div class="text-caption">
                    by {{ piece?.author?.displayName || piece?.author?.email || "Unknown" }}
                </div>
            </div>

            <v-spacer />

            <template v-if="isOwner">
                <v-btn variant="outlined" class="mr-2" :to="`/pieces/${id}/edit`">Edit</v-btn>
                <v-btn color="error" variant="outlined" @click="confirmDeletePiece = true">Delete</v-btn>
            </template>
        </v-card-title>

        <v-card-text>
            <v-progress-linear v-if="loadingPiece" indeterminate class="mb-4" />
            <v-alert v-if="pieceError" type="error" class="mb-4">{{ pieceError }}</v-alert>

            <div v-if="piece">
                <div class="mb-4">
                    <v-chip class="mr-2" size="small" variant="outlined">
                        {{ piece.content?.language }}
                    </v-chip>

                    <v-chip v-if="piece.classification?.genre?.name" class="mr-2" size="small" variant="outlined">
                        {{ piece.classification.genre.name }}
                    </v-chip>

                    <v-chip v-for="t in (piece.classification?.tags || [])" :key="t" class="mr-2" size="small"
                        variant="outlined">
                        #{{ t }}
                    </v-chip>
                </div>


                <div style="white-space: pre-wrap">{{ piece.content?.body }}</div>

                <v-divider class="my-6" />

                <div class="text-h6 mb-3">Comments</div>

                <v-alert v-if="commentsError" type="error" class="mb-3">
                    {{ commentsError }}
                </v-alert>

                <v-form v-if="auth.isLoggedIn" @submit.prevent="addComment">
                    <v-textarea v-model="newComment" label="Write a comment" rows="3" auto-grow />
                    <v-btn color="deep-purple-accent-4" :loading="addingComment" type="submit">
                        Add comment
                    </v-btn>
                </v-form>

                <v-alert v-else type="info" class="mb-3">
                    Login to comment.
                </v-alert>

                <v-progress-linear v-if="loadingComments" indeterminate class="my-3" />

                <v-list v-if="comments.length">
                    <v-list-item v-for="c in comments" :key="c.id">
                        <v-list-item-title>
                            {{ c.content?.text || c.text || "(no text)" }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            {{ c.author?.displayName || c.author?.email || "Unknown" }}
                        </v-list-item-subtitle>

                        <template #append>
                            <v-btn v-if="auth.userId && c.author?.id === auth.userId" icon="mdi-delete" variant="text"
                                @click="openDeleteComment(c.id)" />
                        </template>
                    </v-list-item>
                </v-list>

                <div v-else class="text-caption mt-2">No comments yet.</div>
            </div>
        </v-card-text>
    </v-card>

    <v-dialog v-model="confirmDeletePiece" max-width="420">
        <v-card>
            <v-card-title>Delete piece?</v-card-title>
            <v-card-text>This cannot be undone.</v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="confirmDeletePiece = false">Cancel</v-btn>
                <v-btn color="error" :loading="deletingPiece" @click="deletePieceConfirmed">Delete</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDeleteComment" max-width="420">
        <v-card>
            <v-card-title>Delete comment?</v-card-title>
            <v-card-text>This cannot be undone.</v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="closeDeleteComment">Cancel</v-btn>
                <v-btn color="error" :loading="deletingComment" @click="deleteCommentConfirmed">
                    Delete
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "../api/http";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const id = route.params.id;

const piece = ref(null);
const loadingPiece = ref(false);
const pieceError = ref("");

const comments = ref([]);
const loadingComments = ref(false);
const commentsError = ref("");

const newComment = ref("");
const addingComment = ref(false);

const confirmDeletePiece = ref(false);
const deletingPiece = ref(false);

const confirmDeleteComment = ref(false);
const deletingComment = ref(false);
const commentToDeleteId = ref(null);

const isOwner = computed(() => {
    const ownerId = piece.value?.author?.id;
    return !!auth.userId && !!ownerId && auth.userId === ownerId;
});

async function loadPiece() {
    loadingPiece.value = true;
    pieceError.value = "";
    try {
        const res = await http.get(`/piece/${id}`);
        piece.value = res.data;
    } catch (e) {
        pieceError.value = e?.normalizedMessage || "Failed to load piece";
    } finally {
        loadingPiece.value = false;
    }
}

async function loadComments() {
    loadingComments.value = true;
    commentsError.value = "";
    try {
        const res = await http.get(`/piece/${id}/comments`);
        comments.value = res.data;
    } catch (e) {
        commentsError.value = e?.normalizedMessage || "Failed to load comments";
    } finally {
        loadingComments.value = false;
    }
}

async function addComment() {
    if (!newComment.value.trim()) return;

    addingComment.value = true;
    commentsError.value = "";

    try {
        const payload = {
            content: { text: newComment.value.trim() },
        };

        await http.post(`/piece/${id}/comments`, payload);
        newComment.value = "";
        await loadComments();
    } catch (e) {
        commentsError.value = e?.normalizedMessage || "Failed to add comment";
    } finally {
        addingComment.value = false;
    }
}

function openDeleteComment(commentId) {
    commentToDeleteId.value = commentId;
    confirmDeleteComment.value = true;
}

function closeDeleteComment() {
    confirmDeleteComment.value = false;
    commentToDeleteId.value = null;
}

async function deleteCommentConfirmed() {
    if (!commentToDeleteId.value) return;

    deletingComment.value = true;
    commentsError.value = "";
    try {
        await http.delete(`/piece/${id}/comments/${commentToDeleteId.value}`);
        closeDeleteComment();
        await loadComments();
    } catch (e) {
        commentsError.value = e?.normalizedMessage || "Failed to delete comment";
    } finally {
        deletingComment.value = false;
    }
}

async function deletePieceConfirmed() {
    deletingPiece.value = true;
    pieceError.value = "";
    try {
        await http.delete(`/piece/${id}`);
        router.push("/pieces");
    } catch (e) {
        pieceError.value = e?.normalizedMessage || "Failed to delete piece";
    } finally {
        deletingPiece.value = false;
        confirmDeletePiece.value = false;
    }
}

onMounted(async () => {
    await loadPiece();
    await loadComments();
});
</script>
