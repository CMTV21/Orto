/**
 * Replaces the `window.storage` API that only exists inside a Claude
 * artifact. Same shape (async get/set/delete returning {key, value} or
 * null), backed by the browser's own localStorage instead.
 *
 * This is the only thing that had to change to take the app out of the
 * chat — every storage call in App.jsx is unmodified.
 */

const PREFIX = "orto:";

function makeStorage() {
  return {
    async get(key) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw === null) return null;
        return { key, value: raw };
      } catch {
        return null;
      }
    },

    async set(key, value) {
      try {
        localStorage.setItem(PREFIX + key, value);
        return { key, value };
      } catch {
        // Most likely quota exceeded (localStorage caps around 5-10MB per
        // origin). A garden plan is small text, so this should be rare.
        return null;
      }
    },

    async delete(key) {
      try {
        localStorage.removeItem(PREFIX + key);
        return { key, deleted: true };
      } catch {
        return null;
      }
    },

    async list(prefix) {
      try {
        const keys = [];
        const scan = prefix ? PREFIX + prefix : PREFIX;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(scan)) keys.push(k.slice(PREFIX.length));
        }
        return { keys };
      } catch {
        return null;
      }
    },
  };
}

export function installStorageShim() {
  if (!window.storage) window.storage = makeStorage();
}
