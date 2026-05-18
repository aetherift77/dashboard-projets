"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type Localisation = "indetermine" | "maison" | "apart" | "autre";
type Statut =
  | "idee"
  | "definition"
  | "conception"
  | "planification"
  | "construction"
  | "operationnel"
  | "maintenance";
type Priorite = "Low" | "Medium" | "High";

interface Projet {
  id_projet: number;
  nom: string;
  description: string | null;
  statut: Statut;
  priorite: Priorite;
  localisation: Localisation;
  date_og: string | null;
  deadline: string | null;
}

// ─── Config maps ──────────────────────────────────────────────────────────────

const STATUTS: Statut[] = [
  "idee",
  "definition",
  "conception",
  "planification",
  "construction",
  "operationnel",
  "maintenance",
];

const STATUT_COLORS: Record<Statut, string> = {
  idee: "bg-slate-700 text-slate-200",
  definition: "bg-indigo-900/70 text-indigo-300",
  conception: "bg-violet-900/70 text-violet-300",
  planification: "bg-blue-900/70 text-blue-300",
  construction: "bg-amber-900/70 text-amber-300",
  operationnel: "bg-emerald-900/70 text-emerald-300",
  maintenance: "bg-teal-900/70 text-teal-300",
};

const PRIORITE_COLORS: Record<Priorite, string> = {
  Low: "bg-slate-700 text-slate-300",
  Medium: "bg-amber-900/70 text-amber-300",
  High: "bg-rose-900/70 text-rose-300",
};

const LOCALISATION_LABELS: Record<Localisation, string> = {
  indetermine: "—",
  maison: "🏠 Maison",
  apart: "🏢 Apart",
  autre: "📍 Autre",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function InlineSelect<T extends string>({
  value,
  options,
  onChange,
  renderOption,
  className,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  renderOption?: (v: T) => string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={`bg-zinc-800 border border-zinc-600 text-zinc-100 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${className ?? ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {renderOption ? renderOption(o) : o}
        </option>
      ))}
    </select>
  );
}

function InlineText({
  value,
  onChange,
  placeholder,
  multiline,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const base =
    "bg-zinc-800 border border-indigo-500/50 text-zinc-100 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full resize-none";
  if (multiline)
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={`${base} ${className ?? ""}`}
        onClick={(e) => e.stopPropagation()}
      />
    );
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${base} ${className ?? ""}`}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

function InlineDate({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-zinc-800 border border-zinc-600 text-zinc-100 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

// ─── Project Row ──────────────────────────────────────────────────────────────

interface ProjectRowProps {
  projet: Projet;
  onSave: (updated: Projet) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

function ProjectRow({ projet, onSave, onDelete }: ProjectRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Projet>(projet);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync if parent updates the project (e.g. after save)
  useEffect(() => {
    setDraft(projet);
  }, [projet]);

  function updateDraft<K extends keyof Projet>(key: K, value: Projet[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() {
    setDraft(projet);
    setEditing(false);
  }

  const overdue = isOverdue(projet.deadline);

  return (
    <div
      className={`group relative rounded-2xl border transition-all duration-200 ${
        editing
          ? "border-indigo-500/60 bg-zinc-900/90 shadow-lg shadow-indigo-900/20"
          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900/80"
      }`}
    >
      {/* Top bar */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        {/* ID + Nom */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="mt-0.5 text-xs font-mono text-zinc-600 shrink-0 pt-1">
            #{projet.id_projet}
          </span>
          <div className="flex-1 min-w-0">
            {editing ? (
              <InlineText
                value={draft.nom}
                onChange={(v) => updateDraft("nom", v)}
                placeholder="Nom du projet"
                className="font-semibold text-base"
              />
            ) : (
              <h3 className="font-semibold text-zinc-100 text-base leading-snug truncate">
                {projet.nom}
              </h3>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <svg
                    className="w-3 h-3 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                Sauvegarder
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition-colors"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all"
                title="Modifier"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onDelete(projet.id_projet)}
                    className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-900/50 text-zinc-400 hover:text-rose-400 transition-all"
                  title="Supprimer"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="px-4 pb-3">
        {editing ? (
          <InlineText
            value={draft.description ?? ""}
            onChange={(v) => updateDraft("description", v || null)}
            placeholder="Description (optionnel)"
            multiline
            className="text-zinc-400 text-sm"
          />
        ) : projet.description ? (
          <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2">
            {projet.description}
          </p>
        ) : (
          <p className="text-zinc-700 text-sm italic">Pas de description</p>
        )}
      </div>

      {/* Badges / Fields row */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
        {/* Statut */}
        {editing ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-zinc-600 text-[10px] uppercase tracking-wider">
              Statut
            </span>
            <InlineSelect
              value={draft.statut}
              options={STATUTS}
              onChange={(v) => updateDraft("statut", v)}
              renderOption={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
            />
          </div>
        ) : (
          <Badge className={STATUT_COLORS[projet.statut]}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
            {projet.statut.charAt(0).toUpperCase() + projet.statut.slice(1)}
          </Badge>
        )}

        {/* Priorité */}
        {editing ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-zinc-600 text-[10px] uppercase tracking-wider">
              Priorité
            </span>
            <InlineSelect
              value={draft.priorite}
              options={["Low", "Medium", "High"] as Priorite[]}
              onChange={(v) => updateDraft("priorite", v)}
            />
          </div>
        ) : (
          <Badge className={PRIORITE_COLORS[projet.priorite]}>
            {projet.priorite === "High" && "🔴"}
            {projet.priorite === "Medium" && "🟡"}
            {projet.priorite === "Low" && "🟢"}
            {projet.priorite}
          </Badge>
        )}

        {/* Localisation */}
        {editing ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-zinc-600 text-[10px] uppercase tracking-wider">
              Lieu
            </span>
            <InlineSelect
              value={draft.localisation}
              options={
                ["indetermine", "maison", "apart", "autre"] as Localisation[]
              }
              onChange={(v) => updateDraft("localisation", v)}
              renderOption={(v) => LOCALISATION_LABELS[v]}
            />
          </div>
        ) : (
          <Badge className="bg-zinc-800 text-zinc-400">
            {LOCALISATION_LABELS[projet.localisation]}
          </Badge>
        )}

        {/* Deadline */}
        {editing ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-zinc-600 text-[10px] uppercase tracking-wider">
              Deadline
            </span>
            <InlineDate
              value={draft.deadline ?? ""}
              onChange={(v) => updateDraft("deadline", v || null)}
            />
          </div>
        ) : projet.deadline ? (
          <Badge
            className={
              overdue
                ? "bg-rose-900/60 text-rose-300"
                : "bg-zinc-800 text-zinc-400"
            }
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {overdue && "⚠ "}
            {formatDate(projet.deadline)}
          </Badge>
        ) : (
          <Badge className="bg-zinc-800/50 text-zinc-600">
            Pas de deadline
          </Badge>
        )}
      </div>
    </div>
  );
}

// ─── Create Project Modal ─────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreate: (p: Omit<Projet, "id_projet" | "date_og">) => Promise<void>;
}

function CreateModal({ onClose, onCreate }: CreateModalProps) {
  const [form, setForm] = useState<Omit<Projet, "id_projet" | "date_og">>({
    nom: "",
    description: null,
    statut: "idee",
    priorite: "Medium",
    localisation: "indetermine",
    deadline: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.nom.trim()) {
      setError("Le nom est requis.");
      return;
    }
    setSaving(true);
    setError(null);
    await onCreate(form);
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-zinc-100">
            Nouveau projet
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Nom <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => update("nom", e.target.value)}
              placeholder="Nom du projet"
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Description
            </label>
            <textarea
              value={form.description ?? ""}
              onChange={(e) =>
                update("description", e.target.value || null)
              }
              placeholder="Description (optionnel)"
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Row: Statut + Priorité */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Statut
              </label>
              <select
                value={form.statut}
                onChange={(e) => update("statut", e.target.value as Statut)}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Priorité
              </label>
              <select
                value={form.priorite}
                onChange={(e) =>
                  update("priorite", e.target.value as Priorite)
                }
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Row: Localisation + Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Localisation
              </label>
              <select
                value={form.localisation}
                onChange={(e) =>
                  update("localisation", e.target.value as Localisation)
                }
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {(
                  [
                    "indetermine",
                    "maison",
                    "apart",
                    "autre",
                  ] as Localisation[]
                ).map((l) => (
                  <option key={l} value={l}>
                    {LOCALISATION_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Deadline
              </label>
              <input
                type="date"
                value={form.deadline ?? ""}
                onChange={(e) => update("deadline", e.target.value || null)}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-rose-400 text-sm">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-sm font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving && (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            )}
            Créer le projet
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter & Sort bar ────────────────────────────────────────────────────────

interface FilterBarProps {
  filterStatut: Statut | "all";
  setFilterStatut: (v: Statut | "all") => void;
  filterPriorite: Priorite | "all";
  setFilterPriorite: (v: Priorite | "all") => void;
  sortBy: "nom" | "deadline" | "priorite" | "statut";
  setSortBy: (v: "nom" | "deadline" | "priorite" | "statut") => void;
  search: string;
  setSearch: (v: string) => void;
  total: number;
}

function FilterBar({
  filterStatut,
  setFilterStatut,
  filterPriorite,
  setFilterPriorite,
  sortBy,
  setSortBy,
  search,
  setSearch,
  total,
}: FilterBarProps) {
  const selectBase =
    "bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
        />
      </div>

      <select
        value={filterStatut}
        onChange={(e) => setFilterStatut(e.target.value as Statut | "all")}
        className={selectBase}
      >
        <option value="all">Tous les statuts</option>
        {STATUTS.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={filterPriorite}
        onChange={(e) =>
          setFilterPriorite(e.target.value as Priorite | "all")
        }
        className={selectBase}
      >
        <option value="all">Toutes priorités</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      <select
        value={sortBy}
        onChange={(e) =>
          setSortBy(
            e.target.value as "nom" | "deadline" | "priorite" | "statut"
          )
        }
        className={selectBase}
      >
        <option value="nom">Trier : Nom</option>
        <option value="deadline">Trier : Deadline</option>
        <option value="priorite">Trier : Priorité</option>
        <option value="statut">Trier : Statut</option>
      </select>

      <span className="ml-auto text-xs text-zinc-600">
        {total} projet{total !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState<Statut | "all">("all");
  const [filterPriorite, setFilterPriorite] = useState<Priorite | "all">(
    "all"
  );
  const [sortBy, setSortBy] = useState<"nom" | "deadline" | "priorite" | "statut">("nom");

  // ── Fetch ──────────────────────────────────────────────────────────────────

  async function fetchProjets() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("projets")
      .select("*")
      .order("id_projet", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setProjets((data as Projet[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProjets();
  }, []);

  // ── Create ─────────────────────────────────────────────────────────────────

  async function handleCreate(
    form: Omit<Projet, "id_projet" | "date_og">
  ) {
    const { data, error } = await supabase
      .from("projets")
      .insert([
        {
          nom: form.nom,
          description: form.description,
          statut: form.statut,
          priorite: form.priorite,
          localisation: form.localisation,
          deadline: form.deadline,
        } as any,
      ])
      .select()
      .single();

    if (error) {
      alert(`Erreur création : ${error.message}`);
      return;
    }
    setProjets((prev) => [data as Projet, ...prev]);
    setShowCreate(false);
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function handleSave(updated: Projet) {
    const { error } = await supabase
      .from("projets")
      .update({
        nom: updated.nom,
        description: updated.description,
        statut: updated.statut,
        priorite: updated.priorite,
        localisation: updated.localisation,
        deadline: updated.deadline,
      } as any)
      .eq("id_projet", updated.id_projet);

    if (error) {
      alert(`Erreur sauvegarde : ${error.message}`);
      return;
    }
    setProjets((prev) =>
      prev.map((p) => (p.id_projet === updated.id_projet ? updated : p))
    );
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function handleDelete(id: number) {
    const { error } = await supabase
      .from("projets")
      .delete()
      .eq("id_projet", id);

    if (error) {
      alert(`Erreur suppression : ${error.message}`);
      return;
    }
    setProjets((prev) => prev.filter((p) => p.id_projet !== id));
  }

  // ── Filter + Sort ──────────────────────────────────────────────────────────

  const PRIORITE_ORDER: Record<Priorite, number> = {
    High: 0,
    Medium: 1,
    Low: 2,
  };

  const filtered = projets
    .filter((p) => {
      if (filterStatut !== "all" && p.statut !== filterStatut) return false;
      if (filterPriorite !== "all" && p.priorite !== filterPriorite)
        return false;
      if (
        search &&
        !p.nom.toLowerCase().includes(search.toLowerCase()) &&
        !(p.description ?? "")
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "nom") return a.nom.localeCompare(b.nom);
      if (sortBy === "priorite")
        return PRIORITE_ORDER[a.priorite] - PRIORITE_ORDER[b.priorite];
      if (sortBy === "statut")
        return STATUTS.indexOf(a.statut) - STATUTS.indexOf(b.statut);
      if (sortBy === "deadline") {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      }
      return 0;
    });

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = {
    total: projets.length,
    high: projets.filter((p) => p.priorite === "High").length,
    overdue: projets.filter(
      (p) => p.deadline && isOverdue(p.deadline)
    ).length,
    operationnel: projets.filter((p) => p.statut === "operationnel").length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-zinc-100 tracking-tight">
              ◈ Dashboard
            </span>
            <div className="hidden sm:flex items-center gap-1">
              {[
                { label: "Projets", href: "/" },
                { label: "Kanban", href: "/kanban" },
                { label: "Étapes", href: "/etapes" },
                { label: "Inventaire", href: "/inventaire" },
              ].map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    href === "/"
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                  }`}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-900/30"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nouveau projet
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total",
              value: stats.total,
              color: "text-zinc-300",
              bg: "bg-zinc-800/50",
            },
            {
              label: "Haute priorité",
              value: stats.high,
              color: "text-rose-300",
              bg: "bg-rose-900/20",
            },
            {
              label: "En retard",
              value: stats.overdue,
              color: "text-amber-300",
              bg: "bg-amber-900/20",
            },
            {
              label: "Opérationnels",
              value: stats.operationnel,
              color: "text-emerald-300",
              bg: "bg-emerald-900/20",
            },
          ].map(({ label, value, color, bg }) => (
            <div
              key={label}
              className={`${bg} rounded-2xl border border-zinc-800 px-4 py-3`}
            >
              <p className="text-xs text-zinc-500">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <FilterBar
          filterStatut={filterStatut}
          setFilterStatut={setFilterStatut}
          filterPriorite={filterPriorite}
          setFilterPriorite={setFilterPriorite}
          sortBy={sortBy}
          setSortBy={setSortBy}
          search={search}
          setSearch={setSearch}
          total={filtered.length}
        />

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-rose-400 text-sm">{error}</p>
            <button
              onClick={fetchProjets}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
            >
              Réessayer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-zinc-600 text-sm">
              {projets.length === 0
                ? "Aucun projet. Commencez par en créer un !"
                : "Aucun projet ne correspond aux filtres."}
            </p>
            {projets.length === 0 && (
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
              >
                Créer un projet
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((projet) => (
              <ProjectRow
                key={projet.id_projet}
                projet={projet}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}