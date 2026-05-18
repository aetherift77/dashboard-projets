"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function InventairePage() {
  const [items, setItems] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [nom, setNom] = useState("");
  const [description, setDescription] =
    useState("");

  const [nb, setNb] = useState(1);

  const [idProjet, setIdProjet] =
    useState("");

  async function fetchData() {
    const { data: itemsData } = await supabase
      .from("inventaire")
      .select(`
        *,
        projets (
          nom
        )
      `);

    const { data: projectsData } =
      await supabase
        .from("projets")
        .select("*");

    setItems(itemsData || []);
    setProjects(projectsData || []);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function addItem() {
    if (!nom) return;

    await supabase
      .from("inventaire")
      .insert({
        nom,
        description,
        nb,
        id_projet: idProjet || null,
      } as any);

    setNom("");
    setDescription("");
    setNb(1);
    setIdProjet("");

    fetchData();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">
        📦 Inventaire
      </h1>

      {/* FORM */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            className="bg-zinc-800 p-3 rounded-xl"
            placeholder="Nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />

          <input
            className="bg-zinc-800 p-3 rounded-xl"
            placeholder="Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
          />

          <input
            type="number"
            className="bg-zinc-800 p-3 rounded-xl"
            value={nb}
            onChange={(e) =>
              setNb(Number(e.target.value))
            }
          />

          {/* LINK PROJECT */}
          <select
            value={idProjet}
            onChange={(e) =>
              setIdProjet(e.target.value)
            }
            className="bg-zinc-800 p-3 rounded-xl"
          >
            <option value="">
              Aucun projet
            </option>

            {projects.map((p) => (
              <option
                key={p.id_projet}
                value={p.id_projet}
              >
                #{p.id_projet} — {p.nom}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={addItem}
          className="mt-4 bg-white text-black px-5 py-3 rounded-xl font-semibold"
        >
          Ajouter
        </button>
      </div>

      {/* ITEMS */}
      <div className="grid gap-4">
        {items.map((i) => (
          <div
            key={i.id_objet}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            <div className="text-xs text-zinc-500">
              ID #{i.id_objet}
            </div>

            <h2 className="text-xl font-bold">
              {i.nom}
            </h2>

            <p className="text-zinc-400">
              {i.description}
            </p>

            <div className="mt-3">
              Quantité : {i.nb}
            </div>

            {i.projets && (
              <div className="mt-3 text-blue-400">
                🔗 Projet : {i.projets.nom}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}