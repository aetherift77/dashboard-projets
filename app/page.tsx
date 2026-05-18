"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);

  // CREATE FORM
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  const [priorite, setPriorite] = useState("Medium");
  const [statut, setStatut] = useState("idee");
  const [localisation, setLocalisation] = useState("indetermine");

  // FETCH
  async function fetchProjects() {
    const { data } = await supabase
      .from("projets")
      .select("*")
      .order("date_og", { ascending: false });

    setProjects(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  // CREATE (FIX 3)
  async function addProject() {
    if (!nom) return;

    await supabase
      .from("projets")
      .insert([
        {
          nom,
          description,
          statut,
          priorite,
          localisation,
          deadline,
        } as any, // 🔥 FIX IMPORTANT
      ]);

    setNom("");
    setDescription("");
    setDeadline("");

    fetchProjects();
  }

  // DELETE
  async function deleteProject(id: number) {
    await supabase
      .from("projets")
      .delete()
      .eq("id_projet", id);

    fetchProjects();
  }

  // UPDATE (FIX 2)
  async function updateProject(project: any) {
    await supabase
      .from("projets")
      .update({
        nom: project.nom,
        description: project.description,
        statut: project.statut,
        priorite: project.priorite,
        localisation: project.localisation,
        deadline: project.deadline,
      } as any) // 🔥 FIX IMPORTANT
      .eq("id_projet", project.id_projet);

    setEditingId(null);
    fetchProjects();
  }

  function updateLocalProject(id: number, field: string, value: any) {
    const updated = [...projects];

    const index = updated.findIndex(
      (p) => p.id_projet === id
    );

    updated[index][field] = value;

    setProjects(updated);
  }

  return (
    <div className="space-y-8 p-6 bg-black text-white min-h-screen">
      <h1 className="text-3xl font-bold">
        📊 Dashboard Projets
      </h1>

      {/* CREATE */}
      <div className="bg-zinc-900 p-4 rounded-xl space-y-3">
        <input
          className="bg-zinc-800 p-2 rounded w-full"
          placeholder="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />

        <input
          className="bg-zinc-800 p-2 rounded w-full"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="date"
          className="bg-zinc-800 p-2 rounded w-full"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          className="bg-zinc-800 p-2 rounded w-full"
        >
          <option value="idee">Idée</option>
          <option value="definition">Définition</option>
          <option value="conception">Conception</option>
          <option value="planification">Planification</option>
          <option value="construction">Construction</option>
          <option value="operationnel">Opérationnel</option>
          <option value="maintenance">Maintenance</option>
        </select>

        <select
          value={priorite}
          onChange={(e) => setPriorite(e.target.value)}
          className="bg-zinc-800 p-2 rounded w-full"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <select
          value={localisation}
          onChange={(e) => setLocalisation(e.target.value)}
          className="bg-zinc-800 p-2 rounded w-full"
        >
          <option value="indetermine">Indéterminé</option>
          <option value="maison">Maison</option>
          <option value="apart">Appartement</option>
          <option value="autre">Autre</option>
        </select>

        <button
          onClick={addProject}
          className="bg-white text-black px-4 py-2 rounded"
        >
          Ajouter
        </button>
      </div>

      {/* LIST */}
      <div className="grid gap-4">
        {projects.map((p) => (
          <div
            key={p.id_projet}
            className="bg-zinc-900 p-4 rounded-xl"
          >
            <div className="text-xs text-gray-500">
              ID #{p.id_projet}
            </div>

            {editingId === p.id_projet ? (
              <input
                value={p.nom}
                onChange={(e) =>
                  updateLocalProject(
                    p.id_projet,
                    "nom",
                    e.target.value
                  )
                }
                className="bg-zinc-800 p-2 rounded w-full"
              />
            ) : (
              <h2 className="text-xl font-bold">
                {p.nom}
              </h2>
            )}

            {editingId === p.id_projet ? (
              <textarea
                value={p.description || ""}
                onChange={(e) =>
                  updateLocalProject(
                    p.id_projet,
                    "description",
                    e.target.value
                  )
                }
                className="bg-zinc-800 p-2 rounded w-full mt-2"
              />
            ) : (
              <p className="text-gray-400 mt-2">
                {p.description}
              </p>
            )}

            <div className="flex gap-2 mt-3 text-sm">
              <span>📌 {p.statut}</span>
              <span>⚡ {p.priorite}</span>
              <span>📍 {p.localisation}</span>
            </div>

            <div className="flex gap-2 mt-4">
              {editingId === p.id_projet ? (
                <button
                  onClick={() => updateProject(p)}
                  className="bg-green-500 px-3 py-1 rounded"
                >
                  Sauvegarder
                </button>
              ) : (
                <button
                  onClick={() =>
                    setEditingId(p.id_projet)
                  }
                  className="bg-blue-500 px-3 py-1 rounded"
                >
                  Modifier
                </button>
              )}

              <button
                onClick={() =>
                  deleteProject(p.id_projet)
                }
                className="bg-red-500 px-3 py-1 rounded"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <p className="text-gray-500">
          Chargement...
        </p>
      )}
    </div>
  );
}