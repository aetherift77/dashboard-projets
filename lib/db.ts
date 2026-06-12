// lib/db.ts
// Helpers CLIENT pour accéder aux données via la route authentifiée /api/db.
// Remplacent les appels directs à Supabase côté navigateur.
// Tous renvoient { data, error } où `error` est une chaîne (ou null).

type Result<T = any> = { data: T | null; error: string | null };

type SelectOpts = {
  columns?: string;
  eq?: [string, unknown];
  notNull?: string;
  order?: { column: string; ascending?: boolean };
  single?: boolean;
};

async function call<T = any>(spec: Record<string, unknown>): Promise<Result<T>> {
  try {
    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(spec),
    });
    const json = await res.json().catch(() => ({ data: null, error: "Réponse invalide" }));
    if (!res.ok) return { data: null, error: json?.error ?? `Erreur ${res.status}` };
    return json as Result<T>;
  } catch {
    return { data: null, error: "Erreur réseau" };
  }
}

export function dbSelect<T = any>(table: string, opts: SelectOpts = {}): Promise<Result<T>> {
  return call<T>({ table, op: "select", ...opts });
}

export function dbInsert<T = any>(
  table: string,
  values: unknown,
  opts: { returning?: boolean; single?: boolean } = {}
): Promise<Result<T>> {
  return call<T>({ table, op: "insert", values, ...opts });
}

export function dbUpdate(table: string, values: unknown, eq: [string, unknown]): Promise<Result> {
  return call({ table, op: "update", values, eq });
}

export function dbDelete(table: string, eq: [string, unknown]): Promise<Result> {
  return call({ table, op: "delete", eq });
}
