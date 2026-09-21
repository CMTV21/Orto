import { useState, useEffect, cloneElement } from "react";

/**
 * Gates the whole app behind a signed-in session. Nothing in App.jsx runs
 * until this resolves to "in" — the boot effect's window.storage calls
 * would otherwise all 401 against an anonymous session.
 */
export default function AuthGate({ children }) {
  const [status, setStatus] = useState("checking"); // checking | anon | in
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    fetch("/api/session", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => {
        if (d.loggedIn) { setUserEmail(d.email); setStatus("in"); }
        else setStatus("anon");
      })
      .catch(() => setStatus("anon"));
  }, []);

  const requestLink = async (e) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const r = await fetch("/api/auth/request", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) { setError(data.error || "Couldn't send that — try again in a moment."); return; }
      setSent(true);
    } catch {
      setError("Couldn't reach the server — check your connection.");
    } finally {
      setSending(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
    window.location.reload();
  };

  if (status === "checking") {
    return <div style={S.page} />;
  }

  if (status === "anon") {
    return (
      <div style={S.page}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Alegreya:wght@700;800&family=Archivo:wght@400;500&display=swap');`}</style>
        <div style={S.card}>
          <div style={S.brand}>
            <svg viewBox="0 0 100 100" style={{ width: 28, height: 28, color: "#CC9E11" }} aria-hidden="true">
              <path d="M50 84 L50 46" stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none" />
              <path d="M50 60 C 34 60, 26 48, 26 32 C 42 32, 50 44, 50 60 Z" fill="currentColor" />
              <path d="M50 52 C 66 52, 74 40, 74 24 C 58 24, 50 36, 50 52 Z" fill="currentColor" />
            </svg>
            <h1 style={S.title}>Orto</h1>
          </div>
          <p style={S.sub}>A kitchen garden planner. Sign in to open your garden.</p>

          {sent ? (
            <p style={S.sentMsg}>
              Check <strong>{email.trim()}</strong> for a sign-in link — it works for 15 minutes.
            </p>
          ) : (
            <form onSubmit={requestLink} style={S.form}>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={S.input}
              />
              <button type="submit" disabled={sending} style={S.button}>
                {sending ? "Sending…" : "Email me a sign-in link"}
              </button>
            </form>
          )}
          {error && <p style={S.error}>{error}</p>}
        </div>
      </div>
    );
  }

  return cloneElement(children, { userEmail, onLogout: logout });
}

const S = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #1B3729 0%, #2B5037 100%)",
    fontFamily: "'Archivo', system-ui, sans-serif", padding: 20,
  },
  card: {
    background: "#FDFEFC", borderRadius: 12, padding: "32px 28px", width: "100%", maxWidth: 380,
    boxShadow: "0 20px 60px rgba(0,0,0,.3)",
  },
  brand: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 },
  title: { fontFamily: "'Alegreya', Georgia, serif", fontWeight: 800, fontSize: 30, margin: 0, color: "#1E241B" },
  sub: { color: "#5A6455", fontSize: 13.5, margin: "0 0 20px" },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  input: {
    padding: "10px 12px", fontSize: 14, border: "1px solid #DEE3D5", borderRadius: 6,
    fontFamily: "inherit", color: "#1E241B", background: "#fff",
  },
  button: {
    padding: "10px 12px", fontSize: 14, fontWeight: 600, border: "none", borderRadius: 6,
    background: "#2C843E", color: "#fff", cursor: "pointer",
  },
  sentMsg: { fontSize: 14, color: "#1E241B", lineHeight: 1.5 },
  error: { color: "#A32E27", fontSize: 13, marginTop: 12 },
};
