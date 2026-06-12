// app/api/push/subscribe/route.ts
// Enregistre (ou supprime) un abonnement Web Push dans Supabase.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let sub: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    const body = await request.json();
    sub = body?.subscription ?? body;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Abonnement incomplet" }, { status: 400 });
  }

  const { error } = await supabaseAdmin()
    .from("push_subscriptions")
    .upsert(
      { endpoint, p256dh, auth, user_agent: request.headers.get("user-agent") } as any,
      { onConflict: "endpoint" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  let endpoint: string | undefined;
  try { endpoint = (await request.json())?.endpoint; } catch { endpoint = undefined; }
  if (!endpoint) return NextResponse.json({ error: "endpoint requis" }, { status: 400 });
  await supabaseAdmin().from("push_subscriptions").delete().eq("endpoint", endpoint);
  return NextResponse.json({ ok: true });
}
