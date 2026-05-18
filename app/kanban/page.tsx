export default function KanbanPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-8">
        📋 Kanban
      </h1>

      <div className="grid md:grid-cols-4 gap-5">
        {["todo", "en_cours", "bloque", "termine"].map((col) => (
          <div
            key={col}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-h-[500px]"
          >
            <h2 className="font-bold capitalize mb-4">
              {col.replace("_", " ")}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
}