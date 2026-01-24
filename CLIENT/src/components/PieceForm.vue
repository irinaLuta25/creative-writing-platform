<template>
  <v-form @submit.prevent="onSubmit">
    <v-text-field
      v-model="form.title"
      label="Title"
      :error-messages="errors.title"
      counter="150"
      required
    />

    <v-textarea
      v-model="form.body"
      label="Content"
      :error-messages="errors.body"
      rows="10"
      auto-grow
      required
    />

    <v-text-field
      v-model="form.language"
      label="Language (e.g. en / ro)"
      :error-messages="errors.language"
      required
    />

    <v-select
      v-model="form.genre"
      :items="genres"
      item-title="name"
      item-value="id"
      return-object
      label="Genre"
      :error-messages="errors.genre"
      required
    />

    <v-combobox
      v-model="form.tags"
      :items="tagOptions"
      label="Tags (1–5)"
      multiple
      chips
      clearable
      closable-chips
      :error-messages="errors.tags"
      hint="Pick existing tags or type new ones. Press Enter to add."
      persistent-hint
      @update:modelValue="onTagsChanged"
      required
    />

    <v-alert v-if="serverError" type="error" class="mt-4">
      {{ serverError }}
    </v-alert>

    <div class="d-flex gap-2 mt-5">
      <v-btn color="deep-purple-accent-4" type="submit" :loading="loading">
        {{ submitText }}
      </v-btn>
      <v-btn variant="outlined" :disabled="loading" @click="$emit('cancel')">
        Cancel
      </v-btn>
    </div>
  </v-form>
</template>

<script setup>
import { computed, reactive, watch } from "vue";
import { useTagsStore } from "../stores/tags";

const props = defineProps({
  modelValue: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  serverError: { type: String, default: "" },
  submitText: { type: String, default: "Save" },
  genres: {
    type: Array,
    default: () => ([
      { id: "genre_general", name: "General" },
      { id: "genre_fantasy", name: "Fantasy" },
      { id: "genre_scifi", name: "Sci-Fi" },
      { id: "genre_romance", name: "Romance" },
      { id: "genre_horror", name: "Horror" },
      { id: "genre_poetry", name: "Poetry" }
    ]),
  },
});

const emit = defineEmits(["submit", "cancel"]);

const tagsStore = useTagsStore();
tagsStore.hydrate();

const tagOptions = computed(() => tagsStore.tags);

const form = reactive({
  title: "",
  body: "",
  language: "ro",
  genre: props.genres?.[0] || { id: "genre_general", name: "General" },
  tags: [],
});

const errors = reactive({
  title: [],
  body: [],
  language: [],
  genre: [],
  tags: [],
});

function normalizeTag(t) {
  return String(t || "")
    .trim()
    .replace(/^#+/, "")
    .toLowerCase();
}

function uniqueTags(arr) {
  return Array.from(new Set((arr || []).map(normalizeTag).filter(Boolean)));
}

function onTagsChanged(val) {
  const cleaned = uniqueTags(val);
  form.tags = cleaned;
  tagsStore.addTags(cleaned);
}

watch(
  () => props.modelValue,
  (piece) => {
    if (!piece) return;

    form.title = piece.title || "";
    form.body = piece.content?.body || "";
    form.language = piece.content?.language || "ro";

    const g = piece.classification?.genre;
    const match =
      props.genres.find((x) => x.id === g?.id) ||
      (g?.id && g?.name ? { id: g.id, name: g.name } : null);

    form.genre = match || props.genres?.[0] || { id: "genre_general", name: "General" };

    const incoming = Array.isArray(piece.classification?.tags) ? piece.classification.tags : [];
    const cleaned = uniqueTags(incoming);
    form.tags = cleaned;
    tagsStore.addTags(cleaned);
  },
  { immediate: true }
);

watch(
  () => props.genres,
  (newGenres) => {
    if (!form.genre && newGenres?.length) form.genre = newGenres[0];
    if (form.genre && newGenres?.length) {
      const match = newGenres.find((x) => x.id === form.genre.id);
      if (match) form.genre = match;
    }
  },
  { deep: true }
);

function clearErrors() {
  errors.title = [];
  errors.body = [];
  errors.language = [];
  errors.genre = [];
  errors.tags = [];
}

function validate() {
  clearErrors();

  const title = (form.title || "").trim();
  if (title.length < 3 || title.length > 150) {
    errors.title = ["Title must be between 3 and 150 characters"];
  }

  const body = (form.body || "").trim();
  if (!body) {
    errors.body = ["Content body is required"];
  }

  const lang = (form.language || "").trim();
  if (!lang) {
    errors.language = ["Language is required"];
  }

  if (!form.genre?.id || !form.genre?.name) {
    errors.genre = ["Genre is required"];
  }

  const cleanedTags = uniqueTags(form.tags);
  form.tags = cleanedTags;

  if (cleanedTags.length < 1) {
    errors.tags = ["At least one tag is required"];
  } else if (cleanedTags.length > 5) {
    errors.tags = ["Maximum 5 tags allowed"];
  }

  return (
    errors.title.length === 0 &&
    errors.body.length === 0 &&
    errors.language.length === 0 &&
    errors.genre.length === 0 &&
    errors.tags.length === 0
  );
}

const payload = computed(() => {
  const body = (form.body || "").trim();
  const words = body ? body.split(/\s+/).filter(Boolean).length : 0;

  return {
    title: (form.title || "").trim(),
    content: {
      body,
      language: (form.language || "").trim(),
      excerpt: body.slice(0, 200),
      readingTimeMin: Math.max(1, Math.round(words / 200)),
    },
    classification: {
      tags: uniqueTags(form.tags),
      genre: {
        id: form.genre.id,
        name: form.genre.name,
      },
    },
  };
});

function onSubmit() {
  if (!validate()) return;
  emit("submit", payload.value);
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
</style>
