function formatTimestamp(timestamp: string | number | Date) {
  const now = Date.now();
  const msgTime = new Date(timestamp).getTime();
  const diff = now - msgTime;

  const minute = 60000;
  const hour = 3600000;
  const day = 86400000;
  const month = 2592000000;
  const year = 31536000000;

  if (diff < minute) return 'Just Now';
  if (diff < hour) return `${Math.floor(diff / minute)} minutes ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hours ago`;
  if (diff < month) return `${Math.floor(diff / day)} days ago`;
  if (diff < year) return `${Math.floor(diff / month)} months ago`;
  return `${Math.floor(diff / year)} years ago`;
}

export { formatTimestamp };
