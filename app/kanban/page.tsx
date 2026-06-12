"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  type Statut,
  type Priorite,
  type Projet,
  type KanbanColonne,
  KANBAN_COLONNES,
  PRIORITE_COLORS,
  PRIORITE_DOT,
  isOverdue,
  formatDateShort,
} from "@/lib/types";

interface EtapeStat {
  total: number;
  done: number;
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({
  projet,
  etapeStat,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  projet: Projet;
  etapeStat?: EtapeStat;
  onDragStart: (p: Projet) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const overdue = isOverdue(projet.deadline);
  const allDone = etapeStat && etapeStat.total > 0 && etapeStat.done === etapeStat.total;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(projet)}
      onDragEnd={onDragEnd}
      className={`group relative bg-zinc-900 border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all duration-150 select-none ${
        isDragging
          ? "opacity-40 scale-95 border-indigo-500/50"
          : "border-zinc-800 hover:border-zinc-600 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5"
      }`}
    >
      {/* Drag handle */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-3.5 h-3.5 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 100-4 2 2 0 000 4zM8 14a2 2 0 100-4 2 2 0 000 4zM8 22a2 2 0 100-4 2 2 0 000 4zM16 6a2 2 0 100-4 2 2 0 000 4zM16 14a2 2 0 100-4 2 2 0 000 4zM16 22a2 2 0 100-4 2 2 0 000 4z"/>
        </svg>
      </div>

      {/* Nom */}
      <Link
        href={`/projets/${projet.id_projet}`}
        className="block text-sm font-medium text-zinc-100 hover:text-indigo-400 transition-colors leading-snug mb-2 pr-5"
        onClick={(e) => e.stopPropagation()}
      >
        {projet.nom}
      </Link>

      {/* Description */}
      {projet.description && (
        <p className="text-xs text-zinc-600 leading-relaxed mb-2 line-clamp-2">
          {projet.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-1.5 flex-wrap mt-1">
        {/* Priorité */}
        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${PRIORITE_COLORS[projet.priorite]}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${PRIORITE_DOT[projet.priorite]}`} />
          {projet.priorite}
        </span>

        {/* Étapes */}
        {etapeStat && etapeStat.total > 0 && (
          <span
            title={`${etapeStat.done} étape(s) terminée(s) sur ${etapeStat.total}`}
            className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
              allDone ? "bg-emerald-900/50 text-emerald-300" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            {etapeStat.done}/{etapeStat.total}
          </span>
        )}

        {/* Deadline */}
        {projet.deadline && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
            overdue
              ? "bg-rose-900/50 text-rose-300"
              : "bg-zinc-800 text-zinc-500"
          }`}>
            {overdue && "⚠ "}{formatDateShort(projet.deadline)}
          </span>
        )}

        {/* ID */}
        <span className="ml-auto text-[10px] text-zinc-700 font-mono">#{projet.id_projet}</span>
      </div>
    </div>
  );
}

// ─── Quick Add (création rapide depuis une colonne) ─────────────────────────────

function QuickAdd({
  statut, onCreate,
}: {
  statut: Statut;
  onCreate: (statut: Statut, nom: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const v = nom.trim();
    if (!v || saving) return;
    setSaving(true);
    await onCreate(statut, v);
    setSaving(false);
    setNom(""); // on garde le champ ouvert pour enchaîner les ajouts
  }

  function close() {
    setOpen(false);
    setNom("");
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-zinc-700/70 text-zinc-600 hover:text-zinc-300 hover:border-zinc-600 text-xs transition-colors"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
        </svg>
        Ajouter
      </button>
    );
  }

  return (
    <div className="bg-zinc-900 border border-indigo-500/40 rounded-xl p-2 space-y-2">
      <input
        autoFocus
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") close();
        }}
        placeholder="Nom du projet"
        className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <div className="flex items-center gap-1.5">
        <button
          onClick={submit}
          disabled={saving || !nom.trim()}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
        >
          {saving && (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          )}
          Ajouter
        </button>
        <button
          onClick={close}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  projets,
  etapeStats,
  draggingId,
  dragOverStatut,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onQuickCreate,
}: {
  col: KanbanColonne;
  projets: Projet[];
  etapeStats: Record<number, EtapeStat>;
  draggingId: number | null;
  dragOverStatut: Statut | null;
  onDragStart: (p: Projet) => void;
  onDragEnd: () => void;
  onDragOver: (s: Statut) => void;
  onDragLeave: () => void;
  onDrop: (s: Statut) => void;
  onQuickCreate: (statut: Statut, nom: string) => Promise<void>;
}) {
  const isOver = dragOverStatut === col.statut;

  return (
    <div className="flex flex-col min-w-[240px] w-[240px] shrink-0">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border-t border-x ${col.border} ${col.bg}`}>
        <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
        <span className="text-xs text-zinc-600 bg-zinc-800/60 rounded-full px-1.5 py-0.5 tabular-nums">
          {projets.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); onDragOver(col.statut); }}
        onDragLeave={onDragLeave}
        onDrop={(e) => { e.preventDefault(); onDrop(col.statut); }}
        className={`flex-1 min-h-[400px] p-2 rounded-b-xl border ${col.border} transition-all duration-150 space-y-2 ${
          isOver
            ? `${col.bg} border-dashed border-2 scale-[1.01]`
            : "bg-zinc-900/30 border-t-0"
        }`}
      >
        {/* Drop indicator */}
        {isOver && draggingId !== null && (
          <div className={`h-1 rounded-full ${col.color.replace("text-", "bg-")} opacity-60`} />
        )}

        {projets.map((p) => (
          <KanbanCard
            key={p.id_projet}
            projet={p}
            etapeStat={etapeStats[p.id_projet]}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            isDragging={draggingId === p.id_projet}
          />
        ))}

        {/* Empty state */}
        {projets.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-12">
            <p className="text-xs text-zinc-700">Déposer ici</p>
          </div>
        )}

        {/* Quick add */}
        <QuickAdd statut={col.statut} onCreate={onQuickCreate} />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function KanbanPage() {
  const [projets, setProjets] = useState<Projet[]>([]);
  const [etapeStats, setEtapeStats] = useState<Record<number, EtapeStat>>({});
  const [loading, setLoading] = useState(true);
  const [filterPriorite, setFilterPriorite] = useState<Priorite | "all">("all");
  const [search, setSearch] = useState("");
  const [hiddenStatuts, setHiddenStatuts] = useState<Set<Statut>>(new Set(["Abandonne"]));

  // Drag state
  const [draggingProjet, setDraggingProjet] = useState<Projet | null>(null);
  const [dragOverStatut, setDragOverStatut] = useState<Statut | null>(null);
  const savingRef = useRef(false);

  // ── Fetch ────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("projets")
        .select("id_projet, nom, description, statut, priorite, localisation, deadline")
        .order("id_projet", { ascending: true });
      setProjets((data as Projet[]) ?? []);

      const { data: etapesData } = await supabase
        .from("etapes")
        .select("id_projet, statut");
      const map: Record<number, EtapeStat> = {};
      ((etapesData as { id_projet: number | null; statut: string }[]) ?? []).forEach((e) => {
        if (e.id_projet == null) return;
        const m = map[e.id_projet] ?? { total: 0, done: 0 };
        m.total += 1;
        if (e.statut === "termine") m.done += 1;
        map[e.id_projet] = m;
      });
      setEtapeStats(map);

      setLoading(false);
    }
    load();
  }, []);

  // ── Quick create ──────────────────────────────────────────────────────────

  async function handleQuickCreate(statut: Statut, nom: string) {
    const { data, error } = await supabase
      .from("projets")
      .insert([{ nom, description: null, statut, priorite: "Medium",
        localisation: "indetermine", deadline: null } as any])
      .select("id_projet, nom, description, statut, priorite, localisation, deadline")
      .single();
    if (error) { alert(`Erreur : ${error.message}`); return; }
    setProjets((prev) => [...prev, data as Projet]);
  }

  // ── Drag handlers ────────────────────────────────────────────────────────

  function handleDragStart(p: Projet) {
    setDraggingProjet(p);
  }

  function handleDragEnd() {
    setDraggingProjet(null);
    setDragOverStatut(null);
  }

  function handleDragOver(statut: Statut) {
    if (draggingProjet && statut !== draggingProjet.statut) {
      setDragOverStatut(statut);
    }
  }

  function handleDragLeave() {
    setDragOverStatut(null);
  }

  async function handleDrop(targetStatut: Statut) {
    if (!draggingProjet || draggingProjet.statut === targetStatut || savingRef.current) {
      setDraggingProjet(null);
      setDragOverStatut(null);
      return;
    }

    savingRef.current = true;

    // Optimistic update
    setProjets((prev) =>
      prev.map((p) =>
        p.id_projet === draggingProjet.id_projet
          ? { ...p, statut: targetStatut }
          : p
      )
    );

    setDraggingProjet(null);
    setDragOverStatut(null);

    const { error } = await supabase
      .from("projets")
      .update({ statut: targetStatut } as any)
      .eq("id_projet", draggingProjet.id_projet);

    if (error) {
      // Rollback
      setProjets((prev) =>
        prev.map((p) =>
          p.id_projet === draggingProjet.id_projet
            ? { ...p, statut: draggingProjet.statut }
            : p
        )
      );
      alert(`Erreur : ${error.message}`);
    }

    savingRef.current = false;
  }

  // ── Toggle column visibility ─────────────────────────────────────────────

  function toggleColonne(statut: Statut) {
    setHiddenStatuts((prev) => {
      const next = new Set(prev);
      if (next.has(statut)) next.delete(statut);
      else next.add(statut);
      return next;
    });
  }

  // ── Filter ───────────────────────────────────────────────────────────────

  const filtered = projets.filter((p) => {
    if (filterPriorite !== "all" && p.priorite !== filterPriorite) return false;
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const visibleColonnes = KANBAN_COLONNES.filter((c) => !hiddenStatuts.has(c.statut));

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    total: projets.length,
    enCours: projets.filter((p) =>
      ["Definition", "Preparation", "Production"].includes(p.statut)
    ).length,
    overdue: projets.filter((p) => p.deadline && isOverdue(p.deadline)).length,
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md shrink-0">
        <div className="px-6 h-14 flex items-center justify-between gap-4">
          <h1 className="font-bold text-zinc-100 text-base shrink-0">Kanban</h1>

          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500"
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36" />
            </div>

            {/* Priorité filter */}
            <select value={filterPriorite}
              onChange={(e) => setFilterPriorite(e.target.value as Priorite | "all")}
              className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option value="all">Toutes priorités</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-3 ml-2">
              <span className="text-xs text-zinc-600">{stats.total} projets</span>
              {stats.enCours > 0 && (
                <span className="text-xs text-blue-400">{stats.enCours} en cours</span>
              )}
              {stats.overdue > 0 && (
                <span className="text-xs text-rose-400">⚠ {stats.overdue} en retard</span>
              )}
            </div>
          </div>
        </div>

        {/* Column toggles */}
        <div className="px-6 pb-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-zinc-600 shrink-0">Colonnes :</span>
          {KANBAN_COLONNES.map((col) => {
            const hidden = hiddenStatuts.has(col.statut);
            return (
              <button
                key={col.statut}
                onClick={() => toggleColonne(col.statut)}
                className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                  hidden
                    ? "bg-zinc-900 border-zinc-800 text-zinc-600"
                    : `${col.bg} ${col.border} ${col.color}`
                }`}
              >
                {hidden ? "+" : "−"} {col.label.split(" ").slice(1).join(" ")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-3 p-6 min-w-max">
            {visibleColonnes.map((col) => (
              <KanbanColumn
                key={col.statut}
                col={col}
                projets={filtered.filter((p) => p.statut === col.statut)}
                etapeStats={etapeStats}
                draggingId={draggingProjet?.id_projet ?? null}
                dragOverStatut={dragOverStatut}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onQuickCreate={handleQuickCreate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Drag hint */}
      {draggingProjet && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 border border-zinc-700 rounded-full px-4 py-2 text-xs text-zinc-300 shadow-xl pointer-events-none">
          Déposer dans une colonne pour changer le statut
        </div>
      )}
    </div>
  );
}
