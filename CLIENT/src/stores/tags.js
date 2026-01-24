import { defineStore } from "pinia";

const STORAGE_KEY = "inkwell_tags_v1";

function normalizeTag(t) {
  return String(t || "")
    .trim()
    .replace(/^#+/, "")
    .toLowerCase();
}

function uniqueSorted(arr) {
  return Array.from(new Set(arr)).filter(Boolean).sort((a, b) => a.localeCompare(b));
}

export const useTagsStore = defineStore("tags", {
  state: () => ({
    tags: []
  }),
  actions: {
    hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        this.tags = uniqueSorted(Array.isArray(parsed) ? parsed.map(normalizeTag) : []);
      } catch {
        this.tags = [];
      }
    },
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tags));
    },
    addTags(tags) {
      const incoming = (tags || []).map(normalizeTag).filter(Boolean);
      this.tags = uniqueSorted([...this.tags, ...incoming]);
      this.persist();
    },
    mergeFromPieces(pieces) {
      const all = [];
      for (const p of pieces || []) {
        const tags = p?.classification?.tags || [];
        for (const t of tags) all.push(t);
      }
      this.addTags(all);
    }
  }
});
