"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Localisation = "indetermine" | "maison" | "apart" | "autre";
type Statut =
  | "Idée"
  | "Definition"
  | "Preparation"
  | "Production"
  | "Operationnel"
  | "Maintenance"
  | "Abandonne";
type Priorite = "Low" | "Medium" | "High";
type StatutEtape = "todo" | "en_cours" | "bloque" | "termine";

interface Projet {
  id_projet: number;
  nom: string;
  description: string | null;
  notes: string | null;
  statut: Statut;
  priorite: Priorite;
  localisation: Localisation;
  date_og: string | null;
  deadline: string | null;
}

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

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUTS: Statut[] = [
  "Idée", "Definition", "Preparation", "Production",
  "Operationnel", "Maintenance", "Abandonne",
];

const STATUT_COLORS: Record<Statut, string> = {
  Idée:         "bg-slate-700 text-slate-200",
  Definition:   "bg-indigo-900/70 text-indigo-300",
  Preparation:  "bg-violet-900/70 text-violet-300",
  Production:   "bg-amber-900/70 text-amber-300",
  Operationnel: "bg-emerald-900/70 text-emerald-300",
  Maintenance:  "bg-teal-900/70 text-teal-300",
  Abandonne:    "bg-zinc-800 text-zinc-500",
};

const PRIORITE_COLORS: Record<Priorite, string> = {
  Low:    "bg-zinc-700 text-zinc-300",
  Medium: "bg-amber-900/70 text-amber-300",
  High:   "bg-rose-900/70 text-rose-300",
};

const LOCALISATION_LABELS: Record<Localisation, string> = {
  indetermine: "— Indéterminé",
  maison:      "🏠 Maison",
  apart:       "🏢 Appartement",
  autre:       "📍 Autre",
};

const ETAPE_STATUT: Record<StatutEtape, { label: string; color: string; dot: string }> = {
  todo:     { label: "À faire",  color: "text-zinc-400",    dot: "bg-zinc-500" },
  en_cours: { label: "En cours", color: "text-blue-400",    dot: "bg-blue-400" },
  bloque:   { label: "Bloqué",   color: "text-rose-400",    dot: "bg-rose-400" },
  termine:  { label: "Terminé",  color: "text-emerald-400", dot: "bg-emerald-400" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function isOverdue(d: string | null) {
  if (!d) return false;
  return new Date(d) < new Date();
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, children, action }: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80">
        <h2 className="text-sm font-semibold text-zinc-300 tracking-wide">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xs text-zinc-600 w-24 shrink-0 pt-1">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ─── Étape mini-row ───────────────────────────────────────────────────────────

function EtapeMini({
  etape, onToggle, onDelete,
}: {
  etape: Etape;
  onToggle: (e: Etape) => void;
  onDelete: (id: number) => void;
}) {
  const cfg = ETAPE_STATUT[etape.statut];
  const over = isOverdue(etape.deadline) && etape.statut !== "termine";
  const nextStatut: Record<StatutEtape, StatutEtape> = {
    todo: "en_cours", en_cours: "termine", termine: "todo", bloque: "todo",
  };

  return (
    <div className={`group flex items-start gap-3 py-2.5 px-3 rounded-xl transition-colors hover:bg-zinc-800/50 ${etape.statut === "termine" ? "opacity-60" : ""}`}>
      <button
        onClick={() => onToggle({ ...etape, statut: nextStatut[etape.statut] })}
        className={`mt-0.5 w-4 h-4 rounded-full border shrink-0 flex items-center justify-center transition-all hover:scale-110 ${
          etape.statut === "termine"
            ? "bg-emerald-500/30 border-emerald-500"
            : "border-zinc-600 hover:border-zinc-400"
        }`}
      >
        {etape.statut === "termine" && (
          <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${etape.statut === "termine" ? "line-through text-zinc-500" : "text-zinc-200"}`}>
          {etape.nom}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[11px] ${cfg.color}`}>{cfg.label}</span>
          {etape.deadline && (
            <span className={`text-[11px] ${over ? "text-rose-400" : "text-zinc-600"}`}>
              · {over ? "⚠ " : ""}{fmt(etape.deadline)}
            </span>
          )}
        </div>
      </div>
      <button onClick={() => onDelete(etape.id_etape)}
        className="opacity-0 group-hover:opacity-100 p-1 rounded text-zinc-600 hover:text-rose-400 transition-all">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ etapes }: { etapes: Etape[] }) {
  if (!etapes.length) return null;
  const done = etapes.filter((e) => e.statut === "termine").length;
  const pct = Math.round((done / etapes.length) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-500 tabular-nums shrink-0">{done}/{etapes.length}</span>
      <span className="text-xs font-semibold text-zinc-300 tabular-nums shrink-0 w-8 text-right">{pct}%</span>
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function Timeline({ projet, etapes }: { projet: Projet; etapes: Etape[] }) {
  const events: { date: string; label: string; type: "start" | "deadline" | "etape" }[] = [];
  if (projet.date_og) events.push({ date: projet.date_og, label: "Début du projet", type: "start" });
  etapes.filter((e) => e.date_fin).forEach((e) =>
    events.push({ date: e.date_fin!, label: `✓ ${e.nom}`, type: "etape" })
  );
  etapes.filter((e) => e.deadline && !e.date_fin).forEach((e) =>
    events.push({ date: e.deadline!, label: `⏰ ${e.nom}`, type: "deadline" })
  );
  if (projet.deadline) events.push({ date: projet.deadline, label: "Deadline projet", type: "deadline" });
  events.sort((a, b) => a.date.localeCompare(b.date));

  if (!events.length)
    return <p className="text-zinc-600 text-sm text-center py-4">Aucune date renseignée</p>;

  return (
    <div className="relative pl-5">
      <div className="absolute left-1.5 top-2 bottom-2 w-px bg-zinc-800" />
      <div className="space-y-4">
        {events.map((ev, i) => {
          const isPast = new Date(ev.date) < new Date();
          return (
            <div key={i} className="relative flex items-start gap-3">
              <div className={`absolute -left-5 mt-1 w-3 h-3 rounded-full border-2 shrink-0 ${
                ev.type === "start" ? "bg-indigo-500 border-indigo-400" :
                ev.type === "etape" ? "bg-emerald-500 border-emerald-400" :
                isPast ? "bg-rose-500 border-rose-400" : "bg-zinc-700 border-zinc-600"
              }`} />
              <div className="min-w-0">
                <p className={`text-sm leading-tight ${
                  ev.type === "etape" ? "text-emerald-400" :
                  ev.type === "deadline" && isPast ? "text-rose-400" : "text-zinc-300"
                }`}>{ev.label}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">{fmt(ev.date)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjetDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [projet, setProjet] = useState<Projet | null>(null);
  const [etapes, setEtapes] = useState<Etape[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [editingInfo, setEditingInfo] = useState(false);
  const [draft, setDraft] = useState<Projet | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);

  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const [newEtapeNom, setNewEtapeNom] = useState("");
  const [addingEtape, setAddingEtape] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: pData, error: pErr }, { data: eData }] = await Promise.all([
      supabase.from("projets").select("*").eq("id_projet", id).single(),
      supabase.from("etapes").select("*").eq("id_projet", id).order("id_etape"),
    ]);
    if (pErr || !pData) { setNotFound(true); setLoading(false); return; }
    const p = pData as Projet;
    setProjet(p);
    setDraft(p);
    setNotes(p.notes ?? "");
    setEtapes((eData as Etape[]) ?? []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSaveInfo() {
    if (!draft) return;
    setSavingInfo(true);
    const { error } = await supabase.from("projets")
      .update({
        nom: draft.nom, description: draft.description, statut: draft.statut,
        priorite: draft.priorite, localisation: draft.localisation, deadline: draft.deadline,
      } as any)
      .eq("id_projet", id);
    if (!error) { setProjet(draft); setEditingInfo(false); }
    else alert(error.message);
    setSavingInfo(false);
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    const { error } = await supabase.from("projets")
      .update({ notes } as any).eq("id_projet", id);
    if (!error) { setNotesSaved(true); setTimeout(() => setNotesSaved(false), 2000); }
    else alert(error.message);
    setSavingNotes(false);
  }

  async function handleAddEtape() {
    if (!newEtapeNom.trim()) return;
    setAddingEtape(true);
    const { data, error } = await supabase.from("etapes")
      .insert([{ nom: newEtapeNom, id_projet: id, statut: "todo" } as any])
      .select().single();
    if (!error && data) { setEtapes((prev) => [...prev, data as Etape]); setNewEtapeNom(""); }
    setAddingEtape(false);
  }

  async function handleToggleEtape(updated: Etape) {
    const date_fin = updated.statut === "termine" ? new Date().toISOString().split("T")[0] : null;
    const { error } = await supabase.from("etapes")
      .update({ statut: updated.statut, date_fin } as any)
      .eq("id_etape", updated.id_etape);
    if (!error)
      setEtapes((prev) => prev.map((e) =>
        e.id_etape === updated.id_etape ? { ...updated, date_fin } : e
      ));
  }

  async function handleDeleteEtape(id_etape: number) {
    await supabase.from("etapes").delete().eq("id_etape", id_etape);
    setEtapes((prev) => prev.filter((e) => e.id_etape !== id_etape));
  }

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !projet || !draft) return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
      <p className="text-zinc-500">Projet introuvable.</p>
      <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">← Retour au dashboard</Link>
    </div>
  );

  const overdue = isOverdue(projet.deadline);
  const terminees = etapes.filter((e) => e.statut === "termine").length;
  const inputCls = "bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-4">
          <Link href="/"
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Projets
          </Link>
          <span className="text-zinc-700">/</span>
          <h1 className="font-semibold text-zinc-100 truncate">{projet.nom}</h1>
          <div className="ml-auto flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_COLORS[projet.statut]}`}>
              {projet.statut}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PRIORITE_COLORS[projet.priorite]}`}>
              {projet.priorite}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Colonne gauche ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Infos */}
            <Section
              title="Informations"
              action={
                editingInfo ? (
                  <div className="flex gap-2">
                    <button onClick={handleSaveInfo} disabled={savingInfo}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                      {savingInfo ? "..." : "✓ Sauver"}
                    </button>
                    <button onClick={() => { setDraft(projet); setEditingInfo(false); }}
                      className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors">
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingInfo(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Modifier
                  </button>
                )
              }
            >
              <div className="space-y-3">
                <Field label="Nom">
                  {editingInfo
                    ? <input value={draft.nom} onChange={(e) => setDraft({ ...draft, nom: e.target.value })}
                        className={`${inputCls} w-full font-medium`} />
                    : <p className="text-sm text-zinc-100 font-medium">{projet.nom}</p>
                  }
                </Field>

                <Field label="Description">
                  {editingInfo
                    ? <textarea value={draft.description ?? ""}
                        onChange={(e) => setDraft({ ...draft, description: e.target.value || null })}
                        rows={3} placeholder="Description du projet…"
                        className={`${inputCls} w-full resize-none`} />
                    : <p className="text-sm text-zinc-400 leading-relaxed">
                        {projet.description || <span className="text-zinc-700 italic">Pas de description</span>}
                      </p>
                  }
                </Field>

                <Field label="Statut">
                  {editingInfo
                    ? <select value={draft.statut} onChange={(e) => setDraft({ ...draft, statut: e.target.value as Statut })}
                        className={inputCls}>
                        {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    : <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${STATUT_COLORS[projet.statut]}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                        {projet.statut}
                      </span>
                  }
                </Field>

                <Field label="Priorité">
                  {editingInfo
                    ? <select value={draft.priorite} onChange={(e) => setDraft({ ...draft, priorite: e.target.value as Priorite })}
                        className={inputCls}>
                        {(["Low", "Medium", "High"] as Priorite[]).map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    : <span className={`inline-flex text-xs px-2.5 py-1 rounded-full font-medium ${PRIORITE_COLORS[projet.priorite]}`}>
                        {projet.priorite}
                      </span>
                  }
                </Field>

                <Field label="Lieu">
                  {editingInfo
                    ? <select value={draft.localisation} onChange={(e) => setDraft({ ...draft, localisation: e.target.value as Localisation })}
                        className={inputCls}>
                        {(["indetermine", "maison", "apart", "autre"] as Localisation[]).map((l) => (
                          <option key={l} value={l}>{LOCALISATION_LABELS[l]}</option>
                        ))}
                      </select>
                    : <p className="text-sm text-zinc-400">{LOCALISATION_LABELS[projet.localisation]}</p>
                  }
                </Field>

                <Field label="Deadline">
                  {editingInfo
                    ? <input type="date" value={draft.deadline ?? ""}
                        onChange={(e) => setDraft({ ...draft, deadline: e.target.value || null })}
                        className={inputCls} />
                    : projet.deadline
                      ? <span className={`text-sm ${overdue ? "text-rose-400" : "text-zinc-400"}`}>
                          {overdue && "⚠ "}{fmt(projet.deadline)}
                          {overdue && <span className="ml-1.5 text-xs text-rose-500">En retard</span>}
                        </span>
                      : <span className="text-sm text-zinc-700 italic">Pas de deadline</span>
                  }
                </Field>

                <Field label="Créé le">
                  <p className="text-sm text-zinc-600">{fmt(projet.date_og)}</p>
                </Field>
              </div>
            </Section>

            {/* Notes */}
            <Section
              title="Notes"
              action={
                <button onClick={handleSaveNotes} disabled={savingNotes}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    notesSaved
                      ? "bg-emerald-900/40 text-emerald-400"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200"
                  } disabled:opacity-50`}>
                  {notesSaved ? "✓ Sauvegardé" : savingNotes ? "..." : "Sauvegarder"}
                </button>
              }
            >
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleSaveNotes();
                  }
                }}
                placeholder="Tes notes, idées, références, liens… (Ctrl+S pour sauvegarder)"
                rows={10}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none leading-relaxed placeholder:text-zinc-700 font-mono"
              />
              <p className="text-[11px] text-zinc-700 mt-2 text-right">
                {notes.length} caractères · Ctrl+S pour sauvegarder
              </p>
            </Section>
          </div>

          {/* ── Colonne droite ─────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Progression */}
            <Section title="Progression">
              {etapes.length === 0 ? (
                <p className="text-zinc-600 text-sm text-center py-2">Aucune étape</p>
              ) : (
                <div className="space-y-3">
                  <ProgressBar etapes={etapes} />
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {(["todo", "en_cours", "bloque", "termine"] as StatutEtape[]).map((s) => {
                      const count = etapes.filter((e) => e.statut === s).length;
                      const cfg = ETAPE_STATUT[s];
                      return (
                        <div key={s} className="bg-zinc-800/50 rounded-xl px-3 py-2">
                          <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{cfg.label}</p>
                          <p className={`text-lg font-bold ${cfg.color}`}>{count}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>

            {/* Étapes */}
            <Section
              title={`Étapes ${etapes.length > 0 ? `(${terminees}/${etapes.length})` : ""}`}
              action={
                <Link href="/etapes"
                  className="text-xs text-zinc-600 hover:text-indigo-400 transition-colors">
                  Voir tout →
                </Link>
              }
            >
              <div className="space-y-0.5">
                {etapes.length === 0 ? (
                  <p className="text-zinc-600 text-sm text-center py-2">Aucune étape pour ce projet</p>
                ) : (
                  etapes.map((e) => (
                    <EtapeMini key={e.id_etape} etape={e}
                      onToggle={handleToggleEtape} onDelete={handleDeleteEtape} />
                  ))
                )}
                <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-800/80">
                  <input type="text" value={newEtapeNom}
                    onChange={(e) => setNewEtapeNom(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddEtape()}
                    placeholder="Ajouter une étape…"
                    className="flex-1 bg-zinc-800/60 border border-zinc-700/50 text-zinc-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-zinc-700" />
                  <button onClick={handleAddEtape} disabled={addingEtape || !newEtapeNom.trim()}
                    className="p-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors disabled:opacity-40">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
                    </svg>
                  </button>
                </div>
              </div>
            </Section>

            {/* Timeline */}
            <Section title="Timeline">
              <Timeline projet={projet} etapes={etapes} />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}