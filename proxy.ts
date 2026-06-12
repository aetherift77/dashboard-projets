// proxy.ts
// ⚠️ Next.js 16 : le fichier `middleware.ts` est déprécié et renommé en `proxy.ts`
// (fonction `proxy` au lieu de `middleware`). Voir node_modules/next/dist/docs/01-app/.../proxy.md
//
// Rôle : protéger TOUTES les routes. Sans cookie de session signé valide,
// l'utilisateur est redirigé vers /login. Le proxy tourne en Edge runtime,
// la vérification utilise donc Web Crypto (via lib/auth).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// Chemins accessibles sans session.
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const valid = await verifySessionToken(token);

  if (!valid) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname && pathname !== "/") {
      url.searchParams.set("from", pathname);
    }
    const res = NextResponse.redirect(url);
    // Si un cookie existe mais est invalide/expiré, on le purge.
    if (token) {
      res.cookies.delete(SESSION_COOKIE);
    }
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Tout sauf les assets internes Next et les fichiers de métadonnées.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
