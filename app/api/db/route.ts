// app/api/db/route.ts
// Proxy de données AUTHENTIFIÉ. Le client n'accède plus à Supabase directement :
// il passe par cette route, qui vérifie le cookie de session puis exécute la requête
// avec la clé service_role (côté serveur uniquement). RLS peut donc bloquer tout accès
// anonyme direct à la base sans casser l'application.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tables que le client est autorisé à manipuler (l'utilisateur authentifié est le propriétaire).
const ALLOWED_TABLES = new Set(["projets", "etapes", "inventaire"]);

type Spec = {
  table?: string;
  op?: "select" | "insert" | "update" | "delete";
  columns?: string;
  eq?: [string, unknown];
  notNull?: string;
  order?: { column: string; ascending?: boolean };
  single?: boolean;
  returning?: boolean;
  values?: unknown;
};

export async function POST(request: NextRequest) {
  if (!(await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value))) {
    return NextResponse.json({ data: null, error: "Non autorisé" }, { status: 401 });
  }

  let spec: Spec;
  try {
    spec = await request.json();
  } catch {
    return NextResponse.json({ data: null, error: "JSON invalide" }, { status: 400 });
  }

  const { table, op } = spec;
  if (!table || !ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ data: null, error: "Table non autorisée" }, { status: 400 });
  }

  const db = supabaseAdmin();

  try {
    if (op === "select") {
      let q: any = db.from(table).select(spec.columns ?? "*");
      if (spec.eq) q = q.eq(spec.eq[0], spec.eq[1]);
      if (spec.notNull) q = q.not(spec.notNull, "is", null);
      if (spec.order) q = q.order(spec.order.column, { ascending: spec.order.ascending ?? true });
      if (spec.single) q = q.single();
      const { data, error } = await q;
      return NextResponse.json({ data, error: error?.message ?? null });
    }

    if (op === "insert") {
      let q: any = db.from(table).insert(spec.values as any);
      if (spec.returning) {
        q = q.select();
        if (spec.single) q = q.single();
      }
      const { data, error } = await q;
      return NextResponse.json({ data, error: error?.message ?? null });
    }

    if (op === "update") {
      if (!spec.eq) return NextResponse.json({ data: null, error: "update requiert eq" }, { status: 400 });
      const { error } = await db.from(table).update(spec.values as any).eq(spec.eq[0], spec.eq[1]);
      return NextResponse.json({ data: null, error: error?.message ?? null });
    }

    if (op === "delete") {
      let q: any = db.from(table).delete();
      if (spec.eq) q = q.eq(spec.eq[0], spec.eq[1]);
      const { error } = await q;
      return NextResponse.json({ data: null, error: error?.message ?? null });
    }
  } catch (err) {
    return NextResponse.json(
      { data: null, error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: null, error: "Opération inconnue" }, { status: 400 });
}
