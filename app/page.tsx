"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

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

    await supabase.from("projets").insert({
      nom,
      description,
      statut: "idee",
      priorite: "Medium",
      deadline,
    } as any);

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

        <div className="grid md:grid-cols-3 gap-4">
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
                onClick={() => deleteProject(p.id_projet)}
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