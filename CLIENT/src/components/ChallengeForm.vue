<template>
  <v-form @submit.prevent="onSubmit">
    <v-text-field
      v-model="form.title"
      label="Title"
      counter="100"
      :error-messages="errors.title"
      required
    />

    <v-textarea
      v-model="form.promptText"
      label="Prompt"
      rows="6"
      auto-grow
      :error-messages="errors.promptText"
      required
    />

    <div class="grid">
      <v-text-field
        v-model.number="form.maxWords"
        type="number"
        label="Max words"
        :error-messages="errors.maxWords"
        required
      />

      <v-select
        v-model="form.language"
        :items="languageOptions"
        label="Language"
        :error-messages="errors.language"
        required
      />
    </div>

    <div class="grid">
      <v-text-field
        v-model="form.startsAt"
        type="date"
        label="Start date"
        :error-messages="errors.startsAt"
        required
      />

      <v-text-field
        v-model="form.endsAt"
        type="date"
        label="End date"
        :error-messages="errors.endsAt"
        required
      />
    </div>

    <v-combobox
      v-model="form.tags"
      label="Tags"
      multiple
      chips
      clearable
      :error-messages="errors.tags"
      hint="Press Enter after each tag"
      persistent-hint
    />

    <v-alert v-if="serverError" type="error" class="mt-4">
      {{ serverError }}
    </v-alert>

    <div class="actions">
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
import { reactive, watch } from "vue";
import { toMillis } from "../utils/date";

const props = defineProps({
  modelValue: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  serverError: { type: String, default: "" },
  submitText: { type: String, default: "Save" }
});

const emit = defineEmits(["submit", "cancel"]);

const languageOptions = ["en", "ro"];

function yyyyMmDdFromAny(value) {
  const ms = toMillis(value);
  if (!ms) return "";
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const form = reactive({
  title: "",
  promptText: "",
  maxWords: 300,
  language: "en",
  startsAt: "",
  endsAt: "",
  tags: []
});

const errors = reactive({
  title: [],
  promptText: [],
  maxWords: [],
  language: [],
  startsAt: [],
  endsAt: [],
  tags: []
});

watch(
  () => props.modelValue,
  (c) => {
    if (!c) return;

    form.title = c.title || "";
    form.promptText = c.prompt?.text || "";
    form.maxWords = c.prompt?.constraints?.maxWords ?? 300;
    form.language = c.prompt?.constraints?.language || "en";
    form.tags = Array.isArray(c.prompt?.tags) ? [...c.prompt.tags] : [];

    form.startsAt = yyyyMmDdFromAny(c.availability?.schedule?.startsAt);
    form.endsAt = yyyyMmDdFromAny(c.availability?.schedule?.endsAt);
  },
  { immediate: true }
);

function clearErrors() {
  errors.title = [];
  errors.promptText = [];
  errors.maxWords = [];
  errors.language = [];
  errors.startsAt = [];
  errors.endsAt = [];
  errors.tags = [];
}

function validate() {
  clearErrors();

  const title = form.title.trim();
  if (!title) errors.title = ["Title is required"];
  else if (title.length < 3 || title.length > 100) {
    errors.title = ["Title must be between 3 and 100 characters"];
  }

  const promptText = form.promptText.trim();
  if (!promptText) errors.promptText = ["Prompt text is required"];

  const maxWords = Number(form.maxWords);
  if (!Number.isInteger(maxWords)) errors.maxWords = ["Max words must be an integer"];
  else if (maxWords < 50 || maxWords > 2000) errors.maxWords = ["Max words must be between 50 and 2000"];

  const lang = String(form.language || "").trim();
  if (!lang) errors.language = ["Language is required"];

  if (!form.startsAt) errors.startsAt = ["Start date is required"];
  if (!form.endsAt) errors.endsAt = ["End date is required"];

  if (form.startsAt && form.endsAt) {
    const start = new Date(form.startsAt);
    const end = new Date(form.endsAt);
    if (Number.isNaN(start.getTime())) errors.startsAt = ["Start date is invalid"];
    if (Number.isNaN(end.getTime())) errors.endsAt = ["End date is invalid"];
    if (!errors.startsAt.length && !errors.endsAt.length && end.getTime() < start.getTime()) {
      errors.endsAt = ["End date must be after start date"];
    }
  }

  if (!Array.isArray(form.tags)) errors.tags = ["Tags must be an array"];

  return (
    errors.title.length === 0 &&
    errors.promptText.length === 0 &&
    errors.maxWords.length === 0 &&
    errors.language.length === 0 &&
    errors.startsAt.length === 0 &&
    errors.endsAt.length === 0 &&
    errors.tags.length === 0
  );
}

function onSubmit() {
  if (!validate()) return;

  const payload = {
    title: form.title.trim(),
    prompt: {
      text: form.promptText.trim(),
      constraints: {
        maxWords: Number(form.maxWords),
        language: String(form.language).trim()
      },
      tags: (form.tags || []).map((t) => String(t).trim()).filter(Boolean)
    },
    availability: {
      isActive: true,
      schedule: {
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString()
      }
    }
  };

  emit("submit", payload);
}
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
</style>
