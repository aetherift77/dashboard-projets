"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatutEtape = "todo" | "en_cours" | "bloque" | "termine";

interface Etape {
  id_etape: number;
  id_projet: number | null;
  nom: string;
  description: string | null;
  statut: StatutEtape;
  date_creation: string | null;
  deadline: string | null;
  date_fin: string | null;
}

interface Projet {
  id_projet: number;
  nom: string;
  statut: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUTS: StatutEtape[] = ["todo", "en_cours", "bloque", "termine"];

const STATUT_CONFIG: Record<
  StatutEtape,
  { label: string; color: string; dot: string; icon: React.ReactNode }
> = {
  todo: {
    label: "À faire",
    color: "bg-zinc-700/60 text-zinc-300 border-zinc-700",
    dot: "bg-zinc-500",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="9" strokeWidth={2} />
      </svg>
    ),
  },
  en_cours: {
    label: "En cours",
    color: "bg-blue-900/40 text-blue-300 border-blue-800/50",
    dot: "bg-blue-400",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  bloque: {
    label: "Bloqué",
    color: "bg-rose-900/40 text-rose-300 border-rose-800/50",
    dot: "bg-rose-400",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
  },
  termine: {
    label: "Terminé",
    color: "bg-emerald-900/40 text-emerald-300 border-emerald-800/50",
    dot: "bg-emerald-400",
    icon: (
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(deadline: string | null, statut: StatutEtape): boolean {
  if (!deadline || statut === "termine") return false;
  return new Date(deadline) < new Date();
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProjectProgress({ etapes }: { etapes: Etape[] }) {
  if (etapes.length === 0) return null;
  const done = etapes.filter((e) => e.statut === "termine").length;
  const pct = Math.round((done / etapes.length) * 100);

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-zinc-500 tabular-nums w-9 text-right">
        {done}/{etapes.length}
      </span>
    </div>
  );
}

// ─── Etape Row ────────────────────────────────────────────────────────────────

interface EtapeRowProps {
  etape: Etape;
  projets: Projet[];
  onSave: (updated: Etape) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function EtapeRow({ etape, projets, onSave, onDelete }: EtapeRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Etape>(etape);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setDraft(etape);
  }, [etape]);

  function upd<K extends keyof Etape>(key: K, value: Etape[K]) {
    setDraft((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  const cfg = STATUT_CONFIG[etape.statut];
  const overdue = isOverdue(etape.deadline, etape.statut);
  const linkedProjet = projets.find((p) => p.id_projet === etape.id_projet);

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 ${
        editing
          ? "border-indigo-500/50 bg-zinc-900/90 shadow-lg shadow-indigo-900/10"
          : etape.statut === "termine"
          ? "border-zinc-800/50 bg-zinc-900/30 opacity-70"
          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900/80"
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Status dot / quick toggle */}
        {!editing && (
          <button
            onClick={async () => {
              const next: StatutEtape =
                etape.statut === "todo"
                  ? "en_cours"
                  : etape.statut === "en_cours"
                  ? "termine"
                  : etape.statut === "termine"
                  ? "todo"
                  : "todo";
              await onSave({ ...etape, statut: next });
            }}
            title="Changer statut"
            className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${cfg.color} hover:scale-110`}
          >
            {cfg.icon}
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {editing ? (
            <input
              type="text"
              value={draft.nom}
              onChange={(e) => upd("nom", e.target.value)}
              className="w-full bg-zinc-800 border border-indigo-500/50 text-zinc-100 text-sm font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Nom de l'étape"
            />
          ) : (
            <p
              className={`text-sm font-medium ${
                etape.statut === "termine"
                  ? "line-through text-zinc-500"
                  : "text-zinc-100"
              }`}
            >
              {etape.nom}
            </p>
          )}

          {/* Description */}
          {editing ? (
            <textarea
              value={draft.description ?? ""}
              onChange={(e) => upd("description", e.target.value || null)}
              rows={2}
              placeholder="Description (optionnel)"
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          ) : etape.description ? (
            <p className="text-xs text-zinc-500 leading-relaxed">
              {etape.description}
            </p>
          ) : null}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Statut */}
            {editing ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                  Statut
                </span>
                <select
                  value={draft.statut}
                  onChange={(e) => upd("statut", e.target.value as StatutEtape)}
                  className="bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {STATUTS.map((s) => (
                    <option key={s} value={s}>
                      {STATUT_CONFIG[s].label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            )}

            {/* Projet lié */}
            {editing ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                  Projet
                </span>
                <select
                  value={draft.id_projet ?? ""}
                  onChange={(e) =>
                    upd("id_projet", e.target.value ? Number(e.target.value) : null)
                  }
                  className="bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[160px]"
                >
                  <option value="">— Aucun projet —</option>
                  {projets.map((p) => (
                    <option key={p.id_projet} value={p.id_projet}>
                      #{p.id_projet} {p.nom}
                    </option>
                  ))}
                </select>
              </div>
            ) : linkedProjet ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-900/30 text-indigo-400 text-[11px] border border-indigo-800/40">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M14.828 14.828a4 4 0 015.656 0l.586.586a4 4 0 11-5.656 5.656l-1.102-1.101" />
                </svg>
                {linkedProjet.nom}
              </span>
            ) : null}

            {/* Deadline */}
            {editing ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                  Deadline
                </span>
                <input
                  type="date"
                  value={draft.deadline ?? ""}
                  onChange={(e) => upd("deadline", e.target.value || null)}
                  className="bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            ) : etape.deadline ? (
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                  overdue
                    ? "bg-rose-900/30 text-rose-300 border-rose-800/50"
                    : "bg-zinc-800/60 text-zinc-500 border-zinc-700/50"
                }`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {overdue && "⚠ "}
                {formatDate(etape.deadline)}
              </span>
            ) : null}

            {/* Date fin */}
            {editing ? (
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">
                  Terminé le
                </span>
                <input
                  type="date"
                  value={draft.date_fin ?? ""}
                  onChange={(e) => upd("date_fin", e.target.value || null)}
                  className="bg-zinc-800 border border-zinc-600 text-zinc-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            ) : etape.date_fin ? (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-900/20 text-emerald-500 border border-emerald-800/30">
                ✓ {formatDate(etape.date_fin)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : "✓"}
                Sauver
              </button>
              <button
                onClick={() => { setDraft(etape); setEditing(false); }}
                className="px-2 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              {confirmDelete ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => onDelete(etape.id_etape)}
                    className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
                  >
                    Suppr.
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-900/50 text-zinc-500 hover:text-rose-400 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create Etape Modal ───────────────────────────────────────────────────────

function CreateModal({
  projets,
  onClose,
  onCreate,
}: {
  projets: Projet[];
  onClose: () => void;
  onCreate: (e: Omit<Etape, "id_etape" | "date_creation">) => Promise<void>;
}) {
  const [form, setForm] = useState<Omit<Etape, "id_etape" | "date_creation">>({
    nom: "",
    description: null,
    statut: "todo",
    id_projet: null,
    deadline: null,
    date_fin: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function upd<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.nom.trim()) { setError("Le nom est requis."); return; }
    setSaving(true);
    await onCreate(form);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 mx-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-zinc-100">Nouvelle étape</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Nom <span className="text-rose-400">*</span>
            </label>
            <input type="text" value={form.nom} onChange={(e) => upd("nom", e.target.value)}
              placeholder="Nom de l'étape" autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea value={form.description ?? ""} onChange={(e) => upd("description", e.target.value || null)}
              rows={2} placeholder="Description (optionnel)"
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Statut</label>
              <select value={form.statut} onChange={(e) => upd("statut", e.target.value as StatutEtape)}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {STATUTS.map((s) => (
                  <option key={s} value={s}>{STATUT_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Projet lié</label>
              <select value={form.id_projet ?? ""}
                onChange={(e) => upd("id_projet", e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">— Aucun —</option>
                {projets.map((p) => (
                  <option key={p.id_projet} value={p.id_projet}>
                    #{p.id_projet} {p.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Deadline</label>
            <input type="date" value={form.deadline ?? ""}
              onChange={(e) => upd("deadline", e.target.value || null)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>

          {error && <p className="text-rose-400 text-sm">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm font-medium transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {saving && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EtapesPage() {
  const [etapes, setEtapes] = useState<Etape[]>([]);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterProjet, setFilterProjet] = useState<number | "all">("all");
  const [filterStatut, setFilterStatut] = useState<StatutEtape | "all">("all");
  const [groupByProjet, setGroupByProjet] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  async function fetchAll() {
    setLoading(true);
    const [{ data: etapesData }, { data: projetsData }] = await Promise.all([
      supabase.from("etapes").select("*").order("id_etape", { ascending: false }),
      supabase.from("projets").select("id_projet, nom, statut").order("nom"),
    ]);
    setEtapes((etapesData as Etape[]) ?? []);
    setProjets((projetsData as Projet[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  // ── Create ───────────────────────────────────────────────────────────────

  async function handleCreate(form: Omit<Etape, "id_etape" | "date_creation">) {
    const { data, error } = await supabase
      .from("etapes")
      .insert([{
        nom: form.nom,
        description: form.description,
        statut: form.statut,
        id_projet: form.id_projet,
        deadline: form.deadline,
        date_fin: form.date_fin,
      } as any])
      .select()
      .single();

    if (error) { alert(`Erreur : ${error.message}`); return; }
    setEtapes((prev) => [data as Etape, ...prev]);
    setShowCreate(false);
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  async function handleSave(updated: Etape) {
    const { error } = await supabase
      .from("etapes")
      .update({
        nom: updated.nom,
        description: updated.description,
        statut: updated.statut,
        id_projet: updated.id_projet,
        deadline: updated.deadline,
        date_fin: updated.date_fin,
      } as any)
      .eq("id_etape", updated.id_etape);

    if (error) { alert(`Erreur : ${error.message}`); return; }
    setEtapes((prev) =>
      prev.map((e) => (e.id_etape === updated.id_etape ? updated : e))
    );
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete(id: number) {
    const { error } = await supabase.from("etapes").delete().eq("id_etape", id);
    if (error) { alert(`Erreur : ${error.message}`); return; }
    setEtapes((prev) => prev.filter((e) => e.id_etape !== id));
  }

  // ── Filter ───────────────────────────────────────────────────────────────

  const filtered = etapes.filter((e) => {
    if (filterProjet !== "all" && e.id_projet !== filterProjet) return false;
    if (filterStatut !== "all" && e.statut !== filterStatut) return false;
    return true;
  });

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    total: etapes.length,
    todo: etapes.filter((e) => e.statut === "todo").length,
    en_cours: etapes.filter((e) => e.statut === "en_cours").length,
    bloque: etapes.filter((e) => e.statut === "bloque").length,
    termine: etapes.filter((e) => e.statut === "termine").length,
  };

  // ── Grouped render ────────────────────────────────────────────────────────

  function renderGrouped() {
    const byProjet = new Map<number | null, Etape[]>();
    filtered.forEach((e) => {
      const key = e.id_projet;
      if (!byProjet.has(key)) byProjet.set(key, []);
      byProjet.get(key)!.push(e);
    });

    return Array.from(byProjet.entries()).map(([projetId, items]) => {
      const projet = projets.find((p) => p.id_projet === projetId);
      return (
        <div key={projetId ?? "none"} className="space-y-2">
          <div className="flex items-center gap-3 py-1">
            <span className="text-sm font-semibold text-zinc-300">
              {projet ? `${projet.nom}` : "Sans projet"}
            </span>
            <span className="text-xs text-zinc-600">
              {items.length} étape{items.length > 1 ? "s" : ""}
            </span>
            <div className="flex-1">
              <ProjectProgress etapes={items} />
            </div>
          </div>
          <div className="space-y-2 pl-2 border-l border-zinc-800">
            {items.map((e) => (
              <EtapeRow key={e.id_etape} etape={e} projets={projets}
                onSave={handleSave} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      );
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const selectBase =
    "bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="font-bold text-zinc-100 text-base">Étapes</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-900/30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle étape
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "À faire", value: stats.todo, color: "text-zinc-300", bg: "bg-zinc-800/50" },
            { label: "En cours", value: stats.en_cours, color: "text-blue-300", bg: "bg-blue-900/20" },
            { label: "Bloquées", value: stats.bloque, color: "text-rose-300", bg: "bg-rose-900/20" },
            { label: "Terminées", value: stats.termine, color: "text-emerald-300", bg: "bg-emerald-900/20" },
          ].map(({ label, value, color, bg }) => (
            <div key={label}
              className={`${bg} rounded-2xl border border-zinc-800 px-4 py-3`}>
              <p className="text-xs text-zinc-500">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Global progress */}
        {etapes.length > 0 && (
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-300">Progression globale</span>
              <span className="text-sm font-bold text-zinc-100">
                {Math.round((stats.termine / stats.total) * 100)}%
              </span>
            </div>
            <ProjectProgress etapes={etapes} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={filterProjet === "all" ? "all" : String(filterProjet)}
            onChange={(e) =>
              setFilterProjet(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className={selectBase}>
            <option value="all">Tous les projets</option>
            {projets.map((p) => (
              <option key={p.id_projet} value={p.id_projet}>
                #{p.id_projet} {p.nom}
              </option>
            ))}
          </select>

          <select value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value as StatutEtape | "all")}
            className={selectBase}>
            <option value="all">Tous les statuts</option>
            {STATUTS.map((s) => (
              <option key={s} value={s}>{STATUT_CONFIG[s].label}</option>
            ))}
          </select>

          <button
            onClick={() => setGroupByProjet((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              groupByProjet
                ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h8m-8 4h8" />
            </svg>
            Grouper par projet
          </button>

          <span className="ml-auto text-xs text-zinc-600">
            {filtered.length} étape{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-zinc-600 text-sm">
              {etapes.length === 0 ? "Aucune étape. Commencez !" : "Aucune étape ne correspond."}
            </p>
            {etapes.length === 0 && (
              <button onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold">
                Créer une étape
              </button>
            )}
          </div>
        ) : groupByProjet ? (
          <div className="space-y-6">{renderGrouped()}</div>
        ) : (
          <div className="space-y-2">
            {filtered.map((e) => (
              <EtapeRow key={e.id_etape} etape={e} projets={projets}
                onSave={handleSave} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal projets={projets} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}