// _middleware.js — Cloudflare Pages Function that gates the whole site behind a
// shared PIN. Runs on every request; sets an HMAC-signed HttpOnly cookie on the
// correct PIN, otherwise serves a PIN form.
//
// Configure in the Pages project (Settings -> Variables and secrets):
//   SITE_PIN     the PIN to enter (defaults to "1245" if unset)
//   SITE_SECRET  random string used to sign the cookie (recommended)
//
// NOTE: a short shared PIN is weak (brute-forceable, no per-user identity). The
// published summary.json is aggregates only, so the blast radius is limited.

const COOKIE = "bench_auth";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function expectedToken(env) {
  const pin = String(env.SITE_PIN || "1245");
  const secret = String(env.SITE_SECRET || "sig-" + pin);
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("authed:" + pin));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=+$/, "");
}

function loginPage(message) {
  const err = message ? `<p class="err">${message}</p>` : "";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CAM-LLM Benchmark — sign in</title>
<style>
  body{font:16px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:grid;place-items:center;
       min-height:100vh;margin:0;background:#0b1020;color:#e6e9f0}
  form{background:#151b30;padding:28px 32px;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.4);width:300px}
  h1{font-size:18px;margin:0 0 6px}.hint{color:#9aa3bd;font-size:13px;margin:0 0 16px}
  input{width:100%;padding:12px;font-size:20px;letter-spacing:6px;text-align:center;border-radius:8px;
        border:1px solid #2a3354;background:#0b1020;color:#e6e9f0}
  button{width:100%;margin-top:14px;padding:11px;font-size:15px;border:0;border-radius:8px;background:#3b82f6;color:#fff;cursor:pointer}
  .err{color:#f87171;font-size:13px;margin:0 0 12px}
</style></head><body>
<form method="POST" action="/login" autocomplete="off">
  <h1>CAM-LLM Benchmark</h1><p class="hint">Enter the access PIN.</p>${err}
  <input name="pin" inputmode="numeric" autocomplete="off" autofocus placeholder="••••" aria-label="PIN">
  <button type="submit">Unlock</button>
</form></body></html>`;
  return new Response(html, {
    status: message ? 401 : 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const token = await expectedToken(env);

  if (url.pathname === "/logout") {
    return new Response(null, {
      status: 303,
      headers: {
        "Location": "/",
        "Set-Cookie": `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`,
      },
    });
  }

  if (request.method === "POST" && url.pathname === "/login") {
    const form = await request.formData();
    const pin = String(form.get("pin") || "").trim();
    if (pin === String(env.SITE_PIN || "1245")) {
      return new Response(null, {
        status: 303,
        headers: {
          "Location": "/",
          "Set-Cookie": `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`,
          "cache-control": "no-store",
        },
      });
    }
    return loginPage("Wrong PIN — try again.");
  }

  const cookies = (request.headers.get("Cookie") || "").split(";").map((c) => c.trim());
  if (cookies.includes(`${COOKIE}=${token}`)) return next();

  return loginPage();
}
