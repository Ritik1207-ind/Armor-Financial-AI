import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging tailwind classes safely (especially useful if using Shadcn patterns)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}
