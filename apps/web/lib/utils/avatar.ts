/**
 * Normalizes avatar URLs to ensure they use absolute paths
 * Fixes relative paths like "assets/avatar/..." to "/assets/avatar/..."
 */
export function normalizeAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // If it's already an absolute URL (http/https) or starts with /, return as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url;
  }

  // If it's a relative path starting with "assets/", add leading slash
  if (url.startsWith('assets/')) {
    return `/${url}`;
  }

  return url;
}
