/* Orto's backend: magic-link auth plus a per-user key/value store that
   mirrors the exact shape App.jsx already expects from `window.storage`
   (get/set/delete/list). That's deliberate — none of the app's design or
   index logic had to change, only src/storage-shim.js, which now calls
   these routes over fetch() instead of reading localStorage. */

const SESSION_COOKIE = "orto_session";
const SESSION_DAYS = 30;
const LINK_MINUTES = 15;

function randomToken(bytes = 24) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const out = {};
  header.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i === -1) return;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function setCookieHeader(name, value, maxAgeSeconds, secure) {
  // Secure cookies are silently refused by real browsers over plain http,
  // which is exactly what local `wrangler dev` serves — only require it
  // when the request that triggered this actually came in over https, as
  // it always will on the real deployment.
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (secure) parts.push("Secure");
  parts.push(`Max-Age=${maxAgeSeconds}`);
  return parts.join("; ");
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

async function getSessionUser(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT s.user_id AS user_id, s.expires_at AS expires_at, u.email AS email
     FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`
  ).bind(token).first();
  if (!row || row.expires_at < Date.now()) return null;
  return { id: row.user_id, email: row.email };
}

async function sendMagicLinkEmail(env, email, link) {
  const text = `Sign in to Orto: ${link}\n\nThis link works for ${LINK_MINUTES} minutes. If you didn't ask for this, ignore it.`;
  const html = `<p>Sign in to Orto:</p><p><a href="${link}">${link}</a></p><p>This link works for ${LINK_MINUTES} minutes. If you didn't ask for this, ignore it.</p>`;
  const res = await env.EMAILER.fetch("https://cmtv-emailer.internal/send", {
    method: "POST",
    headers: { to: email, subject: "Sign in to Orto", text, html },
  });
  if (!res.ok) throw new Error(`emailer responded ${res.status}`);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/api/auth/request" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      const email = String(body.email || "").trim().toLowerCase();
      if (!email || !email.includes("@") || email.length > 200) {
        return json({ error: "Enter a valid email address." }, { status: 400 });
      }
      const token = randomToken();
      const now = Date.now();
      await env.DB.prepare(
        "INSERT INTO magic_links (token, email, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)"
      ).bind(token, email, now + LINK_MINUTES * 60000, now).run();
      const link = `${url.origin}/api/auth/verify?token=${token}`;
      try {
        await sendMagicLinkEmail(env, email, link);
      } catch {
        return json({ error: "Couldn't send that email right now — try again shortly." }, { status: 502 });
      }
      return json({ ok: true });
    }

    if (pathname === "/api/auth/verify" && request.method === "GET") {
      const token = url.searchParams.get("token") || "";
      const row = token && await env.DB.prepare("SELECT * FROM magic_links WHERE token = ?").bind(token).first();
      if (!row || row.used || row.expires_at < Date.now()) {
        return new Response(
          "This sign-in link is invalid or has expired. Go back to Orto and request a new one.",
          { status: 400, headers: { "Content-Type": "text/plain" } }
        );
      }
      await env.DB.prepare("UPDATE magic_links SET used = 1 WHERE token = ?").bind(token).run();

      let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(row.email).first();
      if (!user) {
        const id = randomToken(12);
        await env.DB.prepare("INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)")
          .bind(id, row.email, Date.now()).run();
        user = { id, email: row.email };
      }

      const sessionToken = randomToken();
      const now = Date.now();
      await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
        .bind(sessionToken, user.id, now + SESSION_DAYS * 86400000, now).run();

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Set-Cookie": setCookieHeader(SESSION_COOKIE, sessionToken, SESSION_DAYS * 86400, url.protocol === "https:"),
        },
      });
    }

    if (pathname === "/api/auth/logout" && request.method === "POST") {
      const token = parseCookies(request)[SESSION_COOKIE];
      if (token) await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
      return json({ ok: true }, { headers: { "Set-Cookie": setCookieHeader(SESSION_COOKIE, "", 0, url.protocol === "https:") } });
    }

    if (pathname === "/api/session" && request.method === "GET") {
      const user = await getSessionUser(request, env);
      return json(user ? { loggedIn: true, email: user.email } : { loggedIn: false });
    }

    if (pathname.startsWith("/api/kv")) {
      const user = await getSessionUser(request, env);
      if (!user) return json({ error: "Not signed in." }, { status: 401 });

      if (pathname === "/api/kv" && request.method === "GET") {
        const prefix = url.searchParams.get("prefix") || "";
        const rows = await env.DB.prepare("SELECT key FROM kv WHERE user_id = ? AND key LIKE ?")
          .bind(user.id, prefix + "%").all();
        return json({ keys: rows.results.map((r) => r.key) });
      }

      const m = pathname.match(/^\/api\/kv\/(.+)$/);
      if (m) {
        const key = decodeURIComponent(m[1]);
        if (request.method === "GET") {
          const row = await env.DB.prepare("SELECT value FROM kv WHERE user_id = ? AND key = ?")
            .bind(user.id, key).first();
          if (!row) return new Response(null, { status: 404 });
          return new Response(row.value, { headers: { "Content-Type": "text/plain" } });
        }
        if (request.method === "PUT") {
          const value = await request.text();
          await env.DB.prepare(
            `INSERT INTO kv (user_id, key, value, updated_at) VALUES (?, ?, ?, ?)
             ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
          ).bind(user.id, key, value, Date.now()).run();
          return json({ ok: true });
        }
        if (request.method === "DELETE") {
          await env.DB.prepare("DELETE FROM kv WHERE user_id = ? AND key = ?").bind(user.id, key).run();
          return json({ ok: true });
        }
      }
      return json({ error: "Not found" }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
};
