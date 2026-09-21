/**
 * Replaces the `window.storage` API that only exists inside a Claude
 * artifact. Same shape (async get/set/delete/list returning {key, value}
 * or null), now backed by the account API in worker/index.js instead of
 * localStorage — each key is scoped to whoever is signed in, server-side.
 *
 * This is the only thing that had to change to add accounts: every
 * storage call in App.jsx is unmodified, since it only ever spoke to
 * this same get/set/delete/list shape.
 */

function makeStorage() {
  const base = "/api/kv";

  return {
    async get(key) {
      try {
        const r = await fetch(`${base}/${encodeURIComponent(key)}`, { credentials: "same-origin" });
        if (r.status === 404) return null;
        if (!r.ok) return null;
        const value = await r.text();
        return { key, value };
      } catch {
        return null;
      }
    },

    async set(key, value) {
      try {
        const r = await fetch(`${base}/${encodeURIComponent(key)}`, {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "text/plain" },
          body: value,
        });
        if (!r.ok) return null;
        return { key, value };
      } catch {
        return null;
      }
    },

    async delete(key) {
      try {
        const r = await fetch(`${base}/${encodeURIComponent(key)}`, { method: "DELETE", credentials: "same-origin" });
        if (!r.ok) return null;
        return { key, deleted: true };
      } catch {
        return null;
      }
    },

    async list(prefix) {
      try {
        const r = await fetch(`${base}?prefix=${encodeURIComponent(prefix || "")}`, { credentials: "same-origin" });
        if (!r.ok) return null;
        const data = await r.json();
        return { keys: data.keys };
      } catch {
        return null;
      }
    },
  };
}

export function installStorageShim() {
  if (!window.storage) window.storage = makeStorage();
}
