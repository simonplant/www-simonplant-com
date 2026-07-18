/**
 * Badge colors for product statuses. Mirrors the `status` enum of the
 * `products` collection in src/content.config.ts — keep the two in sync.
 */
export const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-green-900/40', text: 'text-green-400' },
  beta: { bg: 'bg-yellow-900/40', text: 'text-yellow-400' },
  planned: { bg: 'bg-blue-900/40', text: 'text-blue-400' },
  stable: { bg: 'bg-emerald-900/40', text: 'text-emerald-400' },
};

export function getStatusColors(status: string): { bg: string; text: string } {
  return statusColors[status] ?? statusColors.active;
}
