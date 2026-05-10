import { writable } from 'svelte/store';

export type Theme = 'light' | 'dark' | 'system';
const STORAGE_KEY = 'horas-cossio-theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readStored(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
}

export const theme = writable<Theme>(readStored());

export function applyTheme(t: Theme) {
  if (typeof window === 'undefined') return;
  const html = document.documentElement;
  const resolved = t === 'system' ? getSystemTheme() : t;
  html.classList.add('transitioning');
  setTimeout(() => html.classList.remove('transitioning'), 250);
  html.classList.toggle('dark', resolved === 'dark');
  localStorage.setItem(STORAGE_KEY, t);
}

export function setupTheme() {
  if (typeof window === 'undefined') return;
  const stored = readStored();
  // Initial apply WITHOUT transition flicker
  const resolved = stored === 'system' ? getSystemTheme() : stored;
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  theme.set(stored);

  // Re-apply when system changes (and user has chosen 'system')
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', () => {
    const current = readStored();
    if (current === 'system') {
      const r = getSystemTheme();
      document.documentElement.classList.toggle('dark', r === 'dark');
    }
  });

  theme.subscribe((t) => applyTheme(t));
}
