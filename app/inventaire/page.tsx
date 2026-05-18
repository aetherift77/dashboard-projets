"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function InventairePage() {
  const [items, setItems] = useState<any[]>([]);

  const [nom, setNom] = useState("");
  const [description, setDescription] =
    useState("");
  const [nb, setNb] = useState(1);

  async function fetchItems() {
    const { data } = await supabase
      .from("inventaire")
      .select("*");

    setItems(data || []);
  }

  useEffect(() => {
    fetchItems();
  }, []);

  async function addItem() {
    if (!nom) return;

    await supabase
      .from("inventaire")
      .insert({
        nom,
        description,
        nb,
      } as any);

    setNom("");
    setDescription("");
    setNb(1);

    fetchItems();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">
        📦 Inventaire
      </h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
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
        </div>

        <button
          onClick={addItem}
          className="mt-4 bg-white text-black px-5 py-3 rounded-xl font-semibold"
        >
          Ajouter
        </button>
      </div>

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
          </div>
        ))}
      </div>
    </div>
  );
}