"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellRing } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { subscribeToPush, notificationPermission } from "@/lib/notifications";
import { type Projet, isOverdue, formatDate } from "@/lib/types";

const WINDOW_DAYS = 3;
const STATUTS_INACTIFS = ["Operationnel", "Maintenance", "Abandonne"];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPerm(notificationPermission());
    (async () => {
      const { data } = await supabase
        .from("projets")
        .select("id_projet, nom, description, statut, priorite, localisation, deadline")
        .not("deadline", "is", null);
      setProjets((data as Projet[]) ?? []);
    })();
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const limit = new Date();
  limit.setHours(0, 0, 0, 0);
  limit.setDate(limit.getDate() + WINDOW_DAYS);

  const alerts = projets
    .filter((p) => !STATUTS_INACTIFS.includes(p.statut))
    .filter((p) => p.deadline && new Date(p.deadline) <= limit)
    .sort((a, b) => ((a.deadline ?? "") < (b.deadline ?? "") ? -1 : 1));

  const overdueCount = alerts.filter((p) => isOverdue(p.deadline)).length;

  async function enable() {
    setBusy(true);
    setMsg(null);
    const r = await subscribeToPush();
    setBusy(false);
    setPerm(notificationPermission());
    setMsg(r.ok ? "Notifications activées ✓" : (r.error ?? "Erreur"));
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
      >
        {alerts.length > 0 ? <BellRing size={18} /> : <Bell size={18} />}
        {alerts.length > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
            overdueCount > 0 ? "bg-rose-600 text-white" : "bg-indigo-600 text-white"
          }`}>
            {alerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 bottom-12 w-72 max-h-[60vh] overflow-auto bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl z-50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-200">Deadlines</span>
            <span className="text-xs text-zinc-500">{alerts.length}</span>
          </div>

          {alerts.length === 0 ? (
            <p className="text-xs text-zinc-600 py-3 text-center">Aucune deadline imminente 🎉</p>
          ) : (
            <ul className="space-y-1.5">
              {alerts.map((p) => {
                const od = isOverdue(p.deadline);
                return (
                  <li key={p.id_projet}>
                    <Link
                      href={`/projets/${p.id_projet}`}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-2 bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                    >
                      <div className="text-sm text-zinc-100 truncate">{p.nom}</div>
                      <div className={`text-xs ${od ? "text-rose-400" : "text-amber-400"}`}>
                        {od ? "⚠ En retard — " : "⏳ "}{formatDate(p.deadline)}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-zinc-800 pt-2">
            {perm === "granted" ? (
              <p className="text-xs text-emerald-400">🔔 Notifications push activées</p>
            ) : perm === "unsupported" ? (
              <p className="text-xs text-zinc-600">Push non supporté par ce navigateur.</p>
            ) : (
              <button
                onClick={enable}
                disabled={busy}
                className="w-full text-xs px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors disabled:opacity-50"
              >
                {busy ? "Activation…" : "Activer les notifications push"}
              </button>
            )}
            {msg && <p className="text-[11px] text-zinc-400 mt-1">{msg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
