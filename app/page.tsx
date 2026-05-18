"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  // CREATE FORM
  const [nom, setNom] = useState("");
  const [description, setDescription] =
    useState("");

  const [deadline, setDeadline] =
    useState("");

  const [priorite, setPriorite] =
    useState("Medium");

  const [statut, setStatut] =
    useState("idee");

  const [localisation, setLocalisation] =
    useState("indetermine");

  // FETCH
  async function fetchProjects() {
    const { data } = await supabase
      .from("projets")
      .select("*")
      .order("date_og", {
        ascending: false,
      });

    setProjects(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  // CREATE
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

  // DELETE
  async function deleteProject(id: number) {
    await supabase
      .from("projets")
      .delete()
      .eq("id_projet", id);

    fetchProjects();
  }

  // UPDATE
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
      } as any)
      .eq("id_projet", project.id_projet);

    setEditingId(null);

    fetchProjects();
  }

  // HANDLE INLINE UPDATE
  function updateLocalProject(
    id: number,
    field: string,
    value: any
  ) {
    const updated = [...projects];

    const index = updated.findIndex(
      (p) => p.id_projet === id
    );

    updated[index][field] = value;

    setProjects(updated);
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold">
          📊 Dashboard
        </h1>

        <p className="text-zinc-400 mt-2">
          Gestion avancée des projets
        </p>
      </div>

      {/* CREATE FORM */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">
          Nouveau projet
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            className="bg-zinc-800 p-3 rounded-xl"
            placeholder="Nom"
            value={nom}
            onChange={(e) =>
              setNom(e.target.value)
            }
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
            type="date"
            className="bg-zinc-800 p-3 rounded-xl"
            value={deadline}
            onChange={(e) =>
              setDeadline(e.target.value)
            }
          />

          {/* PRIORITE */}
          <select
            value={priorite}
            onChange={(e) =>
              setPriorite(e.target.value)
            }
            className="bg-zinc-800 p-3 rounded-xl"
          >
            <option value="Low">Low</option>
            <option value="Medium">
              Medium
            </option>
            <option value="High">High</option>
          </select>

          {/* STATUT */}
          <select
            value={statut}
            onChange={(e) =>
              setStatut(e.target.value)
            }
            className="bg-zinc-800 p-3 rounded-xl"
          >
            <option value="idee">Idée</option>
            <option value="definition">
              Définition
            </option>
            <option value="conception">
              Conception
            </option>
            <option value="planification">
              Planification
            </option>
            <option value="construction">
              Construction
            </option>
            <option value="operationnel">
              Opérationnel
            </option>
            <option value="maintenance">
              Maintenance
            </option>
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

            <option value="maison">
              Maison
            </option>

            <option value="apart">
              Appartement
            </option>

            <option value="autre">
              Autre
            </option>
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

            {/* TITLE */}
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
                className="bg-zinc-800 p-2 rounded-lg w-full"
              />
            ) : (
              <h2 className="text-xl font-bold">
                {p.nom}
              </h2>
            )}

            {/* DESCRIPTION */}
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
                className="bg-zinc-800 p-2 rounded-lg w-full mt-3"
              />
            ) : (
              <p className="text-zinc-400 mt-2">
                {p.description}
              </p>
            )}

            {/* EDITABLE SELECTS */}
            <div className="mt-5 space-y-3">
              <select
                value={p.statut}
                disabled={
                  editingId !== p.id_projet
                }
                onChange={(e) =>
                  updateLocalProject(
                    p.id_projet,
                    "statut",
                    e.target.value
                  )
                }
                className="bg-zinc-800 p-2 rounded-lg w-full"
              >
                <option value="idee">
                  Idée
                </option>

                <option value="definition">
                  Définition
                </option>

                <option value="conception">
                  Conception
                </option>

                <option value="planification">
                  Planification
                </option>

                <option value="construction">
                  Construction
                </option>

                <option value="operationnel">
                  Opérationnel
                </option>

                <option value="maintenance">
                  Maintenance
                </option>
              </select>

              <select
                value={p.priorite}
                disabled={
                  editingId !== p.id_projet
                }
                onChange={(e) =>
                  updateLocalProject(
                    p.id_projet,
                    "priorite",
                    e.target.value
                  )
                }
                className="bg-zinc-800 p-2 rounded-lg w-full"
              >
                <option value="Low">
                  Low
                </option>

                <option value="Medium">
                  Medium
                </option>

                <option value="High">
                  High
                </option>
              </select>

              <select
                value={p.localisation}
                disabled={
                  editingId !== p.id_projet
                }
                onChange={(e) =>
                  updateLocalProject(
                    p.id_projet,
                    "localisation",
                    e.target.value
                  )
                }
                className="bg-zinc-800 p-2 rounded-lg w-full"
              >
                <option value="indetermine">
                  Indéterminé
                </option>

                <option value="maison">
                  Maison
                </option>

                <option value="apart">
                  Appartement
                </option>

                <option value="autre">
                  Autre
                </option>
              </select>

              {/* DEADLINE */}
              <input
                type="date"
                disabled={
                  editingId !== p.id_projet
                }
                value={p.deadline || ""}
                onChange={(e) =>
                  updateLocalProject(
                    p.id_projet,
                    "deadline",
                    e.target.value
                  )
                }
                className="bg-zinc-800 p-2 rounded-lg w-full"
              />
            </div>

            {/* BUTTONS */}
            <div className="mt-5 flex gap-3">
              {editingId === p.id_projet ? (
                <button
                  onClick={() =>
                    updateProject(p)
                  }
                  className="bg-green-500 px-4 py-2 rounded-xl"
                >
                  Sauvegarder
                </button>
              ) : (
                <button
                  onClick={() =>
                    setEditingId(
                      p.id_projet
                    )
                  }
                  className="bg-blue-500 px-4 py-2 rounded-xl"
                >
                  Modifier
                </button>
              )}

              <button
                onClick={() =>
                  deleteProject(
                    p.id_projet
                  )
                }
                className="bg-red-500 px-4 py-2 rounded-xl"
              >
                Supprimer
              </button>
            </div>
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