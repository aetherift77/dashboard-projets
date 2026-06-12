// app/api/auth/login/route.ts
// Route de connexion (POST). Tourne en Node runtime pour utiliser scrypt natif (zéro dépendance).
// Sécurités : vérif mot de passe par scrypt + comparaison à temps constant, rate-limiting
// avec lockout par IP, contrôle d'Origin (anti-CSRF), cookie httpOnly/secure/sameSite=strict.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSessionToken,
} from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const scrypt = promisify(_scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number
) => Promise<Buffer>;

// --- Rate limiting en mémoire (best-effort, par instance serverless) ---
const WINDOW_MS = 15 * 60 * 1000; // fenêtre de 15 minutes
const MAX_ATTEMPTS = 5; // tentatives avant lockout

type Bucket = { count: number; first: number; lockedUntil: number };
const attempts = new Map<string, Bucket>();

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function checkRate(ip: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const b = attempts.get(ip);
  if (!b) return { ok: true };
  if (b.lockedUntil && now < b.lockedUntil) {
    return { ok: false, retryAfter: Math.ceil((b.lockedUntil - now) / 1000) };
  }
  if (now - b.first > WINDOW_MS) {
    attempts.delete(ip);
  }
  return { ok: true };
}

function recordFail(ip: string): void {
  const now = Date.now();
  const b = attempts.get(ip);
  if (!b || now - b.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now, lockedUntil: 0 });
    return;
  }
  b.count += 1;
  if (b.count >= MAX_ATTEMPTS) {
    b.lockedUntil = now + WINDOW_MS;
  }
}

function recordSuccess(ip: string): void {
  attempts.delete(ip);
}

// Vérifie le mot de passe contre DASHBOARD_PASSWORD_HASH (format `scrypt$<saltHex>$<hashHex>`).
// Repli sur DASHBOARD_PASSWORD (clair) si aucun hash n'est configuré — déconseillé, juste pour démarrer.
async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.DASHBOARD_PASSWORD_HASH;
  if (hash) {
    const parts = hash.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    let derived: Buffer;
    try {
      derived = await scrypt(password, salt, expected.length);
    } catch {
      return false;
    }
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  }

  const plain = process.env.DASHBOARD_PASSWORD;
  if (plain) {
    const a = Buffer.from(password);
    const b = Buffer.from(plain);
    if (a.length !== b.length) {
      timingSafeEqual(a, a); // comparaison factice pour limiter la fuite de timing
      return false;
    }
    return timingSafeEqual(a, b);
  }

  return false;
}

// Anti-CSRF basique : pour une requête avec en-tête Origin, il doit correspondre à l'hôte.
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // certains clients n'envoient pas d'Origin
  try {
    const host = req.headers.get("host");
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Origin invalide" }, { status: 403 });
  }

  const ip = clientIp(request);
  const rate = checkRate(ip);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessaie plus tard." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter ?? 900) } }
    );
  }

  let password = "";
  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!password) {
    recordFail(ip);
    return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
  }

  const ok = await verifyPassword(password);
  if (!ok) {
    recordFail(ip);
    return NextResponse.json(
      { error: "Mot de passe incorrect" },
      { status: 401 }
    );
  }

  recordSuccess(ip);

  let token: string;
  try {
    token = await createSessionToken();
  } catch {
    return NextResponse.json(
      { error: "Configuration serveur incomplète (AUTH_SECRET)." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}

export function GET() {
  return NextResponse.json({ error: "Méthode non autorisée" }, { status: 405 });
}
