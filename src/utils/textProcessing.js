export function toTimestampLabel(dateString) {
  const d = new Date(dateString);
  return d.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
}
