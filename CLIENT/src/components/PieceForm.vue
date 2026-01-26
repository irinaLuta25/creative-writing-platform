<template>
  <v-form @submit.prevent="onSubmit">
    <v-alert v-if="challenge" type="info" class="mb-4" variant="tonal">
      <div class="d-flex align-center justify-space-between flex-wrap">
        <div>
          <div class="text-subtitle-2">Submitting for challenge</div>
          <div class="text-body-2">
            {{ challenge.title }}
          </div>
        </div>

        <div class="text-caption">
          <span v-if="challenge.availability?.schedule?.startsAt">
            Starts: {{ formatDateEn(challenge.availability.schedule.startsAt) }}
          </span>
          <span v-if="challenge.availability?.schedule?.endsAt">
            &nbsp;•&nbsp;Ends: {{ formatDateEn(challenge.availability.schedule.endsAt) }}
          </span>
        </div>
      </div>
    </v-alert>

    <v-alert v-if="challengeEnded" type="error" class="mb-4" variant="tonal">
      This challenge has ended. You can no longer submit.
    </v-alert>

    <v-text-field
      v-model="form.title"
      label="Title"
      :error-messages="errors.title"
      counter="150"
      required
      :disabled="loading || challengeEnded"
    />

    <v-textarea
      v-model="form.body"
      label="Content"
      :error-messages="errors.body"
      rows="10"
      auto-grow
      required
      :disabled="loading || challengeEnded"
    />

    <v-text-field
      v-model="form.language"
      label="Language (e.g. en)"
      :error-messages="errors.language"
      required
      :disabled="loading || challengeEnded"
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
      :disabled="loading || challengeEnded"
    />

    <v-combobox
      v-model="form.tags"
      label="Tags (1–5)"
      multiple
      chips
      clearable
      :error-messages="errors.tags"
      persistent-hint
      hint="Choose from list or type your own, then press Enter"
      :items="tagOptions"
      :disabled="loading || challengeEnded"
    />

    <v-alert v-if="serverError" type="error" class="mt-4">
      {{ serverError }}
    </v-alert>

    <div class="d-flex gap-2 mt-5">
      <v-btn
        color="deep-purple-accent-4"
        type="submit"
        :loading="loading"
        :disabled="challengeEnded"
      >
        {{ submitText }}
      </v-btn>

      <v-btn
        variant="outlined"
        :disabled="loading"
        @click="$emit('cancel')"
      >
        Cancel
      </v-btn>
    </div>
  </v-form>
</template>

<script setup>
import { computed, reactive, watch } from "vue";
import { formatDateEn, isPast } from "../utils/date";
import { useTagsStore } from "../stores/tags";

const props = defineProps({
  modelValue: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  serverError: { type: String, default: "" },
  submitText: { type: String, default: "Save" },

  genres: { type: Array, default: () => [] },

  challenge: { type: Object, default: null },
});

const emit = defineEmits(["submit", "cancel"]);

const tagsStore = useTagsStore();
tagsStore.hydrate();

const tagOptions = computed(() => tagsStore.tags);

const challengeEnded = computed(() => {
  const endsAt = props.challenge?.availability?.schedule?.endsAt;
  if (!endsAt) return false;
  return isPast(endsAt);
});

const form = reactive({
  title: "",
  body: "",
  language: "en",
  genre: props.genres?.[0] || { id: "genre_general", name: "General" },
  tags: [],
});

watch(
  () => props.modelValue,
  (piece) => {
    if (!piece) return;
    form.title = piece.title || "";
    form.body = piece.content?.body || "";
    form.language = piece.content?.language || "en";

    const g = piece.classification?.genre;
    const match =
      props.genres.find((x) => x.id === g?.id) ||
      (g?.id && g?.name ? { id: g.id, name: g.name } : null);

    form.genre =
      match || props.genres?.[0] || { id: "genre_general", name: "General" };

    form.tags = Array.isArray(piece.classification?.tags)
      ? [...piece.classification.tags]
      : [];
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

const errors = reactive({
  title: [],
  body: [],
  language: [],
  genre: [],
  tags: [],
});

function clearErrors() {
  errors.title = [];
  errors.body = [];
  errors.language = [];
  errors.genre = [];
  errors.tags = [];
}

function validate() {
  clearErrors();

  const t = form.title.trim();
  if (!t || t.length < 3 || t.length > 150) {
    errors.title = ["Title must be between 3 and 150 characters"];
  }

  const b = form.body.trim();
  if (!b) errors.body = ["Content body is required"];

  const lang = form.language.trim();
  if (!lang) errors.language = ["Language is required"];

  if (!form.genre?.id || !form.genre?.name) {
    errors.genre = ["Genre is required"];
  }

  const tags = Array.isArray(form.tags) ? form.tags : [];
  const cleaned = tags.map((x) => String(x).trim()).filter(Boolean);

  if (cleaned.length < 1) errors.tags = ["At least one tag is required"];
  else if (cleaned.length > 5) errors.tags = ["Maximum 5 tags allowed"];

  return (
    errors.title.length === 0 &&
    errors.body.length === 0 &&
    errors.language.length === 0 &&
    errors.genre.length === 0 &&
    errors.tags.length === 0
  );
}

const payload = computed(() => {
  const body = form.body.trim();
  const words = body ? body.split(/\s+/).filter(Boolean).length : 0;

  return {
    title: form.title.trim(),
    content: {
      body,
      language: form.language.trim(),
      excerpt: body.slice(0, 200),
      readingTimeMin: Math.max(1, Math.round(words / 200)),
    },
    classification: {
      tags: (form.tags || []).map((t) => String(t).trim()).filter(Boolean),
      genre: {
        id: form.genre.id,
        name: form.genre.name,
      },
    },
  };
});

function onSubmit() {
  if (challengeEnded.value) return;
  if (!validate()) return;

  const usedTags = payload.value.classification.tags;
  tagsStore.addTags(usedTags);

  emit("submit", payload.value);
}
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
