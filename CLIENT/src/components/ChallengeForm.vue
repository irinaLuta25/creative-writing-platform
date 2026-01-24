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

const props = defineProps({
  modelValue: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  serverError: { type: String, default: "" },
  submitText: { type: String, default: "Save" }
});

const emit = defineEmits(["submit", "cancel"]);

const languageOptions = ["en", "ro"];

const form = reactive({
  title: "",
  promptText: "",
  maxWords: 300,
  language: "en",
  tags: []
});

const errors = reactive({
  title: [],
  promptText: [],
  maxWords: [],
  language: [],
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
  },
  { immediate: true }
);

function clearErrors() {
  errors.title = [];
  errors.promptText = [];
  errors.maxWords = [];
  errors.language = [];
  errors.tags = [];
}

function validate() {
  clearErrors();

  const title = form.title.trim();
  if (!title) errors.title = ["Title is required"];
  else if (title.length < 3 || title.length > 100) errors.title = ["Title must be between 3 and 100 characters"];

  const promptText = form.promptText.trim();
  if (!promptText) errors.promptText = ["Prompt text is required"];

  const maxWords = Number(form.maxWords);
  if (!Number.isInteger(maxWords)) errors.maxWords = ["Max words must be an integer"];
  else if (maxWords < 50 || maxWords > 2000) errors.maxWords = ["Max words must be between 50 and 2000"];

  const lang = String(form.language || "").trim();
  if (!lang) errors.language = ["Language is required"];

  if (!Array.isArray(form.tags)) errors.tags = ["Tags must be an array"];

  return (
    errors.title.length === 0 &&
    errors.promptText.length === 0 &&
    errors.maxWords.length === 0 &&
    errors.language.length === 0 &&
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
