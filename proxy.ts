// proxy.ts
// ⚠️ Next.js 16 : le fichier `middleware.ts` est déprécié et renommé en `proxy.ts`
// (fonction `proxy` au lieu de `middleware`).
//
// Rôle : protéger TOUTES les routes. Sans cookie de session signé valide,
// l'utilisateur est redirigé vers /login. Tourne en Edge runtime (Web Crypto via lib/auth).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Chemins accessibles sans session.
const PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/cron", // protégé par CRON_SECRET, appelé sans cookie par Vercel Cron
];

// Fichiers PWA servis publiquement (manifest, service worker, icônes).
const PUBLIC_FILES = [
  "/sw.js",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-icon.png",
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_FILES.includes(pathname)) return true;
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function safeFrom(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // Page de connexion : si déjà authentifié, on renvoie vers l'app (évite d'afficher
  // le login à un utilisateur déjà connecté). Sinon on laisse passer.
  if (pathname === "/login") {
    if (await verifySessionToken(token)) {
      const url = request.nextUrl.clone();
      url.pathname = safeFrom(request.nextUrl.searchParams.get("from"));
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Toutes les autres routes exigent une session valide.
  if (!(await verifySessionToken(token))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname && pathname !== "/") {
      url.searchParams.set("from", pathname);
    }
    const res = NextResponse.redirect(url);
    if (token) {
      res.cookies.delete(SESSION_COOKIE);
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
