// lib/types.ts
// Source unique des types métier et de la configuration partagée (couleurs, libellés, helpers).
// Importé par les pages (dashboard, kanban, inventaire, étapes…) pour éviter la duplication.

// ─── Types métier ─────────────────────────────────────────────────────────────

export type Statut =
  | "Idée"
  | "Definition"
  | "Preparation"
  | "Production"
  | "Operationnel"
  | "Maintenance"
  | "Abandonne";

export type Priorite = "Low" | "Medium" | "High";

export type Localisation = "indetermine" | "maison" | "apart" | "autre";

export type EtapeStatut = "todo" | "en_cours" | "bloque" | "termine";

export interface Projet {
  id_projet: number;
  nom: string;
  description: string | null;
  statut: Statut;
  priorite: Priorite;
  localisation: Localisation;
  date_og?: string | null;
  deadline: string | null;
}

export interface InventaireItem {
  id_objet: number;
  nom: string;
  description: string | null;
  nb: number;
  localisation: Localisation;
  id_projet: number | null;
}

export interface Etape {
  id_etape: number;
  id_projet: number | null;
  nom: string;
  description: string | null;
  statut: EtapeStatut;
  date_creation?: string | null;
  deadline: string | null;
  date_fin: string | null;
}

// Référence légère d'un projet (pour les listes déroulantes).
export interface ProjetRef {
  id_projet: number;
  nom: string;
}

// ─── Listes ───────────────────────────────────────────────────────────────────

export const STATUTS: Statut[] = [
  "Idée", "Definition", "Preparation", "Production",
  "Operationnel", "Maintenance", "Abandonne",
];

export const PRIORITES: Priorite[] = ["Low", "Medium", "High"];

export const LOCALISATIONS: Localisation[] = ["indetermine", "maison", "apart", "autre"];

export const ETAPE_STATUTS: EtapeStatut[] = ["todo", "en_cours", "bloque", "termine"];

// ─── Couleurs & libellés ──────────────────────────────────────────────────────

export const STATUT_COLORS: Record<Statut, string> = {
  Idée:         "bg-slate-700 text-slate-200",
  Definition:   "bg-indigo-900/70 text-indigo-300",
  Preparation:  "bg-violet-900/70 text-violet-300",
  Production:   "bg-amber-900/70 text-amber-300",
  Operationnel: "bg-emerald-900/70 text-emerald-300",
  Maintenance:  "bg-teal-900/70 text-teal-300",
  Abandonne:    "bg-zinc-800 text-zinc-500",
};

export const PRIORITE_COLORS: Record<Priorite, string> = {
  Low:    "bg-zinc-700/60 text-zinc-400",
  Medium: "bg-amber-900/50 text-amber-300",
  High:   "bg-rose-900/50 text-rose-300",
};

export const PRIORITE_DOT: Record<Priorite, string> = {
  Low: "bg-zinc-500", Medium: "bg-amber-400", High: "bg-rose-400",
};

export const PRIORITE_ORDER: Record<Priorite, number> = { High: 0, Medium: 1, Low: 2 };

export const LOCALISATION_LABELS: Record<Localisation, string> = {
  indetermine: "—",
  maison:      "🏠 Maison",
  apart:       "🏢 Apart",
  autre:       "📍 Autre",
};

export const LOCALISATION_COLORS: Record<Localisation, string> = {
  indetermine: "bg-zinc-800 text-zinc-500",
  maison:      "bg-emerald-900/70 text-emerald-300",
  apart:       "bg-indigo-900/70 text-indigo-300",
  autre:       "bg-amber-900/70 text-amber-300",
};

// ─── Config Kanban ────────────────────────────────────────────────────────────

export interface KanbanColonne {
  statut: Statut;
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const KANBAN_COLONNES: KanbanColonne[] = [
  { statut: "Idée",         label: "💡 Idée",         color: "text-slate-300",   bg: "bg-slate-800/40",   border: "border-slate-700/50" },
  { statut: "Definition",   label: "📋 Définition",   color: "text-indigo-300",  bg: "bg-indigo-900/20",  border: "border-indigo-800/40" },
  { statut: "Preparation",  label: "🔧 Préparation",  color: "text-violet-300",  bg: "bg-violet-900/20",  border: "border-violet-800/40" },
  { statut: "Production",   label: "⚡ Production",   color: "text-amber-300",   bg: "bg-amber-900/20",   border: "border-amber-800/40" },
  { statut: "Operationnel", label: "✅ Opérationnel", color: "text-emerald-300", bg: "bg-emerald-900/20", border: "border-emerald-800/40" },
  { statut: "Maintenance",  label: "🔄 Maintenance",  color: "text-teal-300",    bg: "bg-teal-900/20",    border: "border-teal-800/40" },
  { statut: "Abandonne",    label: "🗃 Abandonné",    color: "text-zinc-500",    bg: "bg-zinc-800/20",    border: "border-zinc-700/30" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

// Date complète : 12 juin 2026
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// Date courte : 12 juin
export function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
