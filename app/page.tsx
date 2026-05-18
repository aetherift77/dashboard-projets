"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  const [priorite, setPriorite] = useState("Medium");
  const [statut, setStatut] = useState("idee");
  const [localisation, setLocalisation] =
    useState("indetermine");

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

  async function addProject() {
    if (!nom) return;

    const { error } = await supabase
      .from("projets")
      .insert({
        nom,
        description,
        deadline,
        priorite,
        statut,
        localisation,
      } as any);

    if (error) {
      console.error(error);
    }

    setNom("");
    setDescription("");
    setDeadline("");

    fetchProjects();
  }

  async function deleteProject(id: number) {
    await supabase
      .from("projets")
      .delete()
      .eq("id_projet", id);

    fetchProjects();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">
          📊 Dashboard
        </h1>

        <p className="text-zinc-400 mt-2">
          Gestion avancée des projets
        </p>
      </div>

      {/* FORM */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          Nouveau projet
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="date"
            className="bg-zinc-800 p-3 rounded-xl"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

          {/* PRIORITE */}
          <select
            value={priorite}
            onChange={(e) => setPriorite(e.target.value)}
            className="bg-zinc-800 p-3 rounded-xl"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          {/* STATUT */}
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="bg-zinc-800 p-3 rounded-xl"
          >
            <option value="idee">Idée</option>
            <option value="definition">Définition</option>
            <option value="conception">Conception</option>
            <option value="planification">Planification</option>
            <option value="construction">Construction</option>
            <option value="operationnel">Opérationnel</option>
            <option value="maintenance">Maintenance</option>
          </select>

          {/* LOCALISATION */}
          <select
            value={localisation}
            onChange={(e) =>
              setLocalisation(e.target.value)
            }
            className="bg-zinc-800 p-3 rounded-xl"
          >
            <option value="indetermine">
              Indéterminé
            </option>
            <option value="maison">Maison</option>
            <option value="apart">Appartement</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <button
          onClick={addProject}
          className="mt-4 bg-white text-black px-5 py-3 rounded-xl font-semibold"
        >
          Ajouter
        </button>
      </div>

      {/* PROJECTS */}
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((p) => (
          <div
            key={p.id_projet}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"
          >
            {/* ID */}
            <div className="text-xs text-zinc-500 mb-2">
              ID #{p.id_projet}
            </div>

            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">
                  {p.nom}
                </h2>

                <p className="text-zinc-400 mt-2">
                  {p.description}
                </p>
              </div>

              <button
                onClick={() =>
                  deleteProject(p.id_projet)
                }
                className="text-red-400"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="bg-zinc-800 px-3 py-1 rounded-lg text-sm">
                📌 {p.statut}
              </span>

              <span className="bg-zinc-800 px-3 py-1 rounded-lg text-sm">
                ⚡ {p.priorite}
              </span>

              <span className="bg-zinc-800 px-3 py-1 rounded-lg text-sm">
                📍 {p.localisation}
              </span>
            </div>

            {p.deadline && (
              <div className="mt-4 text-sm text-orange-400">
                ⏳ Deadline : {p.deadline}
              </div>
            )}
          </div>
        ))}
      </div>

      {loading && (
        <p className="text-zinc-500">
          Chargement...
        </p>
      )}
    </div>
  );
}