/**
 * Formats a message timestamp based on recency.
 * - Today: "10:30 AM"
 * - Older: "12/02/2026 10:30 AM"
 */
export function formatMessageTime(timestamp: number): string {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();

  // Check if it's today
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeString = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (isToday) {
    return timeString;
  }

  // Format date: MM/DD/YYYY
  const dateString = date.toLocaleDateString([], {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  return `${dateString} ${timeString}`;
}
