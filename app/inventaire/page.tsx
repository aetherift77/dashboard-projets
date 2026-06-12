"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import {
  type Localisation,
  type InventaireItem as Item,
  type ProjetRef,
  LOCALISATIONS,
  LOCALISATION_LABELS,
  LOCALISATION_COLORS,
} from "@/lib/types";

// ─── Inline inputs ────────────────────────────────────────────────────────────

function InlineText({
  value, onChange, placeholder, multiline, className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
}) {
  const base = "bg-zinc-800 border border-indigo-500/50 text-zinc-100 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full resize-none";
  if (multiline)
    return (
      <textarea value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} rows={2} className={`${base} ${className ?? ""}`} />
    );
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} className={`${base} ${className ?? ""}`} />
  );
}

function InlineNumber({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input type="number" min={0} value={value}
      onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      className="bg-zinc-800 border border-indigo-500/50 text-zinc-100 text-sm rounded-lg px-2 py-1.5 w-20 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
  );
}

function InlineSelect<T extends string>({
  value, options, onChange, renderOption, className,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
  renderOption?: (v: T) => string;
  className?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}
      className={`bg-zinc-800 border border-zinc-600 text-zinc-100 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${className ?? ""}`}>
      {options.map((o) => <option key={o} value={o}>{renderOption ? renderOption(o) : o}</option>)}
    </select>
  );
}

function ProjetSelect({
  value, projects, onChange,
}: {
  value: number | null;
  projects: ProjetRef[];
  onChange: (v: number | null) => void;
}) {
  return (
    <select value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="bg-zinc-800 border border-zinc-600 text-zinc-100 text-xs rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
      <option value="">Aucun projet</option>
      {projects.map((p) => (
        <option key={p.id_projet} value={p.id_projet}>#{p.id_projet} — {p.nom}</option>
      ))}
    </select>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({
  item, projectsMap, projects, onSave, onDelete,
}: {
  item: Item;
  projectsMap: Record<number, string>;
  projects: ProjetRef[];
  onSave: (updated: Item) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Item>(item);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setDraft(item); }, [item]);

  function upd<K extends keyof Item>(key: K, value: Item[K]) {
    setDraft((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  const projetNom = item.id_projet != null ? projectsMap[item.id_projet] : null;

  return (
    <div className={`group relative rounded-2xl border transition-all duration-200 ${
      editing
        ? "border-indigo-500/60 bg-zinc-900/90 shadow-lg shadow-indigo-900/20"
        : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900/80"
    }`}>
      {/* Top bar */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-xs font-mono text-zinc-600 shrink-0 pt-1">#{item.id_objet}</span>
          <div className="flex-1 min-w-0">
            {editing ? (
              <InlineText value={draft.nom} onChange={(v) => upd("nom", v)}
                placeholder="Nom de l'objet" className="font-semibold text-base" />
            ) : (
              <h2 className="font-semibold text-zinc-100 text-base leading-snug truncate">{item.nom}</h2>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50">
                {saving
                  ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                  : <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                }
                Sauvegarder
              </button>
              <button onClick={() => { setDraft(item); setEditing(false); }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-semibold transition-colors">
                Annuler
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} title="Modifier"
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
              </button>
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => onDelete(item.id_objet)}
                    className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors">
                    Confirmer
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs transition-colors">
                    ✕
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} title="Supprimer"
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-900/50 text-zinc-400 hover:text-rose-400 transition-all">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
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
          <InlineText value={draft.description ?? ""}
            onChange={(v) => upd("description", v || null)}
            placeholder="Description (optionnel)" multiline className="text-zinc-400 text-sm" />
        ) : item.description ? (
          <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2">{item.description}</p>
        ) : (
          <p className="text-zinc-700 text-sm italic">Pas de description</p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
        {/* Quantité */}
        {editing ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-zinc-600 text-[10px] uppercase tracking-wider">Quantité</span>
            <InlineNumber value={draft.nb} onChange={(v) => upd("nb", v)} />
          </div>
        ) : (
          <Badge className="bg-zinc-800 text-zinc-300">× {item.nb}</Badge>
        )}

        {/* Localisation */}
        {editing ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-zinc-600 text-[10px] uppercase tracking-wider">Lieu</span>
            <InlineSelect value={draft.localisation} options={LOCALISATIONS}
              onChange={(v) => upd("localisation", v)}
              renderOption={(v) => LOCALISATION_LABELS[v]} />
          </div>
        ) : (
          <Badge className={LOCALISATION_COLORS[item.localisation]}>
            {LOCALISATION_LABELS[item.localisation]}
          </Badge>
        )}

        {/* Projet lié */}
        {editing ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-zinc-600 text-[10px] uppercase tracking-wider">Projet</span>
            <ProjetSelect value={draft.id_projet} projects={projects}
              onChange={(v) => upd("id_projet", v)} />
          </div>
        ) : projetNom ? (
          <Badge className="bg-indigo-900/40 text-indigo-300">🔗 {projetNom}</Badge>
        ) : (
          <Badge className="bg-zinc-800/50 text-zinc-600">Aucun projet</Badge>
        )}
      </div>
    </div>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

function CreateModal({
  projects, onClose, onCreate,
}: {
  projects: ProjetRef[];
  onClose: () => void;
  onCreate: (item: Omit<Item, "id_objet">) => Promise<void>;
}) {
  const [form, setForm] = useState<Omit<Item, "id_objet">>({
    nom: "", description: null, nb: 1, localisation: "indetermine", id_projet: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function upd<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.nom.trim()) { setError("Le nom est requis."); return; }
    setSaving(true);
    setError(null);
    await onCreate(form);
    setSaving(false);
  }

  const inputCls = "w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <Modal
      title="Nouvel objet"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm font-medium transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50">
            {saving && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            )}
            Créer l'objet
          </button>
        </>
      }
    >
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">
          Nom <span className="text-rose-400">*</span>
        </label>
        <input type="text" value={form.nom} onChange={(e) => upd("nom", e.target.value)}
          placeholder="Nom de l'objet" autoFocus className={inputCls} />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
        <textarea value={form.description ?? ""} rows={3}
          onChange={(e) => upd("description", e.target.value || null)}
          placeholder="Description (optionnel)" className={`${inputCls} resize-none`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Quantité</label>
          <input type="number" min={0} value={form.nb}
            onChange={(e) => upd("nb", Math.max(0, Number(e.target.value) || 0))}
            className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">Localisation</label>
          <select value={form.localisation}
            onChange={(e) => upd("localisation", e.target.value as Localisation)}
            className={inputCls}>
            {LOCALISATIONS.map((l) => <option key={l} value={l}>{LOCALISATION_LABELS[l]}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">Projet lié</label>
        <select value={form.id_projet ?? ""}
          onChange={(e) => upd("id_projet", e.target.value ? Number(e.target.value) : null)}
          className={inputCls}>
          <option value="">Aucun projet</option>
          {projects.map((p) => (
            <option key={p.id_projet} value={p.id_projet}>#{p.id_projet} — {p.nom}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-rose-400 text-sm">{error}</p>}
    </Modal>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({
  filterLoc, setFilterLoc, filterProjet, setFilterProjet,
  sortBy, setSortBy, search, setSearch, projects, total,
}: {
  filterLoc: Localisation | "all";
  setFilterLoc: (v: Localisation | "all") => void;
  filterProjet: string;
  setFilterProjet: (v: string) => void;
  sortBy: "nom" | "nb" | "localisation" | "projet";
  setSortBy: (v: "nom" | "nb" | "localisation" | "projet") => void;
  search: string;
  setSearch: (v: string) => void;
  projects: ProjetRef[];
  total: number;
}) {
  const sel = "bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44" />
      </div>
      <select value={filterLoc} onChange={(e) => setFilterLoc(e.target.value as Localisation | "all")} className={sel}>
        <option value="all">Tous les lieux</option>
        {LOCALISATIONS.map((l) => <option key={l} value={l}>{LOCALISATION_LABELS[l]}</option>)}
      </select>
      <select value={filterProjet} onChange={(e) => setFilterProjet(e.target.value)} className={sel}>
        <option value="all">Tous les projets</option>
        <option value="none">Sans projet</option>
        {projects.map((p) => <option key={p.id_projet} value={String(p.id_projet)}>{p.nom}</option>)}
      </select>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className={sel}>
        <option value="nom">Trier : Nom</option>
        <option value="nb">Trier : Quantité</option>
        <option value="localisation">Trier : Lieu</option>
        <option value="projet">Trier : Projet</option>
      </select>
      <span className="ml-auto text-xs text-zinc-600">{total} objet{total !== 1 ? "s" : ""}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InventairePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [projects, setProjects] = useState<ProjetRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [filterLoc, setFilterLoc] = useState<Localisation | "all">("all");
  const [filterProjet, setFilterProjet] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"nom" | "nb" | "localisation" | "projet">("nom");

  async function fetchData() {
    setLoading(true);
    setError(null);
    const { data: itemsData, error: itemsErr } = await supabase
      .from("inventaire").select("*").order("id_objet", { ascending: false });
    const { data: projData } = await supabase
      .from("projets").select("id_projet, nom").order("id_projet", { ascending: true });
    if (itemsErr) setError(itemsErr.message);
    else setItems((itemsData as Item[]) ?? []);
    setProjects((projData as ProjetRef[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const projectsMap: Record<number, string> = Object.fromEntries(
    projects.map((p) => [p.id_projet, p.nom])
  );

  async function handleCreate(form: Omit<Item, "id_objet">) {
    const { data, error } = await supabase.from("inventaire")
      .insert([{ nom: form.nom, description: form.description, nb: form.nb,
        localisation: form.localisation, id_projet: form.id_projet } as any])
      .select().single();
    if (error) { alert(`Erreur : ${error.message}`); return; }
    setItems((prev) => [data as Item, ...prev]);
    setShowCreate(false);
  }

  async function handleSave(updated: Item) {
    const { error } = await supabase.from("inventaire")
      .update({ nom: updated.nom, description: updated.description, nb: updated.nb,
        localisation: updated.localisation, id_projet: updated.id_projet } as any)
      .eq("id_objet", updated.id_objet);
    if (error) { alert(`Erreur : ${error.message}`); return; }
    setItems((prev) => prev.map((i) => i.id_objet === updated.id_objet ? updated : i));
  }

  async function handleDelete(id: number) {
    const { error } = await supabase.from("inventaire").delete().eq("id_objet", id);
    if (error) { alert(`Erreur : ${error.message}`); return; }
    setItems((prev) => prev.filter((i) => i.id_objet !== id));
  }

  const filtered = items
    .filter((i) => {
      if (filterLoc !== "all" && i.localisation !== filterLoc) return false;
      if (filterProjet === "none" && i.id_projet != null) return false;
      if (filterProjet !== "all" && filterProjet !== "none" && String(i.id_projet) !== filterProjet) return false;
      if (search && !i.nom.toLowerCase().includes(search.toLowerCase()) &&
        !(i.description ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "nom") return a.nom.localeCompare(b.nom);
      if (sortBy === "nb") return b.nb - a.nb;
      if (sortBy === "localisation") return LOCALISATIONS.indexOf(a.localisation) - LOCALISATIONS.indexOf(b.localisation);
      if (sortBy === "projet") {
        const an = a.id_projet != null ? (projectsMap[a.id_projet] ?? "") : "";
        const bn = b.id_projet != null ? (projectsMap[b.id_projet] ?? "") : "";
        if (!an && !bn) return 0;
        if (!an) return 1;
        if (!bn) return -1;
        return an.localeCompare(bn);
      }
      return 0;
    });

  const stats = {
    total: items.length,
    quantite: items.reduce((sum, i) => sum + (i.nb ?? 0), 0),
    lies: items.filter((i) => i.id_projet != null).length,
    nonAssignes: items.filter((i) => i.id_projet == null).length,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="font-bold text-zinc-100 text-base">📦 Inventaire</h1>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-900/30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
            </svg>
            Nouvel objet
          </button>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Objets",          value: stats.total,       color: "text-zinc-300",    bg: "bg-zinc-800/50" },
            { label: "Quantité totale", value: stats.quantite,    color: "text-indigo-300",  bg: "bg-indigo-900/20" },
            { label: "Liés à un projet", value: stats.lies,       color: "text-emerald-300", bg: "bg-emerald-900/20" },
            { label: "Non assignés",    value: stats.nonAssignes, color: "text-amber-300",   bg: "bg-amber-900/20" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-2xl border border-zinc-800 px-4 py-3`}>
              <p className="text-xs text-zinc-500">{label}</p>
              <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <FilterBar
          filterLoc={filterLoc} setFilterLoc={setFilterLoc}
          filterProjet={filterProjet} setFilterProjet={setFilterProjet}
          sortBy={sortBy} setSortBy={setSortBy}
          search={search} setSearch={setSearch}
          projects={projects} total={filtered.length}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-rose-400 text-sm">{error}</p>
            <button onClick={fetchData}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors">
              Réessayer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-zinc-600 text-sm">
              {items.length === 0 ? "Aucun objet." : "Aucun objet ne correspond aux filtres."}
            </p>
            {items.length === 0 && (
              <button onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
                Ajouter un objet
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((item) => (
              <ItemRow key={item.id_objet} item={item} projectsMap={projectsMap}
                projects={projects} onSave={handleSave} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateModal projects={projects} onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
