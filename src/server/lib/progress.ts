/**
 * Calculate progress percentage based on completed lessons.
 * @param completedLessons Number of completed lessons
 * @param totalLessons Total number of lessons
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(
  completedLessons: number,
  totalLessons: number
): number {
  if (totalLessons === 0) return 0;
  if (completedLessons >= totalLessons) return 100;
  return Math.round((completedLessons / totalLessons) * 100);
}

/**
 * Determine if a content item is completed based on progress.
 * @param progressPercentage Current progress percentage
 * @returns True if completed (100%)
 */
export function isCompleted(progressPercentage: number): boolean {
  return progressPercentage >= 100;
}

/**
 * Generate a URL-safe slug from a string.
 * @param text Text to convert to slug
 * @returns URL-safe slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
