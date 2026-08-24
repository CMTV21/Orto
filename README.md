# Orto — Garden Planner

Standalone build of the garden planner. Same code that's been running in
chat, minus one change: `src/storage-shim.js` replaces Claude's
`window.storage` with a version backed by the browser's own `localStorage`,
under the `orto:` key prefix. Nothing else in `App.jsx` was touched.

## Run it locally first

```
npm install
npm run dev
```

Opens on `http://localhost:5173`. Worth clicking through once before
deploying — confirm a design saves, reload the page, confirm it's still
there.

## Deploy to Cloudflare Pages

Same workflow as `cmtv.info`.

1. Push this folder to a GitHub repo (a fresh one, or a subfolder of an
   existing one — if it's a subfolder, set "Root directory" in step 3).
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git
   → pick the repo.
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Deploy. Cloudflare gives you a `*.pages.dev` URL immediately; attach a
   real domain or subdomain (e.g. `orto.cmtv.info`) under the project's
   Custom Domains tab once you're happy with it.

Every push to the connected branch redeploys automatically — same as
`cmtv.info`.

## What actually changed from the chat version

Only storage. `App.jsx` is the artifact file unmodified. If you want to
pull a future update from a chat session: replace `src/App.jsx` with the
new version, leave everything else in this folder alone, commit, push.

## Data lives in the browser, not the cloud

Because this uses `localStorage`, a design saved on your phone and a design
saved on your laptop are two separate things — they don't sync. Fine for
one person on one device; worth knowing if you open it in more than one
place. A shared backend (so any device sees the same data) is a separate,
bigger project — not part of this build.

## Known gaps, carried over from the chat version

- **Not laid out for a phone yet.** The three-column Plot tab in particular
  assumes a wide screen. Works, but isn't comfortable on a small one yet.
- **The AI variety lookup in the Seeds tab calls `api.anthropic.com`
  directly from the browser**, exactly as it did in chat. Untested outside
  the chat environment — try it once live and see what happens.
- **Icons are placeholders** (`public/icon-192.png`, `public/icon-512.png`)
  — simple generated circles in the app's colors, not real artwork. Drop in
  real ones with the same filenames and dimensions whenever you want.
