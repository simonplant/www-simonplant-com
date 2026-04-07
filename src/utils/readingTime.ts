export function getReadingTime(content: string | undefined): string {
  const words = content ? content.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}
