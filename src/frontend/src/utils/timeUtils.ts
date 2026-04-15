/**
 * Convert a bigint nanosecond timestamp to a Date object
 */
export function nanoToDate(nanoTimestamp: bigint): Date {
  return new Date(Number(nanoTimestamp / 1_000_000n));
}

/**
 * Convert a Date object to a bigint nanosecond timestamp
 */
export function dateToNano(date: Date): bigint {
  return BigInt(date.getTime()) * 1_000_000n;
}

/**
 * Format a bigint nanosecond timestamp as a relative time string
 */
export function formatRelativeTime(nanoTimestamp: bigint): string {
  const date = nanoToDate(nanoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return date.toLocaleDateString();
}

/**
 * Format a bigint nanosecond timestamp as a full date string
 */
export function formatDate(nanoTimestamp: bigint): string {
  const date = nanoToDate(nanoTimestamp);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a bigint nanosecond timestamp as date + time
 */
export function formatDateTime(nanoTimestamp: bigint): string {
  const date = nanoToDate(nanoTimestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get initials from a display name
 */
export function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
