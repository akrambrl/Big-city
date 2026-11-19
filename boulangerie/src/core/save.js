const KEY = 'fournil-live-v1';

const DEFAULT = {
  version: 1,
  coins: 0,
  likes: 0,
  followers: 0,
  served: 0,
  day: 1,
  unlocked: ['croissant'],
  best: {},
  settings: { sound: true, haptics: true },
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const data = JSON.parse(raw);
    return { ...structuredClone(DEFAULT), ...data, settings: { ...DEFAULT.settings, ...(data.settings || {}) } };
  } catch (_) {
    return structuredClone(DEFAULT);
  }
}

export const save = {
  data: load(),
  write() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (_) { /* stockage plein ou bloqué */ }
  },
};
