"use client";

import Link from "next/link";
import { FolderKanban, Boxes, LayoutDashboard } from "lucide-react";

export default function Sidebar() {
  return (
    <aside
      className="w-64 bg-zinc-900 border-r border-zinc-800 p-5 flex flex-col gap-5"
    >
      <h1 className="text-2xl font-bold">⚡ Aether Dashboard</h1>

      <nav className="flex flex-col gap-2 mt-5">
        <Link
          href="/"
          className="flex items-center gap-2 p-3 rounded-xl hover:bg-zinc-800"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link
          href="/kanban"
          className="flex items-center gap-2 p-3 rounded-xl hover:bg-zinc-800"
        >
          <FolderKanban size={18} />
          Kanban
        </Link>

        <Link
          href="/inventaire"
          className="flex items-center gap-2 p-3 rounded-xl hover:bg-zinc-800"
        >
          <Boxes size={18} />
          Inventaire
        </Link>
      </nav>
    </aside>
  );
}