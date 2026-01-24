export function toMillis(value) {
  if (!value) return 0;
  if (value?.toDate) return value.toDate().getTime();
  if (value?._seconds || value?.seconds) return (value._seconds || value.seconds) * 1000;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export function formatDateEn(value) {
  const ms = toMillis(value);
  if (!ms) return "";
  const d = new Date(ms);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}
