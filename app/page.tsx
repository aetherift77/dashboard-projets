"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [statut, setStatut] = useState("idee");
  const [priorite, setPriorite] = useState("Medium");

  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);

    const { data } = await supabase
      .from("projets")
      .select("*")
      .order("date_og", { ascending: false });

    setProjects(data || []);
    setLoading(false);
  }

  async function addProject() {
    if (!nom) return;

    const { error } = await supabase
      .from("projets")
      .insert({
        nom,
        description,
        statut,
        priorite,
      } as any);

    if (error) {
      console.error("Insert error:", error);
    }

    setNom("");
    setDescription("");

    fetchProjects();
  }

  async function deleteProject(id: number) {
    await supabase
      .from("projets")
      .delete()
      .eq("id_projet", id);

    fetchProjects();
  }

  const filtered = projects.filter((p) => {
    if (filter === "all") return true;
    return p.statut === filter;
  });

  return (
    <main
      style={{
        padding: 30,
        background: "#0f0f0f",
        minHeight: "100vh",
        color: "white",
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 20 }}>
        📊 Dashboard Projets
      </h1>

      {/* CREATE PROJECT */}
      <div
        style={{
          marginBottom: 30,
          padding: 15,
          border: "1px solid #333",
          borderRadius: 10,
        }}
      >
        <h3>➕ Ajouter un projet</h3>

        <input
          placeholder="Nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          style={{ marginRight: 10 }}
        />

        <input
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ marginRight: 10 }}
        />

        <select value={statut} onChange={(e) => setStatut(e.target.value)}>
          <option value="idee">Idée</option>
          <option value="definition">Définition</option>
          <option value="conception">Conception</option>
          <option value="planification">Planification</option>
          <option value="construction">Construction</option>
          <option value="operationnel">Opérationnel</option>
        </select>

        <select
          value={priorite}
          onChange={(e) => setPriorite(e.target.value)}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        <button onClick={addProject} style={{ marginLeft: 10 }}>
          Ajouter
        </button>
      </div>

      {/* FILTERS */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setFilter("all")}>Tous</button>
        <button onClick={() => setFilter("idee")}>Idée</button>
        <button onClick={() => setFilter("planification")}>
          Planification
        </button>
        <button onClick={() => setFilter("construction")}>
          Construction
        </button>
      </div>

      {loading && <p>Chargement...</p>}

      {/* PROJECT LIST */}
      <div style={{ display: "grid", gap: 15 }}>
        {filtered.map((p) => (
          <div
            key={p.id_projet}
            style={{
              padding: 15,
              border: "1px solid #333",
              borderRadius: 12,
              background: "#1a1a1a",
            }}
          >
            <h2>{p.nom}</h2>
            <p style={{ opacity: 0.7 }}>{p.description}</p>

            <div style={{ display: "flex", gap: 10 }}>
              <span>📌 {p.statut}</span>
              <span>⚡ {p.priorite}</span>
            </div>

            <button
              onClick={() => deleteProject(p.id_projet)}
              style={{
                marginTop: 10,
                background: "red",
                color: "white",
                border: "none",
                padding: "5px 10px",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}