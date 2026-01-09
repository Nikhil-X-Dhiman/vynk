function formatTimestamp(timestamp: string | number | Date) {
  const now = Date.now();
  const msgTime = new Date(timestamp).getTime();
  const diff = now - msgTime;
  if (diff < 60000) return 'Just Now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  return `${Math.floor(diff / 86400000)} days ago`;
}

export { formatTimestamp };
