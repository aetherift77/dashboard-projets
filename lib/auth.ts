// lib/auth.ts
// Helpers d'authentification ISOMORPHES (Edge runtime du proxy + Node runtime des routes).
// On ne manipule JAMAIS le mot de passe ici : uniquement un jeton de session signé (HMAC-SHA256).
// Implémentation basée sur Web Crypto (crypto.subtle), disponible côté Edge comme Node 20+.

export const SESSION_COOKIE = "aether_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 jours, en secondes

const encoder = new TextEncoder();

function base64urlEncode(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(value: string): Uint8Array {
  let s = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  s += "=".repeat(pad);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET manquant ou trop court (>= 16 caractères). Lance: node scripts/set-password.mjs <motdepasse>"
    );
  }
  return secret;
}

async function importKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Format du jeton : `<exp>.<signatureBase64url>` où signature = HMAC-SHA256("<exp>").
// `exp` est un timestamp UNIX en secondes (date d'expiration).
export async function createSessionToken(
  maxAgeSec: number = SESSION_MAX_AGE
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const payload = String(exp);
  const key = await importKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload) as BufferSource
  );
  return `${payload}.${base64urlEncode(sig)}`;
}

// Renvoie true uniquement si la signature est valide ET le jeton non expiré.
// Robuste : toute erreur (secret absent, format invalide…) => false (jamais d'exception).
export async function verifySessionToken(
  token: string | undefined | null
): Promise<boolean> {
  try {
    if (!token) return false;
    const dot = token.indexOf(".");
    if (dot <= 0) return false;

    const payload = token.slice(0, dot);
    const sigPart = token.slice(dot + 1);

    const exp = Number(payload);
    if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;

    const sigBytes = base64urlToBytes(sigPart);
    const key = await importKey();
    // crypto.subtle.verify effectue une comparaison à temps constant.
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as BufferSource,
      encoder.encode(payload) as BufferSource
    );
  } catch {
    return false;
  }
}
