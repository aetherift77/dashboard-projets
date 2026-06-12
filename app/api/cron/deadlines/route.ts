// app/api/cron/deadlines/route.ts
// Tâche planifiée (Vercel Cron) : envoie une notification push résumée pour les
// projets en retard ou dont la deadline tombe dans les 3 prochains jours.
// Protégé par CRON_SECRET (Vercel Cron envoie Authorization: Bearer <CRON_SECRET>).
//
// Prérequis : npm install web-push  +  variables VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALERT_WINDOW_DAYS = 3;
const STATUTS_INACTIFS = ["Operationnel", "Maintenance", "Abandonne"];

function configureVapid(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  return true;
}

export async function GET(request: NextRequest) {
  // Authentification du cron
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }
  if (!configureVapid()) {
    return NextResponse.json({ error: "VAPID non configuré" }, { status: 500 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().slice(0, 10);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + ALERT_WINDOW_DAYS);
  const limitStr = limit.toISOString().slice(0, 10);

  const { data: projetsData } = await supabaseAdmin()
    .from("projets")
    .select("id_projet, nom, deadline, statut")
    .not("deadline", "is", null)
    .lte("deadline", limitStr);

  const rows = ((projetsData as { id_projet: number; nom: string; deadline: string; statut: string }[]) ?? [])
    .filter((p) => !STATUTS_INACTIFS.includes(p.statut));

  const overdue = rows.filter((p) => p.deadline < todayStr);
  const soon = rows.filter((p) => p.deadline >= todayStr);

  if (overdue.length + soon.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "aucune deadline" });
  }

  const parts: string[] = [];
  if (overdue.length) parts.push(`${overdue.length} en retard`);
  if (soon.length) parts.push(`${soon.length} à venir (≤${ALERT_WINDOW_DAYS}j)`);

  const payload = JSON.stringify({
    title: "⚡ Aether — deadlines",
    body: parts.join(" · "),
    url: "/",
    tag: "aether-deadlines",
  });

  const { data: subsData } = await supabaseAdmin().from("push_subscriptions").select("endpoint, p256dh, auth");
  const subs = (subsData as { endpoint: string; p256dh: string; auth: string }[]) ?? [];

  let sent = 0;
  const stale: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) stale.push(s.endpoint);
      }
    })
  );

  if (stale.length) {
    await supabaseAdmin().from("push_subscriptions").delete().in("endpoint", stale);
  }

  return NextResponse.json({
    ok: true, sent, overdue: overdue.length, soon: soon.length, removed: stale.length,
  });
}
